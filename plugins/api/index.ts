import { PluginInterface, PluginContext } from '../index'

export const apiPlugin: PluginInterface = {
  name: 'api',
  version: '1.0.0',
  description: 'External API integration runner',
  commands: [],
  initialize: async () => {},
  shutdown: async () => {},
}
