// local utils

export function noOp() {}

export async function fireAndForget(f: Function) {
  try {
    const p = f();
    if (p instanceof Promise) {
      await p;
    }
  } catch (err) {
    // ignore
  }
}

export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
