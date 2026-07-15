// Optimized — 10 backgrounds for faster build
import bg1 from '../assets/backgrounds/bg1.jpg'
import bg2 from '../assets/backgrounds/bg3.jpg'
import bg3 from '../assets/backgrounds/bg5.jpg'
import bg4 from '../assets/backgrounds/bg7.jpg'
import bg5 from '../assets/backgrounds/bg9.jpg'
import bg6 from '../assets/backgrounds/bg11.jpg'
import bg7 from '../assets/backgrounds/bg13.jpg'
import bg8 from '../assets/backgrounds/bg15.jpg'
import bg9 from '../assets/backgrounds/bg17.jpg'
import bg10 from '../assets/backgrounds/bg19.jpg'

export const BACKGROUNDS: string[] = [
  bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9, bg10,
]

export function backgroundForId(id: string): string {
  if (!BACKGROUNDS.length) return ''
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return BACKGROUNDS[h % BACKGROUNDS.length]
}
