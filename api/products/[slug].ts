import { createVercelHandler, lastPathParam } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/products/[slug]';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET }, (request) => ({ slug: lastPathParam(request) }));
