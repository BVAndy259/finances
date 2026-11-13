FROM node:22-alpine AS build

RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm --filter @expense-tracker/api build

FROM node:22-alpine AS runtime

RUN npm install -g pnpm@12.14.0

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["sh", "-c", "node ./node_modules/typeorm/cli.js migration:run -d dist/infrastructure/out/persistence/typeorm/data-source.js && node dist/main.js"]
