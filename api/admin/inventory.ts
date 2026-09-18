import { createVercelHandler } from '@/lib/vercel-handler';
import { GET, POST, DELETE } from '@/server/routes/admin/inventory';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, POST, DELETE });
