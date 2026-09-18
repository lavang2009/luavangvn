import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return { name:'Lù A Vang', short_name:'LV Store', description:'ACC + FILE DIGITAL Store', start_url:'/', display:'standalone', background_color:'#060611', theme_color:'#060611', icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml'}] }; }
