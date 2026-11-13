const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function normalizeDatabaseUrl(
  url: string | undefined,
): string | undefined {
  if (!url) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!LOCAL_HOSTS.has(host)) {
      return url;
    }

    const [base, query] = url.split('?');
    if (!query) {
      return url;
    }

    const params = new URLSearchParams(query);
    if (!params.has('sslmode')) {
      return url;
    }

    params.delete('sslmode');
    const remaining = params.toString();
    return remaining ? `${base}?${remaining}` : base;
  } catch {
    return url;
  }
}
