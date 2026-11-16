FROM node:22-alpine AS build

RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/core ./packages/core
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
RUN pnpm --filter @expense-tracker/core build \
  && pnpm --filter @expense-tracker/database build \
  && pnpm --filter @expense-tracker/api build

FROM node:22-alpine AS runtime

RUN npm install -g pnpm@12.14.0

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/database/dist ./packages/database/dist

EXPOSE 8080

CMD ["sh", "-c", "cd /app/packages/database && node ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js && cd /app/apps/api && node dist/main.js"]
