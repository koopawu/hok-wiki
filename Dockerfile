FROM node:22-alpine AS build
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /code
ENV NODE_ENV=production
COPY --from=build /code/dist ./dist
COPY --from=build /code/.env ./.env
COPY --from=build /code/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/boot.js"]
