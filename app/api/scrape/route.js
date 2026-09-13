import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { safeFetch } from '../../../lib/safe-fetch'

export async function POST(request) {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const res = await safeFetch(targetUrlString, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dann-Tele-Scraper/1.0' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) return NextResponse.json({ error: 'Remote request failed' }, { status: 502 })
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
        rawTextSnippet: typeof data === 'string' ? data.slice(0, 500) : data,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Scrape execution failed' }, { status: 500 })
  }
}
