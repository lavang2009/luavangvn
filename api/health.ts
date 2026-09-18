import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/health';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET });
