import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { url, query } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'API URL is required' }, { status: 400 })
    }

    const targetUrl = new URL(url)
    if (query) {
      targetUrl.searchParams.set('q', query)
      targetUrl.searchParams.set('query', query)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': 'Dann-Tele-Scraper/1.0' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    const contentType = res.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = await res.text()
    }

    return NextResponse.json({ ok: true, status: res.status, data })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Scrape execution failed' }, { status: 500 })
  }
}
