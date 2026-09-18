import { createVercelHandler } from '@/lib/vercel-handler';
import { POST } from '@/server/routes/payments/nappay/callback';

export default createVercelHandler({ POST });
