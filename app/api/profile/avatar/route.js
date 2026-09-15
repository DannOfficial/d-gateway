import { NextResponse } from 'next/server'
import { getDb, ObjectId } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    let imageUrl = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { image } = body

      if (!image || typeof image !== 'string') {
        return NextResponse.json({ success: false, error: { code: 'INVALID_IMAGE', message: 'Image data URL required.' } }, { status: 400 })
      }

      if (!image.startsWith('data:image/')) {
        return NextResponse.json({ success: false, error: { code: 'INVALID_FORMAT', message: 'Invalid image data format. Must be JPEG, PNG, or WebP.' } }, { status: 400 })
      }

      const approxSizeBytes = (image.length * 3) / 4
      if (approxSizeBytes > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Image file size exceeds 5MB limit.' } }, { status: 400 })
      }

      imageUrl = image
    } else {
      const form = await request.formData()
      const file = form.get('file')

      if (!file || typeof file === 'string' || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: { code: 'INVALID_FILE', message: 'Please upload a valid image file up to 5MB.' } }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      imageUrl = `data:${file.type};base64,${buffer.toString('base64')}`
    }

    const db = await getDb()
    const uId = user._id ? user._id : user.id
    const query = typeof uId === 'string' && ObjectId.isValid(uId) ? { _id: new ObjectId(uId) } : { _id: uId }

    await db.collection('users').updateOne(query, { $set: { image: imageUrl, updatedAt: new Date() } })

    return NextResponse.json({ success: true, data: { imageUrl, message: 'Profile avatar updated successfully.' } })
  } catch (err) {
    console.error('Avatar upload error:', err)
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update avatar' } }, { status: 500 })
  }
}
