import type { IpcMainEvent, IpcMainInvokeEvent } from "electron"

export type ApiFn = (e: IpcMainInvokeEvent, ...args: any[]) => any
export type EventDef = Record<string, any>
export type RouterDef = Record<string, Record<string, ApiFn>>

export type StripFirstArg<T extends (...args: any[]) => any> = T extends (
  first: any,
  ...rest: infer Args
) => infer R
  ? (...args: Args) => R
  : never

// Flattens types for better readability
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type EmitArgs<
  Def extends EventDef,
  T extends keyof Def
> = Def[T] extends void ? [event: T] : [event: T, data: Def[T]]

export type EventCallback<
  Def extends EventDef,
  T extends keyof Def,
  E = IpcMainEvent
> = Def[T] extends void ? (e: E) => void : (e: E, data: Def[T]) => void
