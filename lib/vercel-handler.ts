import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

export type VercelRouteContext = { params: Record<string, string> };
export type VercelRouteHandler = (request: Request, context: VercelRouteContext) => Promise<Response> | Response;
export type VercelMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type VercelRouteMap = Partial<Record<VercelMethod, VercelRouteHandler>>;
export type VercelRouteMatch = { routes: VercelRouteMap; params: Record<string, string> };

type ParamsResolver = (request: IncomingMessage) => Record<string, string>;

type VercelRequest = IncomingMessage & {
  body?: unknown;
};

function firstHeader(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function toWebHeaders(headers: IncomingHttpHeaders) {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (value == null || ['connection', 'keep-alive', 'host', 'transfer-encoding'].includes(name.toLowerCase())) continue;
    result.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  return result;
}

async function toWebRequest(request: VercelRequest) {
  const proto = firstHeader(request.headers, 'x-forwarded-proto') ?? 'http';
  const host = firstHeader(request.headers, 'host') ?? 'example.invalid';
  const requestUrl = new URL(request.url || '/', `${proto}://${host}`);
  const method = (request.method || 'GET').toUpperCase();
  const headers = toWebHeaders(request.headers);
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody ? await readBody(request) : undefined;

  return new Request(requestUrl, {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  } as RequestInit);
}

async function sendResponse(response: Response, target: ServerResponse) {
  target.statusCode = response.status;
  target.setHeader('x-content-type-options', 'nosniff');
  target.setHeader('x-frame-options', 'DENY');
  target.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  target.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  target.setHeader('cross-origin-opener-policy', 'same-origin');
  response.headers.forEach((value, key) => target.setHeader(key, value));
  const payload = Buffer.from(await response.arrayBuffer());
  target.setHeader('content-length', String(payload.byteLength));
  target.end(payload);
}

function sendMethodNotAllowed(target: ServerResponse, allowed: string[]) {
  target.statusCode = 405;
  target.setHeader('allow', allowed.join(', '));
  target.setHeader('content-type', 'application/json; charset=utf-8');
  target.end(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } }));
}

function sendNotFound(target: ServerResponse) {
  target.statusCode = 404;
  target.setHeader('content-type', 'application/json; charset=utf-8');
  target.end(JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'API route not found.' } }));
}

export function createVercelHandler(routes: VercelRouteMap, resolveParams?: ParamsResolver) {
  return async function handler(request: VercelRequest, response: ServerResponse) {
    try {
      const method = (request.method || 'GET').toUpperCase() as VercelMethod;
      const route = routes[method];
      if (!route) {
        sendMethodNotAllowed(response, Object.keys(routes));
        return;
      }

      const webRequest = await toWebRequest(request);
      const context: VercelRouteContext = { params: resolveParams ? resolveParams(request) : {} };
      const result = await route(webRequest, context);
      await sendResponse(result, response);
    } catch (error) {
      console.error('[vercel-api]', error);
      response.statusCode = 500;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' } }));
    }
  };
}

export function createVercelRouterHandler(resolveRoute: (request: IncomingMessage) => VercelRouteMatch | null) {
  return async function handler(request: VercelRequest, response: ServerResponse) {
    try {
      const match = resolveRoute(request);
      if (!match) {
        sendNotFound(response);
        return;
      }

      const method = (request.method || 'GET').toUpperCase() as VercelMethod;
      const route = match.routes[method];
      if (!route) {
        sendMethodNotAllowed(response, Object.keys(match.routes));
        return;
      }

      const webRequest = await toWebRequest(request);
      const result = await route(webRequest, { params: match.params });
      await sendResponse(result, response);
    } catch (error) {
      console.error('[vercel-api-router]', error);
      response.statusCode = 500;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ ok: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' } }));
    }
  };
}

export function lastPathParam(request: IncomingMessage) {
  const rawPath = String(request.url || '/').split('?', 1)[0];
  const segments = rawPath.split('/').filter(Boolean);
  return decodeURIComponent(segments.at(-1) ?? '');
}
