import { IpcRendererEvent } from "electron"
import { type EventDef, type ElectronBridge } from "./index"

type StripFirstArg<T extends (...args: any[]) => any> = T extends (
  first: any,
  ...rest: infer R
) => any
  ? (...args: R) => any
  : never

type ToRendererApi<T extends ElectronBridge> = T extends ElectronBridge<
  infer _,
  infer _,
  infer RouterDef
>
  ? {
      [K in keyof RouterDef]: {
        [F in keyof RouterDef[K]]: StripFirstArg<RouterDef[K][F]>
      }
    }
  : never

type ToEventApi<T extends ElectronBridge> = T extends ElectronBridge<infer REDef, infer MEDef, infer _> ? {
  emit<T extends keyof REDef & string>(event: T, data: REDef[T]): void
  on<T extends keyof MEDef & string>(event: T, fn: (e: Event, data: MEDef[T]) => void): () => void
  once<T extends keyof MEDef & string>(event: T, fn: (e: Event, data: MEDef[T]) => void): () => void
  off<T extends keyof MEDef & string>(event: T, fn: (e: Event, data: MEDef[T]) => void): () => void
} : never

export const createRendererBridge = <T extends ElectronBridge = never>(
  name = "__bridge"
) => {
  const __bridge = (window as any)[name] as any
  if (!__bridge)
    throw new Error(
      `'${name}' not found. Did you forget to call registerBridgePreload() in your preload script?`
    )
  
  const events: Record<string, any> = {
    emit: __bridge.emit,
    on: __bridge.on,
    once: __bridge.once,
    off: __bridge.off,
  }

  // prettier-ignore
  const api = new Proxy(events, {
    get: (events, key: string) => {
      if (key in events) return events[key]
      return new Proxy({}, {
        get: (_, fn: string) => (...args: any[]) => (
          __bridge.invoke(`${key}.${fn}`, ...args)
        )
      })
    }
  }) as ToRendererApi<T> & ToEventApi<T>


  return api
}
