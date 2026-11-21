import devServer from "@hono/vite-dev-server"
import fs from 'node:fs'
import path from 'node:path'

const __dirname = import.meta.dirname
import { createHash } from 'node:crypto'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { inspectAttr } from 'kimi-plugin-inspect-react'

const IMAGE_ROOT = path.resolve(__dirname, 'src/assets/images')
const DIST_ROOT = path.resolve(__dirname, 'dist')
const IMAGE_EXTENSION = /\.(?:webp|jpe?g|png)$/i

function listFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? listFiles(file) : [file]
  })
}

function hash(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex')
}

function cleanBuildOutput(): Plugin {
  return {
    name: 'clean-build-output',
    apply: 'build',
    async buildStart() {
      // 挂载存储偶发在递归删除时返回 ENOTEMPTY，自行有限重试替代 Vite 的一次性清理。
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          fs.rmSync(DIST_ROOT, { recursive: true, force: true, maxRetries: 5, retryDelay: 80 })
          if (!fs.existsSync(DIST_ROOT)) return
        } catch (error) {
          if (attempt === 4) throw error
        }
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
      }
      throw new Error('旧构建目录清理失败，请重试构建')
    },
  }
}

/**
 * 图片不再从 public 事后补拷。构建时验证数据引用、打包数量与逐文件哈希；
 * 任一图片缺失或被截断都会直接让构建失败，避免带裂图进入预览版本。
 */
function verifyBundledImages(): Plugin {
  let sourceHashes: string[] = []
  const emittedImages = new Map<string, string>()

  return {
    name: 'verify-bundled-images',
    apply: 'build',
    buildStart() {
      const sourceFiles = listFiles(IMAGE_ROOT).filter(file => IMAGE_EXTENSION.test(file))
      sourceHashes = [...new Set(sourceFiles.map(file => hash(fs.readFileSync(file))))].sort()
      if (sourceFiles.length === 0) throw new Error('未找到构建图片资源')

      const missingReferences: string[] = []
      for (const file of listFiles(path.resolve(__dirname, 'src'))) {
        if (!/\.(?:ts|tsx|css)$/.test(file)) continue
        const source = fs.readFileSync(file, 'utf8')
        for (const match of source.matchAll(/["'`](\/images\/[^"'`\s?#]+)["'`]/g)) {
          const logicalPath = match[1]
          if (!fs.existsSync(path.join(IMAGE_ROOT, logicalPath.replace('/images/', '')))) {
            missingReferences.push(`${path.relative(__dirname, file)} → ${logicalPath}`)
          }
        }
      }
      if (missingReferences.length) {
        throw new Error(`图片引用不存在：\n${missingReferences.join('\n')}`)
      }

      const missingHeroFallbacks = sourceFiles
        .filter(file => file.includes(`${path.sep}heroes${path.sep}`) && file.endsWith('.webp'))
        .filter(file => !fs.existsSync(file.replace(/\.webp$/, '.jpg')))
      if (missingHeroFallbacks.length) {
        throw new Error(`英雄备用头像缺失：${missingHeroFallbacks.join(', ')}`)
      }
    },
    generateBundle(_options, bundle) {
      emittedImages.clear()
      for (const output of Object.values(bundle)) {
        if (output.type === 'asset' && IMAGE_EXTENSION.test(output.fileName)) {
          emittedImages.set(output.fileName, hash(output.source))
        }
      }
      const emittedHashes = [...new Set(emittedImages.values())].sort()
      if (sourceHashes.length !== emittedHashes.length || sourceHashes.some((value, index) => value !== emittedHashes[index])) {
        throw new Error(`图片打包校验失败：源文件含 ${sourceHashes.length} 份独立内容，构建产物含 ${emittedHashes.length} 份，或内容哈希不一致`)
      }
    },
    async writeBundle() {
      for (const [fileName, expectedHash] of emittedImages) {
        const outputFile = path.join(DIST_ROOT, 'public', fileName)
        let verified = false
        // 挂载存储的文件落盘可能短暂延迟可见；有限重试后仍不一致则判定失败。
        for (let attempt = 0; attempt < 5 && !verified; attempt += 1) {
          try {
            verified = fs.existsSync(outputFile) && hash(fs.readFileSync(outputFile)) === expectedHash
          } catch {
            verified = false
          }
          if (!verified) await new Promise(resolve => setTimeout(resolve, 60 * (attempt + 1)))
        }
        if (!verified) throw new Error(`构建图片落盘校验失败：${fileName}`)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    cleanBuildOutput(), inspectAttr(), react(), verifyBundledImages()],
  build: {
    outDir: 'dist/public',
    // 由 cleanBuildOutput 有限重试清理，避免挂载存储偶发 ENOTEMPTY 中断构建。
    emptyOutDir: false,
    // 图片全部使用带哈希的独立文件，避免小图标内联膨胀 JS，也便于缓存更新。
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@contracts': path.resolve(__dirname, './contracts'),
    },
  },
  envDir: path.resolve(__dirname),
})
