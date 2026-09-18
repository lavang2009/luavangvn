import { createVercelHandler, lastPathParam } from '@/lib/vercel-handler';
import { GET, POST } from '@/server/routes/orders/[id]';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, POST }, (request) => ({ id: lastPathParam(request) }));
