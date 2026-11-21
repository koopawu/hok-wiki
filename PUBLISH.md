# 发布说明

本仓库由 Kimi 会话内的 GitHub 集成创建，初始提交包含：

- 项目文档：`README.md`（项目说明）、`REPORT.md`（本轮验收结论）、`PUBLISH.md`（本文件）
- 全量后端：`api/`（Hono + tRPC 路由、复盘接口、日志与限流）、`contracts/`、`db/`（Drizzle schema）
- 全部根配置：`package.json`、`vite.config.ts`、`tailwind.config.js`、tsconfig ×4、`Dockerfile`、`.dockerignore`、`drizzle.config.ts`、eslint / prettier / postcss / vitest 配置、`index.html`、`.env.example`、`.gitignore`

## 需要在本地补推的内容

以下两部分未在会话内传输，需要本地一条命令补推（传输限制，非遗漏）：

- `src/`：前端页面、组件与全部内容数据（其中 `src/data/heroDetails.generated.ts` 约 748KB 且为单行生成文件）
- `src/assets/images/`：970 张英雄 / 装备 / 铭文 / 点位素材图（约 7.7MB，版权归原作者及腾讯所有）

## 补推步骤

1. 在 Kimi 平台导出项目代码并解压到本地目录。
2. 将随会话交付的 `publish-to-github.sh` 放入项目根目录，运行：

```bash
bash publish-to-github.sh git@github.com:koopawu/hok-wiki.git
# 或 HTTPS: bash publish-to-github.sh https://github.com/koopawu/hok-wiki.git
```

脚本会安全处理：初始化 git、确认 `.env` 被 `.gitignore` 排除、提交全部源码与素材、关联远程并推送。

> 依赖锁定：`package-lock.json` 体积较大未随初始提交推送，本地补推时会一并进入仓库，之后可用 `npm ci` 精确安装。

## 声明

- 本站为非官方玩家资料站，仅供学习交流；《王者荣耀》及相关素材版权归原作者及腾讯所有。
- 经验类内容（推荐、决策、打法）不承诺胜率；数据以游戏内当前版本为准。
- 资料核对基准：S45「月照长安」，2026-10-26。
