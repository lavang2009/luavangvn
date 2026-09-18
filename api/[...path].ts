import { createVercelRouterHandler, type VercelRouteHandler, type VercelRouteMap, type VercelRouteMatch } from '@/lib/vercel-handler';

import * as adminDeposits from '@/server/routes/admin/deposits';
import * as adminFiles from '@/server/routes/admin/files';
import * as adminInventory from '@/server/routes/admin/inventory';
import * as adminNappayCard from '@/server/routes/admin/nappay/card';
import * as adminOrders from '@/server/routes/admin/orders';
import * as adminProducts from '@/server/routes/admin/products';
import * as adminStats from '@/server/routes/admin/stats';
import * as adminUsers from '@/server/routes/admin/users';
import * as adminVouchers from '@/server/routes/admin/vouchers';
import * as authBootstrap from '@/server/routes/auth/bootstrap';
import * as authMe from '@/server/routes/auth/me';
import * as deposits from '@/server/routes/deposits';
import * as depositsHistory from '@/server/routes/deposits/history';
import * as downloads from '@/server/routes/downloads/[orderId]';
import * as favorites from '@/server/routes/favorites';
import * as health from '@/server/routes/health';
import * as nappayCallback from '@/server/routes/nappay/callback';
import * as notifications from '@/server/routes/notifications';
import * as orders from '@/server/routes/orders';
import * as orderById from '@/server/routes/orders/[id]';
import * as nappayPaymentCallback from '@/server/routes/payments/nappay/callback';
import * as nappayCard from '@/server/routes/payments/nappay/card';
import * as nappayCardCheck from '@/server/routes/payments/nappay/card/check';
import * as nappayCardHistory from '@/server/routes/payments/nappay/card/history';
import * as sepayWebhook from '@/server/routes/payments/sepay/webhook';
import * as products from '@/server/routes/products';
import * as productBySlug from '@/server/routes/products/[slug]';
import * as productById from '@/server/routes/products/by-id/[id]';
import * as productStats from '@/server/routes/products/stats';
import * as profile from '@/server/routes/profile';
import * as voucherValidate from '@/server/routes/vouchers/validate';
import * as webhookNappay from '@/server/routes/webhook/nappay';
import * as webhookSepay from '@/server/routes/webhook/sepay';

export const config = { api: { bodyParser: false } };

type RouteContext = { params: Record<string, string> };
type RouteModuleHandler = (request: Request, context: RouteContext) => Promise<Response> | Response;
type RouteModule = Partial<Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD', RouteModuleHandler>>;

function adapt(module: RouteModule): VercelRouteMap {
  const routes: VercelRouteMap = {};
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const) {
    const handler = module[method];
    if (handler) {
      routes[method] = ((request: Request, context) => handler(request, { params: context.params })) as VercelRouteHandler;
    }
  }
  return routes;
}

function exact(...expected: string[]) {
  return (segments: string[]) => segments.length === expected.length && expected.every((value, index) => segments[index] === value) ? {} : null;
}

function oneParam(prefix: string[], name: string) {
  return (segments: string[]) => {
    if (segments.length !== prefix.length + 1 || !prefix.every((value, index) => segments[index] === value)) return null;
    return { [name]: segments[prefix.length] };
  };
}

const routes: Array<{ match: (segments: string[]) => Record<string, string> | null; routes: VercelRouteMap }> = [
  { match: exact('admin', 'deposits'), routes: adapt(adminDeposits) },
  { match: exact('admin', 'files'), routes: adapt(adminFiles) },
  { match: exact('admin', 'inventory'), routes: adapt(adminInventory) },
  { match: exact('admin', 'nappay', 'card'), routes: adapt(adminNappayCard) },
  { match: exact('admin', 'orders'), routes: adapt(adminOrders) },
  { match: exact('admin', 'products'), routes: adapt(adminProducts) },
  { match: exact('admin', 'stats'), routes: adapt(adminStats) },
  { match: exact('admin', 'users'), routes: adapt(adminUsers) },
  { match: exact('admin', 'vouchers'), routes: adapt(adminVouchers) },
  { match: exact('auth', 'bootstrap'), routes: adapt(authBootstrap) },
  { match: exact('auth', 'me'), routes: adapt(authMe) },
  { match: exact('deposits'), routes: adapt(deposits) },
  { match: exact('deposits', 'history'), routes: adapt(depositsHistory) },
  { match: oneParam(['downloads'], 'orderId'), routes: adapt(downloads) },
  { match: exact('favorites'), routes: adapt(favorites) },
  { match: exact('health'), routes: adapt(health) },
  { match: exact('nappay', 'callback'), routes: adapt(nappayCallback) },
  { match: exact('notifications'), routes: adapt(notifications) },
  { match: exact('orders'), routes: adapt(orders) },
  { match: oneParam(['orders'], 'id'), routes: adapt(orderById) },
  { match: exact('payments', 'nappay', 'callback'), routes: adapt(nappayPaymentCallback) },
  { match: exact('payments', 'nappay', 'card'), routes: adapt(nappayCard) },
  { match: exact('payments', 'nappay', 'card', 'check'), routes: adapt(nappayCardCheck) },
  { match: exact('payments', 'nappay', 'card', 'history'), routes: adapt(nappayCardHistory) },
  { match: exact('payments', 'sepay', 'webhook'), routes: adapt(sepayWebhook) },
  { match: exact('products'), routes: adapt(products) },
  { match: oneParam(['products', 'by-id'], 'id'), routes: adapt(productById) },
  { match: exact('products', 'stats'), routes: adapt(productStats) },
  { match: oneParam(['products'], 'slug'), routes: adapt(productBySlug) },
  { match: exact('profile'), routes: adapt(profile) },
  { match: exact('vouchers', 'validate'), routes: adapt(voucherValidate) },
  { match: exact('webhook', 'nappay'), routes: adapt(webhookNappay) },
  { match: exact('webhook', 'sepay'), routes: adapt(webhookSepay) },
];

function resolveRoute(request: { url?: string | null }): VercelRouteMatch | null {
  const url = String(request.url || '/');
  let pathname = url.split('?', 1)[0].replace(/\/+$/, '') || '/';

  // Vercel can expose req.url either with the /api prefix or relative to the
  // matched function. Accept both forms so the single Hobby catch-all works
  // consistently across preview/production runtimes.
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    pathname = pathname.replace(/^\/api\/?/, '/');
  }

  const rawSegments = pathname.split('/').filter(Boolean);
  let segments: string[];
  try {
    segments = rawSegments.map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }

  for (const definition of routes) {
    const params = definition.match(segments);
    if (params) return { routes: definition.routes, params };
  }
  return null;
}

export default createVercelRouterHandler(resolveRoute);
