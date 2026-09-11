import { MongoClient, ObjectId } from 'mongodb'

const globalForMongo = globalThis

export async function getDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dann_tele'
  const client = globalForMongo.__mongoClient || new MongoClient(uri)
  if (process.env.NODE_ENV !== 'production') globalForMongo.__mongoClient = client
  try {
    await client.connect()
  } catch (err) {
    console.error('MongoDB connection error:', err)
  }
  return client.db()
}

export { ObjectId }

export function publicBot(bot) {
  if (!bot) return null
  return {
    id: bot._id ? bot._id.toString() : bot.id,
    name: bot.name || 'Telegram Bot',
    username: bot.username || null,
    status: bot.status || 'pending',
    commands: bot.commands || 0,
    webhookUrl: bot.webhookUrl || null,
    createdAt: bot.createdAt || new Date(),
    lastMessageAt: bot.lastMessageAt || null,
  }
}
