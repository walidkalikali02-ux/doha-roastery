import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Doha Roastery | دوحة روستري',
    short_name: 'Doha Roastery',
    description: 'Specialty coffee roasted in Doha and delivered across Qatar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f0e8',
    theme_color: '#25221f',
    lang: 'ar-QA',
    dir: 'rtl',
    icons: [{ src: '/logo.png', sizes: 'any', type: 'image/png' }],
  }
}
