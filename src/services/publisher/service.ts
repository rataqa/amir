import { ChannelWrapper } from 'amqp-connection-manager';

import { IInputToPublishToExchange, IInputToSendToQueue, IMessagePublisher } from './types';
import { IOutput } from '../../types';

export class MessagePublisher implements IMessagePublisher {

  constructor(protected _channel: ChannelWrapper) {
    // do nothing
  }

  channel(): ChannelWrapper {
    return this._channel;
  }

  async sendToQueue(input: IInputToSendToQueue): Promise<IOutput<boolean>> {
    let success = false, error: Error | null = null;
    try {
      const { queue, content, options = {}} = input;
      success = await this._channel.sendToQueue(queue, content, options);
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error: ' + String(err));
    }
    return { success, error };
  }

  async publishToExchange(input: IInputToPublishToExchange): Promise<IOutput<boolean>> {
    let success = false, error: Error | null = null;
    try {
      const { exchange, routingKey, content, options = {} } = input;
      success = await this._channel.publish(exchange, routingKey, content, options);
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error: ' + String(err));
    }
    return { success, error };
  }
}
