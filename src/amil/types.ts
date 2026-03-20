import { ConsumeMessage } from 'amqplib';

import { IOutput } from '../types';

export interface IAmil<TSuccess = any> {
  work(msg: ConsumeMessage): Promise<IOutput<TSuccess>>;
  stop?: () => Promise<void>;
}

/**
 * Alias for IAmil 
 */
export type IWorker<TSuccess = any> = IAmil<TSuccess>;
