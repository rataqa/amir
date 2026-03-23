import { IObject, IObjectWithStrings } from '../../types';

export interface IMsgContentWithHttpCallback {
  httpCallback?: IHttpCallback;
}

export interface IHttpCallback {
  // method is always post
  url         : string;
  headers?    : IObjectWithStrings;
  mergeOutput?: boolean;
  body       ?: IObject;
}
