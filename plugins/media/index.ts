import { PluginInterface, PluginContext } from '../index'

export const mediaPlugin: PluginInterface = {
  name: 'media',
  version: '1.0.0',
  description: 'Media downloading & transformation plugin',
  commands: [
    {
      command: 'mediahelp',
      description: 'Media helper info',
      category: 'media',
      handler: async (ctx: PluginContext) => {
        return `📹 <b>Media Tools</b>\nSupport for photo, audio, and video transformations via gateway.`
      },
    },
  ],
  initialize: async () => {},
  shutdown: async () => {},
}
