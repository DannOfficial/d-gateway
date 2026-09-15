import { NextResponse } from 'next/server'
import { getDb, ObjectId } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

function verifyImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return false
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true
  // WebP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true

  return false
}

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

      const base64Part = image.split(',')[1] || ''
      const buffer = Buffer.from(base64Part, 'base64')

      if (!verifyImageMagicBytes(buffer)) {
        return NextResponse.json({ success: false, error: { code: 'CORRUPTED_IMAGE', message: 'Image header verification failed (corrupted or spoofed image file).' } }, { status: 400 })
      }

      if (buffer.length > 5 * 1024 * 1024) {
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

      if (!verifyImageMagicBytes(buffer)) {
        return NextResponse.json({ success: false, error: { code: 'CORRUPTED_IMAGE', message: 'Image header verification failed (corrupted or spoofed image file).' } }, { status: 400 })
      }

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
