import { IMsgContentWithHttpCallback } from './types';

export function msgHasHttpCallback(msg: any): msg is IMsgContentWithHttpCallback {
  if (msg && typeof msg === 'object') {
    if ('httpCallback' in msg) {
      if (typeof msg.httpCallback === 'object') {
        if ('url' in msg.httpCallback) {
          return true;
        }
      }
    }
  }
  return false;
}
