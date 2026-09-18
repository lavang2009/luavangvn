import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/admin/stats';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET });
