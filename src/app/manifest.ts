import type { MetadataRoute } from 'next';

/** PWA Manifest — ติดตั้งเป็นแอปบนมือถือได้ */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ต้นไม้จริยธรรม',
    short_name: 'EthicsTree',
    description: 'ช่องทางฝากคำชม ข้อเสนอแนะ และข้อร้องเรียนของโรงพยาบาล',
    start_url: '/',
    display: 'standalone',
    background_color: '#e8f6fb',
    theme_color: '#3a924e',
    lang: 'th',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
