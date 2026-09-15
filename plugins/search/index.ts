import { PluginInterface, PluginContext } from '../index'

export const searchPlugin: PluginInterface = {
  name: 'search',
  version: '1.0.0',
  description: 'Search tools & integrations',
  commands: [
    {
      command: 'search',
      description: 'Search query',
      category: 'search',
      handler: async (ctx: PluginContext) => {
        if (!ctx.params) return `⚠️ Silakan berikan kata kunci pencarian. Contoh: <code>/search info</code>`
        return `🔍 <b>Hasil Pencarian untuk:</b> ${ctx.params}`
      },
    },
  ],
  initialize: async () => {},
  shutdown: async () => {},
}
