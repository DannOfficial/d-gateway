import { NextResponse } from 'next/server'
import { getDb, ObjectId } from '../../../../lib/mongodb'
import { getCurrentUser } from '../../../../lib/auth'

export async function DELETE(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid command ID' }, { status: 400 })
  }

  const db = await getDb()
  const res = await db.collection('commands').deleteOne({ _id: new ObjectId(id), userId: user._id })

  if (res.deletedCount === 0) {
    return NextResponse.json({ error: 'Command not found or unauthorized' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
