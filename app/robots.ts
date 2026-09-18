import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { const base=process.env.NEXT_PUBLIC_SITE_URL??(process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'https://example.invalid'); return { rules:{userAgent:'*',allow:'/',disallow:['/admin/','/api/','/orders/','/checkout','/profile','/deposit']},sitemap:`${base}/sitemap.xml` }; }
