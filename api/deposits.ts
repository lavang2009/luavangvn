import { createVercelHandler } from '@/lib/vercel-handler';
import { GET, POST } from '@/server/routes/deposits';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, POST });
