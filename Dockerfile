FROM node:22-alpine AS build

RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm build

FROM node:22-alpine AS runtime

RUN npm install -g pnpm@12.14.0

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["sh", "-c", "node ./node_modules/typeorm/cli.js migration:run -d dist/infrastructure/out/persistence/typeorm/data-source.js && node dist/main.js"]
