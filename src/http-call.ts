import { IObjectWithStrings } from "@rataqa/amil";

export async function httpCall(
  url: string,
  reqBody: any = {},
  headers: IObjectWithStrings = {},
) {
  try {
    const res = await fetch(url, {
      method: 'post',
      headers: { ...headers, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(reqBody),
    });

    const body = await res.text();

    return {
      success: res.ok,
      status: res.status,
      headers: res.headers,
      body,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
