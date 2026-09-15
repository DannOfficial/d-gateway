import { PluginInterface, PluginContext } from '../index'
import { getOrCreatePlayer, checkAndAddXp, SHOP_CATALOG, formatTimeRemaining } from '../../lib/rpg'

export const rpgPlugin: PluginInterface = {
  name: 'rpg',
  version: '1.0.0',
  description: 'Full MVP RPG Game Engine built directly into Telegram Gateway',
  commands: [
    {
      command: 'rpg',
      aliases: ['profile'],
      description: 'View full RPG Player Profile',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const reqXp = player.level * 150
        const weapon = player.equipment?.weapon || 'None'
        const armor = player.equipment?.armor || 'None'

        return `🎮 <b>RPG Profile - ${player.nama}</b> (Lvl ${player.level})\n` +
          `❤️ HP: ${player.health}/${player.maxHp} | ⭐ XP: ${player.xp}/${reqXp}\n` +
          `💵 Cash: $${player.money} | 🏦 Bank: $${player.bank}\n` +
          `⚔️ Weapon: ${weapon} | 🛡️ Armor: ${armor}\n` +
          `🐱 Pets: ${player.hewan?.join(', ') || 'None'}\n` +
          `🌱 Crops: ${player.tanaman?.join(', ') || 'None'}\n` +
          `🏙️ City: ${player.kota || 'Jakarta'}`
      },
    },
    {
      command: 'stats',
      description: 'View player combat stats',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        let atk = player.level * 10
        let def = player.level * 5

        if (player.equipment?.weapon === 'Wooden Sword') atk += 15
        if (player.equipment?.weapon === 'Iron Blade') atk += 35
        if (player.equipment?.weapon === 'Dragon Slayer') atk += 100
        if (player.equipment?.armor === 'Leather Armor') def += 10
        if (player.equipment?.armor === 'Steel Cuirass') def += 45

        return `📊 <b>Combat Stats - ${player.nama}</b>\n` +
          `⭐ Level: ${player.level}\n` +
          `⚔️ Attack: ${atk}\n` +
          `🛡️ Defense: ${def}\n` +
          `❤️ Max HP: ${player.maxHp}\n` +
          `⚡ Stamina: ${player.stamina || 50}/${player.maxStamina || 50}`
      },
    },
    {
      command: 'inventory',
      aliases: ['inv'],
      description: 'View item inventory',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const items = player.inventory || []
        if (items.length === 0) return `🎒 <b>Inventory is empty!</b>\nVisit <code>/shop</code> to buy items.`

        const list = items.map((i: any) => `• <b>${i.name}</b> x${i.count || 1} [${i.rarity || 'Common'}]`).join('\n')
        return `🎒 <b>Inventory (${player.nama})</b>\n\n${list}`
      },
    },
    {
      command: 'hunt',
      description: 'Hunt wild monsters for XP & Gold',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const now = Date.now()
        const lastHunt = player.cooldowns?.hunt || 0
        const cooldownMs = 60 * 1000
        if (now - lastHunt < cooldownMs) {
          const rem = cooldownMs - (now - lastHunt)
          return `⏳ <b>Hunting Cooldown:</b> Wait ${formatTimeRemaining(rem)} before hunting again.`
        }

        const monsters = ['Wild Goblin', 'Forest Wolf', 'Shadow Bandit', 'Desert Scorpion', 'Fire Drake']
        const monster = monsters[Math.floor(Math.random() * monsters.length)]
        const isVictory = Math.random() > 0.2

        if (isVictory) {
          const gold = Math.floor(Math.random() * 100) + 50
          const xp = Math.floor(Math.random() * 80) + 40
          const res = await checkAndAddXp(ctx.db, playerKey, player, xp, gold)

          await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, {
            $set: { 'cooldowns.hunt': now },
            $inc: { 'quests.0.progress': 1 },
          })

          let text = `⚔️ <b>Hunting Victory!</b>\nYou defeated <b>${monster}</b>!\n💰 +$${gold} Gold | ⭐ +${xp} XP`
          if (res.leveledUp) text += `\n🎉 <b>LEVEL UP!</b> You reached <b>Level ${res.newLevel}</b>!`
          return text
        } else {
          const dmg = Math.floor(Math.random() * 20) + 10
          const newHp = Math.max(0, player.health - dmg)
          await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, {
            $set: { health: newHp, 'cooldowns.hunt': now },
          })
          return `💥 <b>Hunting Defeat!</b>\n<b>${monster}</b> ambushed you! Lost -${dmg} HP. (Current HP: ${newHp}/${player.maxHp})`
        }
      },
    },
    {
      command: 'farm',
      description: 'Harvest crops for gold',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const now = Date.now()
        const lastFarm = player.cooldowns?.farm || 0
        const cooldownMs = 120 * 1000
        if (now - lastFarm < cooldownMs) {
          return `🌾 <b>Farming Cooldown:</b> Crops are growing! Wait ${formatTimeRemaining(cooldownMs - (now - lastFarm))}.`
        }

        const gold = Math.floor(Math.random() * 120) + 80
        const xp = 30
        const res = await checkAndAddXp(ctx.db, playerKey, player, xp, gold)

        await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, {
          $set: { 'cooldowns.farm': now },
          $inc: { 'quests.1.progress': 1 },
        })

        let text = `🌾 <b>Farm Harvest Success!</b>\nYou harvested fresh crops: 💰 +$${gold} Gold | ⭐ +${xp} XP`
        if (res.leveledUp) text += `\n🎉 <b>LEVEL UP!</b> You reached <b>Level ${res.newLevel}</b>!`
        return text
      },
    },
    {
      command: 'daily',
      description: 'Claim daily reward bonus',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const today = new Date().toISOString().slice(0, 10)
        const atomicRes = await ctx.db.collection('rpg_players').updateOne(
          { key: playerKey, dailyAt: { $ne: today } },
          { $set: { dailyAt: today } }
        )

        if (atomicRes.modifiedCount === 0) {
          return `⏳ <b>Daily Reward Claimed!</b>\nYou already claimed today's reward. Come back tomorrow!`
        }

        const bonusGold = 500
        const bonusXp = 200
        const res = await checkAndAddXp(ctx.db, playerKey, player, bonusXp, bonusGold)

        let text = `🎁 <b>Daily Bonus Claimed!</b>\nReceived: 💰 +$${bonusGold} Cash | ⭐ +${bonusXp} XP`
        if (res.leveledUp) text += `\n🎉 <b>LEVEL UP!</b> You reached <b>Level ${res.newLevel}</b>!`
        return text
      },
    },
    {
      command: 'work',
      description: 'Work a daily job for steady cash',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const now = Date.now()
        const lastWork = player.cooldowns?.work || 0
        const cooldownMs = 180 * 1000
        if (now - lastWork < cooldownMs) {
          return `💼 <b>Work Cooldown:</b> You are resting. Wait ${formatTimeRemaining(cooldownMs - (now - lastWork))}.`
        }

        const jobs = ['Guild Questmaster', 'Blacksmith Assistant', 'Merchant Guard', 'Alchemist Helper']
        const job = jobs[Math.floor(Math.random() * jobs.length)]
        const gold = Math.floor(Math.random() * 200) + 150
        const xp = 50

        const res = await checkAndAddXp(ctx.db, playerKey, player, xp, gold)
        await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, {
          $set: { 'cooldowns.work': now },
        })

        let text = `💼 <b>Worked as ${job}!</b>\nEarned: 💰 +$${gold} Cash | ⭐ +${xp} XP`
        if (res.leveledUp) text += `\n🎉 <b>LEVEL UP!</b> You reached <b>Level ${res.newLevel}</b>!`
        return text
      },
    },
    {
      command: 'adventure',
      description: 'Embark on a grand dungeon adventure',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const now = Date.now()
        const lastAdv = player.cooldowns?.adventure || 0
        const cooldownMs = 300 * 1000
        if (now - lastAdv < cooldownMs) {
          return `🧭 <b>Adventure Cooldown:</b> Recovering stamina. Wait ${formatTimeRemaining(cooldownMs - (now - lastAdv))}.`
        }

        const dungeons = ['Ancient Ruins', 'Dragon Spire', 'Forgotten Crypt', 'Celestial Tower']
        const dungeon = dungeons[Math.floor(Math.random() * dungeons.length)]
        const gold = Math.floor(Math.random() * 350) + 200
        const xp = 150

        const res = await checkAndAddXp(ctx.db, playerKey, player, xp, gold)
        await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, {
          $set: { 'cooldowns.adventure': now },
        })

        let text = `🧭 <b>Explored ${dungeon}!</b>\nFound ancient treasure: 💰 +$${gold} Gold | ⭐ +${xp} XP`
        if (res.leveledUp) text += `\n🎉 <b>LEVEL UP!</b> You reached <b>Level ${res.newLevel}</b>!`
        return text
      },
    },
    {
      command: 'fight',
      aliases: ['battle'],
      description: 'Engage in a arena boss fight',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        if (player.health < 20) {
          return `⚠️ <b>Health Too Low!</b> You have ${player.health} HP. Buy potions with <code>/buy potion</code> or rest.`
        }

        const bosses = ['Shadow Demon Lord', 'Inferno Golem', 'Frost Lich King']
        const boss = bosses[Math.floor(Math.random() * bosses.length)]
        const victory = Math.random() > 0.3

        if (victory) {
          const gold = 500
          const xp = 300
          const res = await checkAndAddXp(ctx.db, playerKey, player, xp, gold)

          let text = `🗡️ <b>BOSS VICTORY!</b>\nYou slayed <b>${boss}</b>!\n💰 +$${gold} Gold | ⭐ +${xp} XP`
          if (res.leveledUp) text += `\n🎉 <b>LEVEL UP!</b> You reached <b>Level ${res.newLevel}</b>!`
          return text
        } else {
          const lossHp = Math.min(player.health, 35)
          const newHp = player.health - lossHp
          await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, { $set: { health: newHp } })
          return `💥 <b>BOSS DEFEAT!</b>\n<b>${boss}</b> overwhelmed you! Lost -${lossHp} HP. (Current HP: ${newHp}/${player.maxHp})`
        }
      },
    },
    {
      command: 'shop',
      description: 'Browse weapons, armors, and potions',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const catalogText = SHOP_CATALOG.map((item) => `• <b>${item.name}</b> (${item.rarity}) - 💰 $${item.price}\n  <i>${item.description}</i> | ID: <code>${item.id}</code>`).join('\n\n')
        return `🛒 <b>RPG Item Shop Catalog</b>\n\n${catalogText}\n\nTo purchase: <code>/buy &lt;item_id&gt;</code>`
      },
    },
    {
      command: 'buy',
      description: 'Purchase an item from the shop',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const itemId = ctx.params?.trim().toLowerCase()
        if (!itemId) return `⚠️ Please specify item ID. Example: <code>/buy potion</code>`

        const shopItem = SHOP_CATALOG.find((i) => i.id === itemId || i.name.toLowerCase() === itemId)
        if (!shopItem) return `⚠️ Item not found in shop. Check <code>/shop</code> for available IDs.`

        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        if ((player.money || 0) < shopItem.price) {
          return `💸 <b>Insufficient Cash!</b> <b>${shopItem.name}</b> costs $${shopItem.price}. You have $${player.money}.`
        }

        const inv = player.inventory || []
        const existingIndex = inv.findIndex((i: any) => i.id === shopItem.id)

        if (existingIndex > -1) {
          inv[existingIndex].count = (inv[existingIndex].count || 1) + 1
        } else {
          inv.push({ id: shopItem.id, name: shopItem.name, count: 1, rarity: shopItem.rarity })
        }

        const atomicRes = await ctx.db.collection('rpg_players').updateOne(
          { key: playerKey, money: { $gte: shopItem.price } },
          { $inc: { money: -shopItem.price }, $set: { inventory: inv, updatedAt: new Date() } }
        )

        if (atomicRes.modifiedCount === 0) {
          return `💸 <b>Transaction Failed!</b> Insufficient cash or concurrent transaction.`
        }

        return `✅ <b>Purchased ${shopItem.name}!</b>\nSpent $${shopItem.price}. Remaining cash: $${player.money - shopItem.price}.`
      },
    },
    {
      command: 'sell',
      description: 'Sell item from inventory for cash',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const itemId = ctx.params?.trim().toLowerCase()
        if (!itemId) return `⚠️ Specify item to sell. Example: <code>/sell potion</code>`

        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const inv = player.inventory || []
        const index = inv.findIndex((i: any) => i.id === itemId || i.name.toLowerCase().includes(itemId))

        if (index === -1) return `⚠️ Item not found in your <code>/inventory</code>.`

        const item = inv[index]
        const refund = Math.floor((SHOP_CATALOG.find((s) => s.id === item.id)?.price || 50) * 0.6)

        if ((item.count || 1) > 1) {
          inv[index].count -= 1
        } else {
          inv.splice(index, 1)
        }

        await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, {
          $set: { inventory: inv, updatedAt: new Date() },
          $inc: { money: refund },
        })

        return `💰 <b>Sold ${item.name}!</b> Received +$${refund} cash.`
      },
    },
    {
      command: 'use',
      description: 'Use a potion or consumable item',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const itemId = ctx.params?.trim().toLowerCase() || 'potion'
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const inv = player.inventory || []
        const index = inv.findIndex((i: any) => i.id === itemId || i.name.toLowerCase().includes(itemId))

        if (index === -1) return `⚠️ You do not have <b>${itemId}</b> in your inventory.`

        const item = inv[index]
        const healAmt = item.id === 'elixir' ? 120 : 50
        const newHp = Math.min(player.maxHp, player.health + healAmt)

        if ((item.count || 1) > 1) {
          inv[index].count -= 1
        } else {
          inv.splice(index, 1)
        }

        await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, {
          $set: { health: newHp, inventory: inv, updatedAt: new Date() },
        })

        return `✨ <b>Used ${item.name}!</b> Restored +${healAmt} HP. (Current HP: ${newHp}/${player.maxHp})`
      },
    },
    {
      command: 'equip',
      description: 'Equip weapon or armor from inventory',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const itemName = ctx.params?.trim()
        if (!itemName) return `⚠️ Specify item to equip. Example: <code>/equip Wooden Sword</code>`

        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const shopItem = SHOP_CATALOG.find((s) => s.name.toLowerCase() === itemName.toLowerCase() || s.id === itemName.toLowerCase())
        if (!shopItem || (shopItem.type !== 'weapon' && shopItem.type !== 'armor')) {
          return `⚠️ Item cannot be equipped. Must be a valid weapon or armor.`
        }

        const slot = shopItem.type
        const equipment = player.equipment || { weapon: null, armor: null }
        equipment[slot] = shopItem.name

        await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, { $set: { equipment, updatedAt: new Date() } })

        return `🛡️ <b>Equipped ${shopItem.name}!</b> (${slot.toUpperCase()} slot active)`
      },
    },
    {
      command: 'unequip',
      description: 'Unequip weapon or armor',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const slot = ctx.params?.trim().toLowerCase()
        if (slot !== 'weapon' && slot !== 'armor') return `⚠️ Specify slot to unequip: <code>/unequip weapon</code> or <code>/unequip armor</code>`

        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const equipment = player.equipment || { weapon: null, armor: null }
        equipment[slot] = null

        await ctx.db.collection('rpg_players').updateOne({ key: playerKey }, { $set: { equipment, updatedAt: new Date() } })
        return `🔓 <b>Unequipped ${slot}!</b>`
      },
    },
    {
      command: 'quests',
      description: 'View active quests and claim rewards',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const quests = player.quests || []
        const list = quests.map((q: any) => {
          const status = q.completed ? '✅ Completed' : `${q.progress}/${q.target}`
          return `• <b>${q.name}</b> [${status}]\n  Reward: 💰 $${q.rewardGold} | ⭐ ${q.rewardXp} XP`
        }).join('\n\n')

        return `📜 <b>Active Quests - ${player.nama}</b>\n\n${list}`
      },
    },
    {
      command: 'leaderboard',
      aliases: ['top'],
      description: 'View top RPG players ranking',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const topPlayers = await ctx.db.collection('rpg_players').find({}).sort({ money: -1 }).limit(10).toArray()
        if (topPlayers.length === 0) return `🏆 <b>RPG Leaderboard</b>\nNo players ranked yet.`

        const rows = topPlayers.map((p: any, idx: number) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`
          return `${medal} <b>${p.nama}</b> (Lvl ${p.level || 1}) - 💰 $${p.money || 0}`
        }).join('\n')

        return `🏆 <b>Global RPG Leaderboard</b>\n\n${rows}`
      },
    },
    {
      command: 'cooldown',
      aliases: ['cd'],
      description: 'Check active command cooldown timers',
      category: 'rpg',
      handler: async (ctx: PluginContext) => {
        const playerKey = `${ctx.bot._id}:${ctx.chatId}:${ctx.senderId}`
        const player = await getOrCreatePlayer(ctx.db, playerKey, {
          id: String(ctx.senderId || '123'),
          nama: ctx.senderUsername || 'Hero',
          tag: `@${ctx.senderUsername || 'hero'}`,
        })

        const cds = player.cooldowns || {}
        const now = Date.now()
        const checkCd = (label: string, time: number, cdMs: number) => {
          if (!time || now - time >= cdMs) return `• <b>${label}:</b> ✅ Ready`
          return `• <b>${label}:</b> ⏳ ${formatTimeRemaining(cdMs - (now - time))}`
        }

        return `⏳ <b>RPG Action Cooldowns</b>\n\n` +
          `${checkCd('Hunt (/hunt)', cds.hunt, 60000)}\n` +
          `${checkCd('Farm (/farm)', cds.farm, 120000)}\n` +
          `${checkCd('Work (/work)', cds.work, 180000)}\n` +
          `${checkCd('Adventure (/adventure)', cds.adventure, 300000)}`
      },
    },
    {
      command: 'help',
      description: 'Display all RPG commands and instructions',
      category: 'rpg',
      handler: async () => {
        return `🎮 <b>Telegram Gateway RPG Commands</b>\n\n` +
          `• <code>/rpg</code> - Player Profile\n` +
          `• <code>/stats</code> - Combat Stats\n` +
          `• <code>/inventory</code> - Inventory Items\n` +
          `• <code>/hunt</code> - Hunt Monsters\n` +
          `• <code>/farm</code> - Harvest Crops\n` +
          `• <code>/daily</code> - Claim Daily Bonus\n` +
          `• <code>/work</code> - Work Job\n` +
          `• <code>/adventure</code> - Explore Dungeon\n` +
          `• <code>/fight</code> - Boss Battle\n` +
          `• <code>/shop</code> - Item Shop\n` +
          `• <code>/buy &lt;item&gt;</code> - Buy Item\n` +
          `• <code>/sell &lt;item&gt;</code> - Sell Item\n` +
          `• <code>/use &lt;item&gt;</code> - Consume Item\n` +
          `• <code>/equip &lt;item&gt;</code> - Equip Gear\n` +
          `• <code>/unequip &lt;slot&gt;</code> - Unequip Gear\n` +
          `• <code>/quests</code> - Quests Progress\n` +
          `• <code>/leaderboard</code> - Top Rankings\n` +
          `• <code>/cooldown</code> - Timer Check`
      },
    },
  ],
  initialize: async () => {},
  shutdown: async () => {},
}
