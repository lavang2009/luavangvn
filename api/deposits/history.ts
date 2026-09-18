import { createVercelHandler } from '@/lib/vercel-handler';
import { GET } from '@/server/routes/deposits/history';

export default createVercelHandler({ GET });
