import { createVercelHandler } from '@/lib/vercel-handler';
import { GET, PATCH } from '@/server/routes/notifications';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, PATCH });
