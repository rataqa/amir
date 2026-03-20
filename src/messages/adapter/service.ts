import { ConsumeMessage } from 'amqplib';

import { IMessageAdapter } from './types';
import { IOutput } from '../../types';

export class MessageAdapter<TContent = any> implements IMessageAdapter<TContent> {
  protected _textContent = ''; // cache
  protected _jsonContent: TContent | null = null; // cache

  constructor(protected readonly _msg: ConsumeMessage) {
    // do nothin
  }

  msg(): ConsumeMessage {
    return this._msg;
  }

  header(key: string): string {
    return this._msg.properties.headers?.[key] || '';
  }

  fileNameHeader() {
    return this.header('fileName');
  }

  mimeTypeHeader() {
    return this.header('mimeType');
  }

  formatHeader() {
    return this.header('format').toLowerCase() || 'json';
  }

  isJsonFormat(): boolean {
    return this.formatHeader().includes('json');
  }

  isBufferFormat(): boolean {
    return this.formatHeader().includes('buffer');
  }

  correlationIdHeader(): string {
    return this.header('x-correlation-id');
  }

  correlationIdProp(): string {
    return this._msg.properties.correlationId || '';
  }

  bufferContent(): Buffer {
    return this._msg.content;
  }

  textContent(): string {
    if (!this._textContent) {
      this._textContent = this._msg.content.toString('utf-8');
    }
    return this._textContent;
  }

  jsonContent(): IOutput<TContent> {
    if (!this._jsonContent) {
      try {
        this._jsonContent = JSON.parse(this.textContent()) as TContent;
      } catch (err) {
        if (err instanceof Error) {
          return { success: null, error: err }
        } else {
          return { success: null, error: new Error('Failed to parse JSON payload') };
        };
      }
    }
    return { success: this._jsonContent as TContent, error: null };
  }
}
