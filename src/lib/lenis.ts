import type Lenis from "lenis"

let lenisInstance: Lenis | null = null

export function setLenisInstance(instance: Lenis | null) {
  lenisInstance = instance
}

export function getLenisInstance() {
  return lenisInstance
}

export function stopLenis() {
  lenisInstance?.stop()
}

export function startLenis() {
  lenisInstance?.start()
}
