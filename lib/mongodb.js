import { MongoClient, ObjectId } from 'mongodb'

const globalForMongo = globalThis

export async function getDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured')
  const client = globalForMongo.__mongoClient || new MongoClient(uri)
  globalForMongo.__mongoClient = client
  await client.connect()
  return client.db()
}

export { ObjectId }

export function publicBot(bot) {
  if (!bot) return null
  return {
    id: bot._id ? bot._id.toString() : bot.id,
    name: bot.name || 'Telegram Bot',
    username: bot.username || null,
    status: bot.status || 'stopped',
    commands: bot.commands || 0,
    webhookUrl: bot.webhookUrl || null,
    timezone: bot.timezone || 'UTC',
    rpgMode: Boolean(bot.rpgMode),
    footer: bot.footer || '',
    createdAt: bot.createdAt || new Date(),
    lastMessageAt: bot.lastMessageAt || null,
    error: bot.error || null,
  }
}
