import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getCurrentUser } from '@/lib/auth'
import { getDb, ObjectId } from '@/lib/mongodb'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  try {
    const body = await request.json()
    const apiKey = String(body.apiKey || '').trim()

    if (!apiKey) {
      return NextResponse.json({ success: false, error: { code: 'MISSING_KEY', message: 'Gemini API Key is required.' } }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
    })

    if (!response || !response.text) {
      return NextResponse.json({ success: false, error: { code: 'API_NO_RESPONSE', message: 'No response received from Google Gemini API.' } }, { status: 422 })
    }

    const db = await getDb()
    const uId = user._id ? user._id : user.id
    const query = typeof uId === 'string' && ObjectId.isValid(uId) ? { _id: new ObjectId(uId) } : { _id: uId }

    await db.collection('users').updateOne(query, { $set: { geminiApiKey: apiKey, updatedAt: new Date() } })

    const maskedKey = apiKey.slice(0, 6) + '...' + apiKey.slice(-4)
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        maskedKey,
        message: 'Gemini API Key verified and saved successfully!',
        planInfo: 'Plan information unavailable through API',
      },
    })
  } catch (err: any) {
    console.error('Gemini Key verification error:', err)
    let errCode = 'INVALID_API_KEY'
    let errMsg = err.message || 'Invalid Gemini API Key or project restricted.'

    if (err.status === 401 || String(errMsg).includes('API_KEY_INVALID')) {
      errCode = 'INVALID_CREDENTIALS'
      errMsg = 'Google Gemini API Key is invalid or expired.'
    } else if (err.status === 429 || String(errMsg).includes('RESOURCE_EXHAUSTED')) {
      errCode = 'QUOTA_EXCEEDED'
      errMsg = 'Gemini API rate limit or quota exceeded for this project.'
    }

    return NextResponse.json({ success: false, error: { code: errCode, message: errMsg } }, { status: 422 })
  }
}
