import { ChannelWrapper } from 'amqp-connection-manager';

import { IObject, IObjectWithStrings } from '../../types';

export interface IMsgContentWithAmqpCallback {
  amqpCallback?: IAmqpCallback;
}

export interface IAmqpCallback {
  queue       : string;
  headers?    : IObjectWithStrings;
  mergeOutput?: boolean;
  content    ?: IObject;
}

export interface IInputForAmqpCall {
  channel: ChannelWrapper;
  queue  : string;
  content: Buffer;
  headers: IObjectWithStrings;
}

export interface IOutputForAmqpCall {
  success: boolean;
  error?: Error | null;
}
