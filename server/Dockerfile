FROM oven/bun:1.1.34 AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate


FROM oven/bun:1.1.34

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV ENV=production

COPY --from=build /app/package.json /app/bun.lockb* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/types ./types
COPY --from=build /app/utils ./utils
COPY --from=build /app/generated ./generated

EXPOSE 3000

CMD ["bun", "start"]