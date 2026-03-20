import { IInputForAmqpCall, IOutputForAmqpCall } from './types';

/**
 * Sends message to AMQP queue
 * @deprecated use publisher
 */
export async function amqpCall(input: IInputForAmqpCall): Promise<IOutputForAmqpCall> {
  let success = false, error: Error | null = null;
  try {
    const { channel, content, queue, headers = {}} = input;

    // await ch.assertQueue(q); //, { durable: true });

    const json = JSON.stringify(content);
    const contentBuff = Buffer.from(json, 'utf-8');
    success = await channel.sendToQueue(queue, contentBuff, { headers });
  } catch (err) {
    error = err instanceof Error ? err : new Error('amqpCall: Unknown error');
  }
  return { success, error };
}
