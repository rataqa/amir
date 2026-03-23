import { IBasicLogger } from '@rataqa/sijil';

import { IAmil } from './types';
import { IMessagePublisher } from '../services';
import { ConsumeMessage } from 'amqplib';
import { IOutput } from '../types';

export abstract class Amil<TSuccess = any> implements IAmil<TSuccess> {
  constructor(
    protected _logger: IBasicLogger,
    protected _msgPublisher: IMessagePublisher,
  ) {
    // do nothing
  }

  setLogger(logger: IBasicLogger) {
    this._logger = logger;
  }

  setMsgPublisher(msgPublisher: IMessagePublisher) {
    this._msgPublisher = msgPublisher;
  }

  abstract work(msg: ConsumeMessage): Promise<IOutput<TSuccess>>;
}
