import { IpcRendererEvent } from "electron";
import { type EventDef, type ElectronBridge } from "./index";

type StripFirstArg<T extends (...args: any[]) => any> = T extends (
  first: any,
  ...rest: infer R
) => any
  ? (...args: R) => any
  : never;

type ToRendererApi<T extends ElectronBridge> = T extends ElectronBridge<
  infer _,
  infer _,
  infer RouterDef
>
  ? {
      [K in keyof RouterDef]: {
        [F in keyof RouterDef[K]]: StripFirstArg<RouterDef[K][F]>;
      };
    }
  : never;

type EventHandlingFunction<Def extends EventDef, Event = IpcRendererEvent> = <
  T extends keyof Def & string
>(
  event: T,
  fn: (e: Event, data: Def[T]) => void
) => () => void;

type ToEventApi<T extends ElectronBridge> = T extends ElectronBridge<
  infer RendererEventsDef,
  infer MainEventsDef,
  infer _
>
  ? {
      emit: <T extends keyof RendererEventsDef & string>(
        event: T,
        data: RendererEventsDef[T]
      ) => void;
      on: EventHandlingFunction<MainEventsDef>;
      once: EventHandlingFunction<MainEventsDef>;
      off: EventHandlingFunction<MainEventsDef>;
    }
  : never;

// prettier-ignore
export const createRendererBridge = <T extends ElectronBridge = never>() => {
  const __bridge = (window as any).__bridge as any;
  const api = new Proxy({}, {
    get: (_, router: string) => new Proxy({}, {
      get: (_, fn: string) => (...args: any[]) => (
        __bridge.call(`${router}.${fn}`, ...args)
      )
    })
  }) as unknown as ToRendererApi<T>

  const events = {
    emit: __bridge.emit,
    on: __bridge.on,
    once: __bridge.once,
    off: __bridge.off
  } as ToEventApi<T>

  return { api, events };
};
