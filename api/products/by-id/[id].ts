import { createVercelHandler, lastPathParam } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/products/by-id/[id]';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET }, (request) => ({ id: lastPathParam(request) }));
