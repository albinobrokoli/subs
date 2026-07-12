import type { SublistApi } from '../../preload/index'

declare global {
  interface Window {
    sublist: SublistApi
  }
}

export {}
