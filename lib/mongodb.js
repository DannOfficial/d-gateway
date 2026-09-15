import { MongoClient, ObjectId } from 'mongodb'

const globalForMongo = globalThis
let indexesCreated = false

export async function ensureIndexes(db) {
  if (indexesCreated) return
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true }).catch(() => {})
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true }).catch(() => {})
    await db.collection('bots').createIndex({ userId: 1 }).catch(() => {})
    await db.collection('commands').createIndex({ botId: 1, command: 1 }).catch(() => {})
    await db.collection('logs').createIndex({ botId: 1, createdAt: -1 }).catch(() => {})
    await db.collection('api_logs').createIndex({ botId: 1, createdAt: -1 }).catch(() => {})
    await db.collection('central_logs').createIndex({ category: 1, createdAt: -1 }).catch(() => {})
    await db.collection('rpg_players').createIndex({ key: 1 }, { unique: true }).catch(() => {})
    await db.collection('rpg_players').createIndex({ money: -1 }).catch(() => {})
    await db.collection('processed_updates').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }).catch(() => {})
    indexesCreated = true
  } catch (err) {
    console.error('Error creating MongoDB indexes:', err)
  }
}

export async function getDb() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://DanzFav:Danz4477@database.geqksdm.mongodb.net/dani?retryWrites=true&w=majority&appName=database"
  if (!uri) throw new Error('MONGODB_URI is not configured')
  const client = globalForMongo.__mongoClient || new MongoClient(uri)
  globalForMongo.__mongoClient = client
  await client.connect()
  const db = client.db()
  ensureIndexes(db).catch(() => {})
  return db
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
    timezone: 'Asia/Jakarta',
    footer: bot.footer || '',
    createdAt: bot.createdAt || new Date(),
    lastMessageAt: bot.lastMessageAt || null,
    error: bot.error || null,
  }
}
