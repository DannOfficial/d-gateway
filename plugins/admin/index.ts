import { PluginInterface, PluginContext } from '../index'

export const adminPlugin: PluginInterface = {
  name: 'admin',
  version: '1.0.0',
  description: 'Bot administration commands',
  commands: [
    {
      command: 'botinfo',
      description: 'Get bot system info',
      category: 'admin',
      permissions: 'admin',
      handler: async (ctx: PluginContext) => {
        return `🛡️ <b>Bot System Info</b>\nName: ${ctx.bot.name}\nCommands executed: ${ctx.bot.commands || 0}`
      },
    },
  ],
  initialize: async () => {},
  shutdown: async () => {},
}
