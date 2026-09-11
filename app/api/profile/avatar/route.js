import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await request.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string' || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Upload an image up to 5MB.' }, { status: 400 })
  const blob = await put(`avatars/${user.id}/${crypto.randomUUID()}-${file.name}`, file, { access: 'private', addRandomSuffix: false })
  const db = await getDb()
  await db.collection('user').updateOne({ id: user.id }, { $set: { avatarPathname: blob.pathname, updatedAt: new Date() } })
  return NextResponse.json({ pathname: blob.pathname })
}
