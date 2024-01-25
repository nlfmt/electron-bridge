import { contextBridge, ipcRenderer } from "electron";

export function registerBridgePreload() {
  const __bridge = {
      call: ipcRenderer.invoke,
      emit: ipcRenderer.send,
      on: ipcRenderer.on,
      once: ipcRenderer.once,
      off: ipcRenderer.off
  }

  contextBridge.exposeInMainWorld("__bridge", __bridge);
}