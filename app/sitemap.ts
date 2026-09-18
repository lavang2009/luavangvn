import type { MetadataRoute } from 'next';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const base=process.env.NEXT_PUBLIC_SITE_URL??(process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'https://example.invalid'); return ['','shop','login','register','deposit'].map(path=>({url:`${base}/${path}`,lastModified:new Date()})); }
