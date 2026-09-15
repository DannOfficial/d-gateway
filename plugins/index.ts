import { rpgPlugin } from './rpg'
import { utilityPlugin } from './utility'
import { mediaPlugin } from './media'
import { searchPlugin } from './search'
import { funPlugin } from './fun'
import { adminPlugin } from './admin'
import { apiPlugin } from './api'

export interface PluginContext {
  bot: any
  message: any
  chatId: number | string
  senderId?: number | string
  senderUsername?: string
  text: string
  command: string
  params: string
  db: any
  sendReply: (text: string, options?: any) => Promise<any>
}

export interface PluginCommand {
  command: string
  aliases?: string[]
  description: string
  category: string
  permissions?: 'user' | 'admin' | 'superadmin' | 'owner'
  cooldown?: number
  handler: (ctx: PluginContext) => Promise<string | void>
}

export interface PluginInterface {
  name: string
  version: string
  description: string
  commands: PluginCommand[]
  initialize: () => Promise<void>
  shutdown: () => Promise<void>
}

class PluginRegistry {
  private plugins: Map<string, PluginInterface> = new Map()

  constructor() {
    this.register(rpgPlugin)
    this.register(utilityPlugin)
    this.register(mediaPlugin)
    this.register(searchPlugin)
    this.register(funPlugin)
    this.register(adminPlugin)
    this.register(apiPlugin)
  }

  register(plugin: PluginInterface) {
    this.plugins.set(plugin.name, plugin)
    plugin.initialize().catch((err) => {
      console.error(`[PluginManager] Failed to initialize plugin ${plugin.name}:`, err)
    })
  }

  getPlugin(name: string): PluginInterface | undefined {
    return this.plugins.get(name)
  }

  getAllPlugins(): PluginInterface[] {
    return Array.from(this.plugins.values())
  }

  getCommandMap(): Map<string, PluginCommand> {
    const cmdMap = new Map<string, PluginCommand>()
    for (const plugin of this.plugins.values()) {
      for (const cmd of plugin.commands) {
        cmdMap.set(cmd.command.toLowerCase(), cmd)
        if (cmd.aliases) {
          for (const alias of cmd.aliases) {
            cmdMap.set(alias.toLowerCase(), cmd)
          }
        }
      }
    }
    return cmdMap
  }
}

export const pluginRegistry = new PluginRegistry()
