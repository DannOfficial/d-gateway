import { ObjectId } from 'mongodb'

export async function syncBotCommandsWithTelegram(db: any, botId: any) {
  if (!botId || !ObjectId.isValid(botId)) return
  try {
    const bot = await db.collection('bots').findOne({ _id: new ObjectId(botId) })
    if (!bot || !bot.token) return

    const customCmds = await db.collection('commands').find({ botId: new ObjectId(botId) }).toArray()
    const telegramCommands = [
      { command: 'start', description: 'Initialize bot workspace' },
      { command: 'help', description: 'View commands menu' },
      { command: 'status', description: 'View gateway status' },
      { command: 'ping', description: 'Check response ping' },
      { command: 'rpg', description: 'RPG Player Profile' },
      ...customCmds.map((c: any) => ({
        command: String(c.command || '').replace(/^\//, '').toLowerCase().slice(0, 32),
        description: String(c.description || c.response || 'Custom command').slice(0, 256),
      })),
    ].slice(0, 100)

    await fetch(`https://api.telegram.org/bot${bot.token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: telegramCommands }),
    })
  } catch (err) {
    console.error(`[Telegram Sync Error] Failed to sync setMyCommands for bot ${botId}:`, err)
  }
}
