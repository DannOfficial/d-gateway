import { PluginInterface, PluginContext } from '../index'

export const funPlugin: PluginInterface = {
  name: 'fun',
  version: '1.0.0',
  description: 'Fun & entertainment commands',
  commands: [
    {
      command: 'dice',
      description: 'Roll a random die',
      category: 'fun',
      handler: async (ctx: PluginContext) => {
        const roll = Math.floor(Math.random() * 6) + 1
        return `🎲 Kamu melempar dadu dan mendapatkan angka: <b>${roll}</b>!`
      },
    },
  ],
  initialize: async () => {},
  shutdown: async () => {},
}
