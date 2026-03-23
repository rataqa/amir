import { IBasicLogger } from '@rataqa/sijil';
import { Options } from 'amqplib';
import { ChannelWrapper } from 'amqp-connection-manager';

import { IOutput } from '../../types';

export interface IMessagePublisher {
  setLogger(logger: IBasicLogger): void;
  setChannel(channel: ChannelWrapper): void;

  sendToQueue(input: IInputToSendToQueue): Promise<IOutput<boolean>>;
  publishToExchange(input: IInputToPublishToExchange): Promise<IOutput<boolean>>;
}

export interface IInputToSendToQueue {
  queue   : string;
  content : Buffer;
  options?: Options.Publish;
}

export interface IInputToPublishToExchange {
  exchange   : string;
  routingKey : string;
  content    : Buffer;
  options   ?: Options.Publish;
}
