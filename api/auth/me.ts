import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/auth/me';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET });
