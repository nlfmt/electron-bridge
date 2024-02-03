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

type EventHandlingFunction<Def extends EventDef, Event = IpcRendererEvent> = <
  T extends keyof Def & string
>(
  event: T,
  fn: (e: Event, data: Def[T]) => void
) => () => void

type EventApi<MainEventsDef extends EventDef, RendererEventsDef extends EventDef> = {
  emit: <T extends keyof RendererEventsDef & string>(
    event: T,
    data: RendererEventsDef[T]
  ) => void
  on: EventHandlingFunction<MainEventsDef>
  once: EventHandlingFunction<MainEventsDef>
  off: EventHandlingFunction<MainEventsDef>
}

type ToEventApi<T extends ElectronBridge> = T extends ElectronBridge<
  infer RendererEventsDef,
  infer MainEventsDef,
  infer _
>
  ? EventApi<MainEventsDef, RendererEventsDef>
  : never

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
          __bridge.call(`${key}.${fn}`, ...args)
        )
      })
    }
  }) as ToRendererApi<T> & ToEventApi<T>


  return api
}
