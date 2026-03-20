import { ConsumeMessage } from 'amqplib';

import { IOutput } from '../../types';

export interface IMessageAdapter<TContent = any> {
  msg()                : ConsumeMessage;
  correlationIdHeader(): string;
  correlationIdProp()  : string;
  header(key: string)  : string;
  formatHeader()       : string;
  isJsonFormat()       : boolean;
  isBufferFormat()     : boolean;
  bufferContent()      : Buffer;
  textContent()        : string;
  jsonContent()        : IOutput<TContent>;
}
