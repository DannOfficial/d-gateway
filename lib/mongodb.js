import { MongoClient } from 'mongodb'

const globalForMongo = globalThis

export async function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured')
  const client = globalForMongo.__mongoClient || new MongoClient(uri)
  if (process.env.NODE_ENV !== 'production') globalForMongo.__mongoClient = client
  await client.connect()
  return client.db()
}

export function publicBot(bot) {
  return { id: bot._id.toString(), name: bot.name, username: bot.username, status: bot.status, commands: bot.commands || 0, createdAt: bot.createdAt }
}
