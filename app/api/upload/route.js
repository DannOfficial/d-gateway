import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name ? file.name.split('.').pop() : 'bin'
    const fileName = `${randomUUID()}.${ext}`
    const filePath = join(uploadDir, fileName)

    await writeFile(filePath, buffer)
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({ ok: true, url: fileUrl })
  } catch (err) {
    console.error('File upload error:', err)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
