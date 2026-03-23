import { IMsgContentWithAmqpCallback } from './types';

export function msgHasAmqpCallback(msg: any): msg is IMsgContentWithAmqpCallback {
  if (msg && typeof msg === 'object') {
    if ('amqpCallback' in msg) {
      if (typeof msg.amqpCallback === 'object') {
        if ('queue' in msg.amqpCallback) {
          return true;
        }
      }
    }
  }
  return false;
}
