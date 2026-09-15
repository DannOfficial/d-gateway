import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = String(user.role || 'free').toLowerCase()

  const ALL_MODELS = [
    { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash', minRole: 'free', desc: 'Fast, lightweight & efficient model.' },
    { id: 'gemini-2.0-flash', name: 'gemini-2.0-flash', minRole: 'vip', desc: 'Balanced multimodal model.' },
    { id: 'gemini-2.5-pro', name: 'gemini-2.5-pro', minRole: 'premium', desc: 'Advanced reasoning and complex prompts.' },
    { id: 'gemini-1.5-pro', name: 'gemini-1.5-pro', minRole: 'admin', desc: 'High capacity legacy model.' },
  ]

  const roleHierarchy: Record<string, number> = { free: 0, vip: 1, premium: 2, admin: 3 }
  const userRank = roleHierarchy[role] ?? 0

  const allowedModels = ALL_MODELS.filter((m) => (roleHierarchy[m.minRole] ?? 0) <= userRank)

  return NextResponse.json({
    role,
    models: allowedModels,
  })
}
