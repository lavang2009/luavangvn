export function jsonResponse<T>(body: T, status = 200, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(body), { status, headers });
}

export function ok<T>(data: T, status = 200) {
  return jsonResponse({ ok: true, data }, status);
}

export function fail(message: string, status = 400, code = 'BAD_REQUEST') {
  return jsonResponse({ ok: false, error: { code, message } }, status);
}


export async function fetchJson<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<{ response: Response; body: T | null }> {
  const response = await fetch(input, init);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return { response, body: null };
  try {
    return { response, body: (await response.json()) as T };
  } catch {
    return { response, body: null };
  }
}
