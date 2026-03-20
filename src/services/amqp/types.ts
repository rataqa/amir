import { ChannelWrapper } from 'amqp-connection-manager';

import { IObjectWithStrings } from '../../types';

export interface IMsgContentWithAmqpCallback {
  amqpCallback?: IAmqpCallback;
}

export interface IAmqpCallback {
  queue       : string;
  headers?    : IObjectWithStrings;
  mergeOutput?: boolean;
}

export interface IInputForAmqpCall {
  channel: ChannelWrapper;
  queue: string;
  content: any;
  headers: IObjectWithStrings;
}

export interface IOutputForAmqpCall {
  success: boolean;
  error?: Error | null;
}
