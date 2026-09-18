import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/products';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET });
