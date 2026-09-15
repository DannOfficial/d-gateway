import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  const AVAILABLE_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'Multimodal / Fast', desc: 'Default high-speed model for general conversational and tool tasks.' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', category: 'Reasoning & Coding', desc: 'Advanced reasoning, complex problem solving, and long-context understanding.' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', category: 'Legacy Large Context', desc: 'Legacy flagship model with 1M token context capacity.' },
  ]

  return NextResponse.json({
    success: true,
    data: {
      planInfo: 'Plan information unavailable through API',
      hasApiKey: Boolean(user.geminiApiKey),
      models: AVAILABLE_MODELS,
    },
  })
}
