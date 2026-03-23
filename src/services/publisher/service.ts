import { IBasicLogger } from '@rataqa/sijil';
import { ChannelWrapper } from 'amqp-connection-manager';

import { IInputToPublishToExchange, IInputToSendToQueue, IMessagePublisher } from './types';
import { IOutput } from '../../types';
import { fireAndForget } from '../../utils';

export class MessagePublisher implements IMessagePublisher {

  constructor(
    protected _channel: ChannelWrapper,
    protected _logger: IBasicLogger,
  ) {
    // do nothing
  }

  setLogger(logger: IBasicLogger) {
    this._logger = logger;
  }

  setChannel(channel: ChannelWrapper) {
    this._channel = channel;
  }

  async sendToQueue(input: IInputToSendToQueue): Promise<IOutput<boolean>> {
    let success = false, error: Error | null = null;
    try {
      const { queue, content, options = {}} = input;
      success = await this._channel.sendToQueue(queue, content, options);
      fireAndForget(() => this._logger.info('AMQP publisher sendToQueue() done!', { queue }));
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
      fireAndForget(() => this._logger.info('AMQP publisher publishToExchange() done!', { exchange, routingKey }));
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error: ' + String(err));
    }
    return { success, error };
  }
}
