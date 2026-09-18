import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/payments/nappay/card/history';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ GET });
