import { ILogger } from '@rataqa/sijil';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { IWorker } from '../amil/types';

export interface IAmir {
  amqp()     : AmqpConnectionManager;
  channels() : IChannelsByQueue;
  publisher(): ChannelWrapper;
  logger()   : ILogger;
  start()    : Promise<void>;
  stop()     : Promise<void>;

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
   */
  assertQueue?: boolean;

  /**
   * If asserting queue, will it be durable?
   * true by default
   */
  isDurable?: boolean;

  /**
   * true by default
   */
  ackRequired?: boolean;

  prefetchMsgCount?: number;
}
