function maskIpv4(ip: string): string | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const parts = m.slice(1).map((s) => Number(s));
  if (parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

function maskIpv6(ip: string): string | null {
  const s = ip.toLowerCase();
  if (!/^[0-9a-f:]+$/.test(s)) return null;
  const parts = s.split(':');
  if (parts.length < 3) return null;
  const head = parts.filter((p) => p.length > 0).slice(0, 4);
  if (head.length === 0) return null;
  if (head.some((p) => p.length > 4 || !/^[0-9a-f]{1,4}$/.test(p))) return null;
  return `${head.join(':')}::`;
}

function anonymizeIp(ip: string): string | null {
  const v = ip.trim();
  if (!v) return null;
  const ipv4 = maskIpv4(v);
  if (ipv4) return ipv4;
  const ipv6 = maskIpv6(v);
  if (ipv6) return ipv6;
  return null;
}

export function clientIp(req: Request): string {
  const headers = req.headers;
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string') {
      const ip = anonymizeIp(c.slice(0, 200));
      if (ip) return ip;
    }
  }
  return '127.0.0.1';
}
