FROM node:20-alpine AS base

FROM base AS builder

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN yarn global add turbo@2.1.3
COPY . .

RUN turbo prune @typefast/ws --docker

FROM base AS installer

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=builder /app/out/json .
RUN YARN_NETWORK_TIMEOUT=1200000 yarn install --frozen-lockfile --network-timeout 1200000

COPY --from=builder /app/out/full .
RUN yarn build

FROM base AS runner

WORKDIR /app

COPY --from=installer /app/ .

EXPOSE 8080

CMD yarn workspace @typefast/ws start
