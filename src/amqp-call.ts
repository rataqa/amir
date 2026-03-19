import { IObjectWithStrings } from '@rataqa/amil';
import { ChannelWrapper } from 'amqp-connection-manager';

export async function amqpCall(
  ch: ChannelWrapper,
  q: string,
  content: any = {},
  headers: IObjectWithStrings = {},
) {
  let success = false, error: Error | null = null;
  try {
    // await ch.assertQueue(q); //, { durable: true });
    const json = JSON.stringify(content);
    const contentBuff = Buffer.from(json, 'utf-8');
    await ch.sendToQueue(q, contentBuff, { headers });
    success = true;
  } catch (err) {
    error = err instanceof Error ? err : new Error('amqpCall: Unknown error');
  }
  return { success, error };
}
