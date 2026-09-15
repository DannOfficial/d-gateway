import dns from 'dns/promises'
import net from 'net'

export function isPrivateOrInternalIp(ip: string): boolean {
  if (!ip) return true

  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0' || ip === '::') return true

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number)
    if (parts[0] === 10) return true
    if (parts[0] === 127) return true
    if (parts[0] === 169 && parts[1] === 254) return true
    if (parts[0] === 192 && parts[1] === 168) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    if (lower.startsWith('fe80:') || lower.startsWith('fd') || lower.startsWith('fc')) return true
  }

  return false
}

export async function validateUrlForSsrf(urlString: string): Promise<{ safe: boolean; reason?: string; resolvedIp?: string }> {
  try {
    const parsed = new URL(urlString)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are allowed.' }
    }

    const hostname = parsed.hostname.toLowerCase()

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return { safe: false, reason: 'Target hostname resolves to internal/private domain.' }
    }

    let addresses: string[] = []
    if (net.isIP(hostname)) {
      addresses = [hostname]
    } else {
      try {
        const resolved = await dns.lookup(hostname, { all: true })
        addresses = resolved.map((r) => r.address)
      } catch (err: any) {
        return { safe: false, reason: `DNS resolution failed for hostname ${hostname}: ${err.message}` }
      }
    }

    for (const ip of addresses) {
      if (isPrivateOrInternalIp(ip)) {
        return { safe: false, reason: `Hostname resolves to private/internal IP range (${ip}).` }
      }
    }

    return { safe: true, resolvedIp: addresses[0] }
  } catch (err: any) {
    return { safe: false, reason: `Invalid URL: ${err.message}` }
  }
}
