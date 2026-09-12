import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { url, query, command } = await request.json()
    let targetUrlString = url

    if (!targetUrlString && command) {
      const cmd = command.toLowerCase()
      if (cmd.includes('pinterest')) {
        targetUrlString = `https://html.duckduckgo.com/html/?q=site:pinterest.com+${encodeURIComponent(query || 'kucing')}`
      } else {
        targetUrlString = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query || '')}`
      }
    }

    if (!targetUrlString) {
      return NextResponse.json({ error: 'API URL or Command query is required' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(targetUrlString, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dann-Tele-Scraper/1.0' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    const contentType = res.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = await res.text()
    }

    return NextResponse.json({
      ok: true,
      command,
      query,
      data: {
        results: [
          { title: `${query || 'Data'} Image 1`, url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500' },
          { title: `${query || 'Data'} Image 2`, url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500' },
        ],
        rawTextSnippet: typeof data === 'string' ? data.slice(0, 500) : data,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Scrape execution failed' }, { status: 500 })
  }
}
