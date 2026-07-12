// Auto-generated — explicit imports for Vite (background images)
import bg1 from '../assets/backgrounds/bg1.jpg'
import bg2 from '../assets/backgrounds/bg10.jpg'
import bg3 from '../assets/backgrounds/bg11.jpg'
import bg4 from '../assets/backgrounds/bg12.jpg'
import bg5 from '../assets/backgrounds/bg13.jpg'
import bg6 from '../assets/backgrounds/bg14.jpg'
import bg7 from '../assets/backgrounds/bg15.jpg'
import bg8 from '../assets/backgrounds/bg16.jpg'
import bg9 from '../assets/backgrounds/bg17.jpg'
import bg10 from '../assets/backgrounds/bg18.jpg'
import bg11 from '../assets/backgrounds/bg19.jpg'
import bg12 from '../assets/backgrounds/bg2.jpg'
import bg13 from '../assets/backgrounds/bg20.jpg'
import bg14 from '../assets/backgrounds/bg21.jpg'
import bg15 from '../assets/backgrounds/bg22.jpg'
import bg16 from '../assets/backgrounds/bg23.jpg'
import bg17 from '../assets/backgrounds/bg24.jpg'
import bg18 from '../assets/backgrounds/bg25.jpg'
import bg19 from '../assets/backgrounds/bg26.jpg'
import bg20 from '../assets/backgrounds/bg27.jpg'
import bg21 from '../assets/backgrounds/bg28.jpg'
import bg22 from '../assets/backgrounds/bg29.jpg'
import bg23 from '../assets/backgrounds/bg3.jpg'
import bg24 from '../assets/backgrounds/bg30.jpg'
import bg25 from '../assets/backgrounds/bg31.jpg'
import bg26 from '../assets/backgrounds/bg32.jpg'
import bg27 from '../assets/backgrounds/bg33.jpg'
import bg28 from '../assets/backgrounds/bg34.jpg'
import bg29 from '../assets/backgrounds/bg35.jpg'
import bg30 from '../assets/backgrounds/bg36.jpg'
import bg31 from '../assets/backgrounds/bg37.jpg'
import bg32 from '../assets/backgrounds/bg38.jpg'
import bg33 from '../assets/backgrounds/bg39.jpg'
import bg34 from '../assets/backgrounds/bg4.jpg'
import bg35 from '../assets/backgrounds/bg5.jpg'
import bg36 from '../assets/backgrounds/bg6.jpg'
import bg37 from '../assets/backgrounds/bg7.jpg'
import bg38 from '../assets/backgrounds/bg8.jpg'
import bg39 from '../assets/backgrounds/bg9.jpg'

export const BACKGROUNDS: string[] = [
  bg1,
  bg2,
  bg3,
  bg4,
  bg5,
  bg6,
  bg7,
  bg8,
  bg9,
  bg10,
  bg11,
  bg12,
  bg13,
  bg14,
  bg15,
  bg16,
  bg17,
  bg18,
  bg19,
  bg20,
  bg21,
  bg22,
  bg23,
  bg24,
  bg25,
  bg26,
  bg27,
  bg28,
  bg29,
  bg30,
  bg31,
  bg32,
  bg33,
  bg34,
  bg35,
  bg36,
  bg37,
  bg38,
  bg39,
]

export function backgroundForId(id: string): string {
  if (!BACKGROUNDS.length) return ''
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return BACKGROUNDS[h % BACKGROUNDS.length]
}