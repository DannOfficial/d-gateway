import { MongoClient, ObjectId } from 'mongodb'

const globalForMongo = globalThis

export async function getDb() {
  const uri = 'mongodb+srv://DanzFav:Danz4477@database.geqksdm.mongodb.net/dannteam?retryWrites=true&w=majority&appName=database'
  const client = globalForMongo.__mongoClient || new MongoClient(uri)
  globalForMongo.__mongoClient = client
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
    timezone: bot.timezone || 'UTC',
    rpgMode: Boolean(bot.rpgMode),
    footer: bot.footer || '',
    createdAt: bot.createdAt || new Date(),
    lastMessageAt: bot.lastMessageAt || null,
  }
}
