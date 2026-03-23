import { IBasicLogger } from '@rataqa/sijil';

import { IAmil } from './types';
import { IMessagePublisher } from '../services';
import { ConsumeMessage } from 'amqplib';
import { IOutput } from '../types';

export abstract class AmilToEcho implements IAmil<IEchoSuccess> {
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

  async work(msg: ConsumeMessage): Promise<IOutput<IEchoSuccess>> {
    const { content, properties } = msg;
    const headers = properties.headers || {};
    return { success: { content, headers }, error: null };
  }
}

interface IEchoSuccess {
  content: Buffer;
  headers: Record<string, string> | ConsumeMessage['properties']['headers'];
}
