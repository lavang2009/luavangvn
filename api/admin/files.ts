import { createVercelHandler } from '@/lib/vercel-handler';
import { POST, DELETE } from '@/server/routes/admin/files';

export const config = { api: { bodyParser: false } };

export default createVercelHandler({ POST, DELETE });
