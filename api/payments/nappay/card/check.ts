import { createVercelHandler } from '@/lib/vercel-handler';
import { GET, POST } from '@/server/routes/payments/nappay/card/check';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET, POST });
