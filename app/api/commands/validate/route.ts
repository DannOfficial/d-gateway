import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { validateExternalApiEndpoint } from '@/lib/api-validator'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { endpoint, method, headers, query } = body

    if (!endpoint) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_URL', message: 'API Endpoint URL is required.' } }, { status: 400 })
    }

    const result = await validateExternalApiEndpoint(endpoint, method || 'GET', headers || {}, query || 'kucing')

    return NextResponse.json({
      success: result.valid,
      data: result,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Validation failed' } }, { status: 500 })
  }
}
