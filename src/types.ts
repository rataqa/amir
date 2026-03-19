import { IWorker } from '@rataqa/amil';
import { ILogger } from '@rataqa/sijil';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

export interface IAmir {
  amqp: AmqpConnectionManager;
  channels: IChannelsByQueue;
  publisher: ChannelWrapper | null;
  logger: ILogger;
  start(): Promise<void>;
  register(queue: string, worker: IWorker, options?: IOptionsToRegisterQueue): Promise<void>;
  stop(): Promise<void>;
}

export type IConsumer = IAmir;

export interface IChannelsByQueue {
  [queue: string]: {
    channel: ChannelWrapper;
    worker: IWorker;
  };
}

export interface IOptionsToRegisterQueue {
  /**
   * true by default
   */
  isDurable?: boolean;

  /**
   * true by default
   */
  ackRequired?: boolean;

  prefetch?: number;
}
