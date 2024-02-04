import { type ElectronBridge } from "./index"
import type { ExposedFunctions } from "./preload"
import type { Prettify, StripFirstArg } from "./types"


type RendererBridge<T extends ElectronBridge> = T extends ElectronBridge<
  infer REDef,
  infer MEDef,
  infer RouterDef
>
  ? {
      [K in keyof RouterDef]: {
        [F in keyof RouterDef[K]]: StripFirstArg<RouterDef[K][F]>
      }
    } & {
      emit<T extends keyof REDef & string>(event: T, data: REDef[T]): void
      on<T extends keyof MEDef & string>(event: T, fn: (e: Event, data: MEDef[T]) => void): () => void
      once<T extends keyof MEDef & string>(event: T, fn: (e: Event, data: MEDef[T]) => void): () => void
      off<T extends keyof MEDef & string>(event: T, fn: (e: Event, data: MEDef[T]) => void): () => void
    }
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
  }) as Prettify<RendererBridge<T>>

  return api
}
