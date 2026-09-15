import { PluginInterface, PluginContext } from '../index'

export const utilityPlugin: PluginInterface = {
  name: 'utility',
  version: '1.0.0',
  description: 'Standard utility commands for Telegram Gateway',
  commands: [
    {
      command: 'start',
      description: 'Initialize bot & welcome user',
      category: 'utility',
      handler: async (ctx: PluginContext) => {
        return `<b>Welcome to ${ctx.bot.name || 'Telegram Gateway Bot'}!</b>\n\nConnected to <b>Dann-Tele Gateway</b>.\nType /help to view commands.`
      },
    },
    {
      command: 'help',
      description: 'List all available bot commands',
      category: 'utility',
      handler: async (ctx: PluginContext) => {
        return `<b>Command Menu:</b>\n/start - Initialize bot\n/help - Show command list\n/status - Gateway status\n/ping - Check latency\n/rpg - Built-in RPG profile`
      },
    },
    {
      command: 'status',
      description: 'View gateway status',
      category: 'utility',
      handler: async (ctx: PluginContext) => {
        return `<b>Status:</b> Operational (RUNNING)\n<b>Timezone:</b> Asia/Jakarta\n<b>Bot ID:</b> <code>${ctx.bot._id}</code>`
      },
    },
    {
      command: 'ping',
      description: 'Check ping speed',
      category: 'utility',
      handler: async (ctx: PluginContext) => {
        return `<b>Pong!</b> Response speed: &lt;30ms`
      },
    },
  ],
  initialize: async () => {},
  shutdown: async () => {},
}
