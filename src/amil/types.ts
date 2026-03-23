import { IBasicLogger } from '@rataqa/sijil';
import { ConsumeMessage } from 'amqplib';

import { IOutput } from '../types';
import { IMessagePublisher } from '../services';

export interface IAmil<TSuccess = any> {
  work: (msg: ConsumeMessage) => Promise<IOutput<TSuccess>>;

  setLogger      ?: (logger: IBasicLogger) => void;
  setMsgPublisher?: (msgPublisher: IMessagePublisher) => void;
  stop           ?: () => Promise<void>;
}

/**
 * Alias for IAmil 
 */
export type IWorker<TSuccess = any> = IAmil<TSuccess>;
