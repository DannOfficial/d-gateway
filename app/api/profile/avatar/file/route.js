import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname || !pathname.startsWith(`avatars/${user.id}/`)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const result = await get(pathname, { access: 'private', ifNoneMatch: request.headers.get('if-none-match') || undefined })
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag } })
  return new NextResponse(result.stream, { headers: { 'Content-Type': result.blob.contentType, ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } })
}
