import { ILogger } from '@rataqa/sijil';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import _merge from 'lodash/merge';

import { IAmir, IChannelsByQueue, IOptionsToRegisterQueue } from './types';
import { fireAndForget, noOp } from '../utils';
import { httpCall } from '../services/http/service';
import { IWorker } from '../amil/types';
import { MessageAdapter } from '../messages';
import { IMessagePublisher, MessagePublisher, msgHasAmqpCallback, msgHasHttpCallback } from '../services';

/**
 * timeout in ms for connect(), createChannel(), publish()
 */
const TIMEOUT_MS = 15_000;

/**
 * Listens to queues and wraps handlers of workers
 */
export class Amir implements IAmir {
  protected _channels: IChannelsByQueue = {};
  protected _publisherChannel: ChannelWrapper | null = null;

  constructor(
    protected _amqp: AmqpConnectionManager,
    protected _logger: ILogger,
  ) {
    // do nothing
  }

  amqp() {
    return this._amqp;
  }

  logger() {
    return this._logger;
  }

  channels() {
    return this._channels;
  }

  publisher(): IMessagePublisher {
    if (this._publisherChannel) {
      return new MessagePublisher(this._publisherChannel, this._logger.defaultLogger);
    }
    throw new Error('AMQP publisher channel is not set');
  }

  async start() {
    const dl = this._logger.defaultLogger;

    this._amqp.on('connect', () => {
      dl.info('AMQP connected');
    });

    this._amqp.on('disconnect', () => {
      dl.warn('AMQP disconnected');
    });

    this._amqp.on('connectFailed', (error) => {
      dl.error('AMQP connectFailed', { error });
    });

    await this._amqp.connect({ timeout: TIMEOUT_MS });
    this._publisherChannel = this._amqp.createChannel({ publishTimeout: TIMEOUT_MS });
  }

  isConnected(): boolean {
    return this._amqp.isConnected();
  }

  async register<TInMsgContent = any, TOutSuccess = any>(
    queue: string,
    worker: IWorker<TOutSuccess>,
    options: IOptionsToRegisterQueue = {},
  ) {
    const _this = this;
    const dl = _this._logger.defaultLogger;
    const { assertQueue = true, isDurable: durable = true, ackRequired = true, prefetchMsgCount = 1 } = options;

    dl.info('AMQP creating channel...');
    const channel = _this._amqp.createChannel({
      setup: async (ch: Channel) => {
        dl.info('AMQP asserting queue...', { queue, durable });
        if (assertQueue) await ch.assertQueue(queue, { durable });
      },
    });

    
    async function handle(msg: ConsumeMessage | null) {
      if (!msg) return; // no message!
      
      const msgPublisher = _this.publisher();
      const ma = new MessageAdapter<TInMsgContent>(msg);
      const correlation_id = ma.correlationIdHeader();
      const messageId = msg.properties.messageId || 'uknown';
      const l = _this._logger.makeLoggerPerRequest({ correlation_id, messageId });
      let output: any = null;
      try {
        l.info('AMQP worker working...');

        // dependency injection
        if (worker.setLogger) worker.setLogger(l);
        if (worker.setMsgPublisher) worker.setMsgPublisher(msgPublisher);

        // call worker
        const workResult = await worker.work(msg);

        // success can be 0 or false as well now
        if (!(workResult.error instanceof Error)) {
          output = workResult.success;
          if (ackRequired) channel.ack(msg);
          l.info('AMQP worker success!', { success: workResult.success });
        } else {
          output = workResult.error;
          if (ackRequired) channel.nack(msg);
          l.error('AMQP worker error!', { error: workResult.error });
        }
      } catch (err: unknown) {
        if (ackRequired) channel.nack(msg);
        l.error('Working... Error!', { error: err });
        output = err;
      }

      
      fireAndForget(async () => {
        const { success: jsonObj } = ma.jsonContent();

        // HTTP callback logic -- regardless of work success/error
        if (jsonObj && msgHasHttpCallback(jsonObj) && jsonObj.httpCallback) {
          const { httpCallback, ...otherInputs } = jsonObj;
          const { url, headers = {}, mergeOutput = false, body = {} } = httpCallback;
          dl.info('http calling', { url });
          const reqBody = mergeOutput ? _merge(otherInputs, body, output) : { input: otherInputs, output, body };
          const httpCallResult = await httpCall(url, reqBody, headers);
          dl.info('http call result', { httpCallResult });
        }

      }).then(noOp).catch(noOp);

      fireAndForget(async () => {
        const { success: jsonObj } = ma.jsonContent();

        // AMQP callback logic -- regardless of work success/error
        if (jsonObj && msgHasAmqpCallback(jsonObj) && jsonObj.amqpCallback) {
          const { amqpCallback, ...otherInputs } = jsonObj;
          const { queue: q, headers = {}, mergeOutput = false, content = {} } = amqpCallback;
          dl.info('amqp calling', { queue: q });
          const contentObj = mergeOutput ? _merge(otherInputs, content, output) : { input: otherInputs, output, content };
          const contentStr = JSON.stringify(contentObj);
          const contentBuff = Buffer.from(contentStr, 'utf-8');
          const amqpCallResult = await msgPublisher.sendToQueue({ queue: q, content: contentBuff, options: { headers }});
          dl.info('amqp call result', { amqpCallResult });
        }

      }).then(noOp).catch(noOp);
    }

    dl.info('AMQP subscribing...', { queue, ackRequired });
    const result = await channel.consume(queue, handle, { noAck: !ackRequired, prefetch: prefetchMsgCount });
    dl.info('AMQP consume', { queue, result });

    this._channels[queue] = { channel, worker };
  }

  async stop() {
    const dl = this._logger.defaultLogger;
    dl.info('AMQP stopping...');

    const rows = Object.entries(this.channels);

    for (const [queue, { channel, worker }] of rows) {
      dl.info('AMQP stopping channel and worker...', { queue });
      await fireAndForget(() => worker.stop && worker.stop());
      await fireAndForget(() => channel.close());
      delete this._channels[queue]; // remove
    }

    await fireAndForget(() => this._amqp.close());
    dl.info('AMQP stopped!');
  }
}

/**
 * Alias for Amir
 */
export class MainWorker extends Amir {
  // do nothing
}
