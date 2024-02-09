import { IpcRendererEvent } from "electron"
import { type ElectronBridge } from "./index"
import type { ExposedFunctions } from "./preload"
import type { EmitArgs, EventCallback, Prettify, StripFirstArg } from "./types"


export type RendererBridge<T extends ElectronBridge> = T extends ElectronBridge<
  infer REDef,
  infer MEDef,
  infer RouterDef
>
  ? Prettify<{
      [K in keyof RouterDef]: {
        [F in keyof RouterDef[K]]: StripFirstArg<RouterDef[K][F]>
      }
    } & {
      emit<T extends keyof REDef & string>(...args: EmitArgs<REDef, T>): void
      on<T extends keyof MEDef & string>(event: T, fn: EventCallback<MEDef, T, IpcRendererEvent>): () => void
      once<T extends keyof MEDef & string>(event: T, fn: EventCallback<MEDef, T, IpcRendererEvent>): () => void
      off<T extends keyof MEDef & string>(event: T, fn: EventCallback<MEDef, T, IpcRendererEvent>): () => void
    }>
  : never

/**
 * Create the renderer bridge proxy to call functions in the main process
 * @param name Optionally rename the bridge, has to match the name in `registerBridgePreload`
 * @returns The bridge proxy
 */
export function createRendererBridge<T extends ElectronBridge = never>(
  name = "__bridge"
) {
  const bridge = (window as any)[name] as ExposedFunctions
  if (!bridge)
    throw new Error(
      `[electron-bridge]: '${name}' not found. Did you forget to call registerBridgePreload() in your preload script?`
    )
  
  const events: Record<string, any> = {
    emit: bridge.emit,
    on: bridge.on,
    once: bridge.once,
    off: bridge.off,
  }

  // prettier-ignore
  const api = new Proxy(events, {
    get: (events, key: string) => {
      if (key in events) return events[key]
      return new Proxy({}, {
        get: (_, fn: string) => (...args: any[]) => (
          bridge.invoke(`${key}.${fn}`, ...args)
        )
      })
    }
  })

  return api as RendererBridge<T>
}
