import { createVercelHandler } from '@/lib/vercel-handler';
import { GET, POST, PATCH } from '@/server/routes/admin/vouchers';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, POST, PATCH });
