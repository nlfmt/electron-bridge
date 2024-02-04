import type { IpcMainInvokeEvent } from "electron"

export type If<T, U, Then, Else> = T extends U ? Then : Else

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