import { createVercelHandler } from '@/lib/vercel-handler';
import { POST } from '@/server/routes/auth/bootstrap';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ POST });
