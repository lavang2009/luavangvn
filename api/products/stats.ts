import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/products/stats';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET });
