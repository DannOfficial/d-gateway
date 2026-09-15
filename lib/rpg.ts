export interface RpgItem {
  id: string
  name: string
  type: 'potion' | 'weapon' | 'armor' | 'accessory' | 'material'
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  price: number
  statValue: number
  description: string
}

export const SHOP_CATALOG: RpgItem[] = [
  { id: 'potion', name: 'Health Potion', type: 'potion', rarity: 'Common', price: 50, statValue: 50, description: 'Restores 50 HP' },
  { id: 'elixir', name: 'Super Elixir', type: 'potion', rarity: 'Rare', price: 150, statValue: 120, description: 'Restores 120 HP' },
  { id: 'wooden_sword', name: 'Wooden Sword', type: 'weapon', rarity: 'Common', price: 100, statValue: 15, description: '+15 Attack Power' },
  { id: 'iron_blade', name: 'Iron Blade', type: 'weapon', rarity: 'Rare', price: 350, statValue: 35, description: '+35 Attack Power' },
  { id: 'dragon_slayer', name: 'Dragon Slayer', type: 'weapon', rarity: 'Legendary', price: 1200, statValue: 100, description: '+100 Attack Power' },
  { id: 'leather_armor', name: 'Leather Armor', type: 'armor', rarity: 'Common', price: 120, statValue: 10, description: '+10 Defense' },
  { id: 'steel_cuirass', name: 'Steel Cuirass', type: 'armor', rarity: 'Epic', price: 600, statValue: 45, description: '+45 Defense' },
  { id: 'ring_of_might', name: 'Ring of Might', type: 'accessory', rarity: 'Rare', price: 250, statValue: 20, description: '+20 Bonus Stat' },
]

export function getXpRequired(level: number): number {
  return level * 150
}

export function formatTimeRemaining(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remSeconds = seconds % 60
  return `${minutes}m ${remSeconds}s`
}

export async function getOrCreatePlayer(db: any, playerKey: string, senderInfo: { id: string; nama: string; tag: string }) {
  const collection = db.collection('rpg_players')
  let player = await collection.findOne({ key: playerKey })

  if (!player) {
    player = {
      key: playerKey,
      id: senderInfo.id,
      nama: senderInfo.nama || 'Hero',
      tag: senderInfo.tag || '@hero',
      level: 1,
      xp: 0,
      health: 100,
      maxHp: 100,
      stamina: 50,
      maxStamina: 50,
      money: 500,
      bank: 1000,
      kota: 'Jakarta',
      equipment: { weapon: null, armor: null, accessory: null },
      inventory: [
        { id: 'potion', name: 'Health Potion', count: 2, rarity: 'Common' },
        { id: 'wooden_sword', name: 'Wooden Sword', count: 1, rarity: 'Common' },
      ],
      hewan: ['Kucing Adventurer'],
      tanaman: ['Padi'],
      quests: [
        { id: 'q1', name: 'Hunt 3 Monsters', progress: 0, target: 3, rewardGold: 300, rewardXp: 150, completed: false },
        { id: 'q2', name: 'Farm Harvest', progress: 0, target: 2, rewardGold: 200, rewardXp: 100, completed: false },
      ],
      cooldowns: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await collection.insertOne(player)
  }

  return player
}

export async function checkAndAddXp(db: any, playerKey: string, player: any, xpGained: number, goldGained: number) {
  let newXp = (player.xp || 0) + xpGained
  let newLevel = player.level || 1
  let newMaxHp = player.maxHp || 100
  let reqXp = getXpRequired(newLevel)
  let leveledUp = false

  while (newXp >= reqXp) {
    newXp -= reqXp
    newLevel += 1
    newMaxHp += 20
    reqXp = getXpRequired(newLevel)
    leveledUp = true
  }

  const updateFields: any = {
    xp: newXp,
    level: newLevel,
    maxHp: newMaxHp,
    money: (player.money || 0) + goldGained,
    updatedAt: new Date(),
  }

  if (leveledUp) {
    updateFields.health = newMaxHp
  }

  await db.collection('rpg_players').updateOne({ key: playerKey }, { $set: updateFields })
  return { leveledUp, newLevel, newMaxHp }
}
