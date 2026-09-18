import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/admin/nappay/card';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET });
