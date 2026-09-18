import { createVercelHandler, lastPathParam } from '@/lib/vercel-handler';
import { POST } from '@/server/routes/downloads/[orderId]';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ POST }, (request) => ({ orderId: lastPathParam(request) }));
