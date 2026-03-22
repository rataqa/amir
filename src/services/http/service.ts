import { IObjectWithStrings } from '../../types';

const JSON_MIME_TYPE = 'application/json';

const defaultHeaders = {
  accept: JSON_MIME_TYPE,
  'content-type': JSON_MIME_TYPE,
};

export async function httpCall(
  url: string,
  reqBody: any = {},
  headers: IObjectWithStrings = {},
) {
  try {
    const res = await fetch(url, {
      method: 'post',
      headers: { ...headers, ...defaultHeaders },
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
