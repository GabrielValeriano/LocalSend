import type { Api } from '../../preload/index'

// window.api lo crea preload/index.ts con contextBridge.
// La vista usa SOLO esto para hablar con el proceso Main.
declare global {
  interface Window {
    api: Api
  }
}

export const api = window.api
