import { createVercelHandler } from '@/lib/vercel-handler';
import { GET, POST, PATCH, DELETE } from '@/server/routes/admin/products';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, POST, PATCH, DELETE });
