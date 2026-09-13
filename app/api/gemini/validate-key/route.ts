import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ valid: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const apiKey = String(body.apiKey || '').trim()

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: 'API Key is required' }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
    })

    if (response && response.text) {
      const maskedKey = apiKey.slice(0, 6) + '...' + apiKey.slice(-4)
      return NextResponse.json({ valid: true, maskedKey, message: 'Gemini API Key is valid and connected!' })
    }

    return NextResponse.json({ valid: false, error: 'No response from Gemini API' }, { status: 422 })
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message || 'Invalid Gemini API Key' }, { status: 422 })
  }
}
