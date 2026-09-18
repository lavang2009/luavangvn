import { createVercelHandler } from '@/lib/vercel-handler';
import { POST } from '@/server/routes/vouchers/validate';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ POST });
