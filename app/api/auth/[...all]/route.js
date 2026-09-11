import { getAuthHandler } from '@/lib/auth'

export async function GET(request) {
  const handler = await getAuthHandler()
  return handler.GET(request)
}

export async function POST(request) {
  const handler = await getAuthHandler()
  return handler.POST(request)
}
