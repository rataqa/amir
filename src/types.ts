// shared types

export type IObjectWithStrings = Record<string, string>;

export interface IOutput<TSuccess = any> {
  success?: TSuccess | null;
  error?: Error | null;
}
