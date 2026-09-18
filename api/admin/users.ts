import { createVercelHandler } from '@/lib/vercel-handler';
import { GET, PATCH } from '@/server/routes/admin/users';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, PATCH });
