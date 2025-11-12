// Typed result helpers for server actions
export type ActionOk<T> = { ok: true; data: T }
export type ActionErr = { ok: false; code: string; message: string; details?: unknown }
export type ActionResult<T> = ActionOk<T> | ActionErr

export function ok<T>(data: T): ActionOk<T> {
  return { ok: true, data }
}

export function err(code: string, message: string, details?: unknown): ActionErr {
  return { ok: false, code, message, details }
}
