import {
  BrowserWindow,
  IpcMainEvent,
  ipcMain,
} from "electron"
import type { ApiFn, EventDef, If, RouterDef } from "./types"
import type { ExposedFunctions } from "./preload"

type ReservedKeys = Exclude<keyof ExposedFunctions, "invoke">
type AssertNoReservedKeys<T> = keyof T extends ReservedKeys ? "router name is a reserved key" : T


/**
 * Create a router for bridge functions
 * @param functions The function definitions
 * @returns The router
 */
export const createBridgeRouter = <Functions extends Record<string, ApiFn>>(
  functions: Functions
) => functions

export class ElectronBridge<
  RendererEvents extends EventDef = {},
  MainEvents extends EventDef = {},
  Routers extends RouterDef = {}
> {
  constructor(
    private routers: Routers,
    private opts?: { validateSender?: boolean }
  ) {}

  /**
   * Register the bridge functions
   */
  register() {
    for (const [routerName, router] of Object.entries(this.routers)) {
      for (const [fnName, fn] of Object.entries(router)) {
        ipcMain.handle(`${routerName}.${fnName}`, fn)
      }
    }
  }

  /**
   * Define Events that can be sent through the bridge
   * @returns 
   */
  withEvents<
    RendererEventsDef extends EventDef,
    MainEventsDef extends EventDef
  >() {
    return this as unknown as ElectronBridge<
      RendererEventsDef,
      MainEventsDef,
      Routers
    >
  }

  /**
   * Emit an event to the renderer process
   * @param name The name of the event
   * @param args The arguments to pass to the event
   */
  emit<T extends keyof MainEvents & string>(event: If<MainEvents[T], void, T, never>): void
  emit<T extends keyof MainEvents & string>(event: T, data: MainEvents[T]): void
  emit(event: string, data?: unknown): void {
    for (const win of BrowserWindow.getAllWindows())
      win.webContents.send(event, data)
  }

  /**
   * Listen for an event from the renderer process
   * @param name The name of the event
   * @param fn The function to call when the event is received
   */
  on<T extends keyof RendererEvents & string>(
    name: T,
    fn: (e: IpcMainEvent, data: RendererEvents[T]) => void
  ) {
    const listener = (e: IpcMainEvent, data: RendererEvents[T]) => {
      if (!this.validateSender(e.senderFrame)) return
      fn(e, data)
    }
    ipcMain.on(name, listener)
    return () => ipcMain.removeListener(name, listener)
  }

  /**
   * Listen for an event from the renderer process, but only once
   * @param name The name of the event
   * @param fn The function to call when the event is received
   */
  once<T extends keyof RendererEvents & string>(
    name: T,
    fn: (e: IpcMainEvent, data: RendererEvents[T]) => void
  ) {
    const listener = (e: IpcMainEvent, data: RendererEvents[T]) => {
      if (!this.validateSender(e.senderFrame)) return
      fn(e, data)
    }
    ipcMain.once(name, listener)
    return () => ipcMain.removeListener(name, listener)
  }

  /**
   * Remove all listeners for an event from the renderer process
   */
  removeAllListeners<T extends keyof RendererEvents & string>(name: T) {
    ipcMain.removeAllListeners(name)
  }

  /**
   * Only allow senders from file protocol or from dev server.
   */
  private validateSender(frame: Electron.WebFrameMain): boolean {
    if (!(this.opts?.validateSender ?? process.env.NODE_ENV === "production"))
      return true

    const frameUrl = new URL(frame.url)
    if (frameUrl.protocol == "file:") return true

    return false
  }
}

/**
 * Create a bridge instance
 * @param routers The routers to use
 * @param opts Configuration options
 * @returns The bridge instance
 */
export const createBridge = <
  Routers extends Record<string, Record<string, ApiFn>>,
>(
  routers: AssertNoReservedKeys<Routers>,
  opts?: ElectronBridge["opts"]
) => new ElectronBridge(routers as Routers, opts)
