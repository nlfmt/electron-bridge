import { contextBridge, ipcRenderer } from "electron"

/**
 * Provided the necessary functions for the bridge to communicate with the main process
 * @param name Optionally rename the bridge, has to match the name in `createBridgeRenderer`
 */
export function registerBridgePreload(name = "__bridge") {
  contextBridge.exposeInMainWorld(name, {
    invoke: ipcRenderer.invoke,
    send: ipcRenderer.send,
    on: ipcRenderer.on,
    once: ipcRenderer.once,
    off: ipcRenderer.off,
  })
}
