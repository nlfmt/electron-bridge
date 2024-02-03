import { contextBridge, ipcRenderer } from "electron"

/**
 * Provided the necessary functions for the bridge to communicate with the main process
 * @param name Optionally rename the bridge, has to match the name in `createBridgeRenderer`
 */
export function registerBridgePreload(name = "__bridge") {
  if (!process.contextIsolated) throw new Error("Context Isolation must be enabled")

  contextBridge.exposeInMainWorld(name, {
    invoke: ipcRenderer.invoke,
    send: ipcRenderer.send,
    on: (...args: Parameters<typeof ipcRenderer.on>) => {
      ipcRenderer.on(...args)
      return () => ipcRenderer.off(...args)
    },
    once: (...args: Parameters<typeof ipcRenderer.once>) => {
      ipcRenderer.once(...args)
      return () => ipcRenderer.off(...args)
    },
    off: ipcRenderer.off,
  })
}
