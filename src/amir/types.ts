import { ILogger } from '@rataqa/sijil';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

import { IWorker } from '../amil/types';
import { IMessagePublisher } from '../services';

export interface IAmir {
  amqp()       : AmqpConnectionManager;
  isConnected(): boolean;
  channels()   : IChannelsByQueue;
  publisher()  : IMessagePublisher;
  logger()     : ILogger;
  start()      : Promise<void>;
  stop()       : Promise<void>;

  register(queue: string, worker: IWorker, options?: IOptionsToRegisterQueue): Promise<void>;
}

/**
 * Alias for IAmir
 */
export type IConsumer = IAmir;

export interface IChannelsByQueue {
  [queue: string]: {
    channel: ChannelWrapper;
    worker: IWorker;
  };
}

export interface IOptionsToRegisterQueue {
  /**
   * Shall we make sure queue exists first?
   * default value is true
   */
  assertQueue?: boolean;

  /**
   * If asserting queue, will it be durable?
   * default value is true
   */
  isDurable?: boolean;

  /**
   * Decide: acknowledgement of each message is required to remove from queue.
   * default value is true
   */
  ackRequired?: boolean;

  /**
   * Number of messages to fetch
   * default value is 1
   */
  prefetchMsgCount?: number;
}
