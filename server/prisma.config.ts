import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const user = env('MONGO_USER')
const pass = env('MONGO_PASSWORD')
const host = env('MONGO_HOST')
const port = env('MONGO_PORT')
const db   = env('MONGO_DB')

const databaseUrl = `mongodb://${user}:${pass}@${host}:${port}/${db}?authSource=admin`

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: databaseUrl,
  },
})