import { ILogger } from '@rataqa/sijil';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';

import { IAmir, IChannelsByQueue, IOptionsToRegisterQueue } from './types';
import { fireAndForget } from '../utils';
import { httpCall } from '../services/http/service';
import { amqpCall } from '../services/amqp/service';
import { IWorker } from '../amil/types';
import { MessageAdapter } from '../messages';

/**
 * Listens to queues and wraps handlers of workers
 */
export class Amir implements IAmir {
  protected _channels: IChannelsByQueue = {};
  protected _publisher: ChannelWrapper | null = null;

  constructor(
    protected _amqp: AmqpConnectionManager,
    protected _logger: ILogger,
    //public http = makeAxiosFactory(),
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

  publisher(): ChannelWrapper {
    if (this._publisher) return this._publisher;
    throw new Error('AMQP publisher channel is not set');
  }

  async start() {
    const dl = this._logger.defaultLogger;

    this._amqp.on('connect', () => {
      dl.info('AMQP connected');
    });

    this._amqp.on('disconnect', () => {
      dl.info('AMQP disconnected');
    });

    this._amqp.on('connectFailed', (error) => {
      dl.info('AMQP connectFailed', { error });
    });

    await this._amqp.connect();
    this._publisher = this._amqp.createChannel();
  }

  async register(queue: string, worker: IWorker, options: IOptionsToRegisterQueue = {}) {
    const this_ = this;
    const dl = this_._logger.defaultLogger;
    const { isDurable: durable = true, ackRequired = true, prefetchMsgCount = 1 } = options;

    dl.info('AMQP creating channel...');
    const channel = this_._amqp.createChannel({
      setup: async (ch: Channel) => {
        dl.info('AMQP asserting queue...', { queue, durable });
        await ch.assertQueue(queue, { durable });
      },
    });

    async function handle(msg: ConsumeMessage | null) {
      if (!msg) return; // no message!

      const ma = new MessageAdapter(msg);
      const correlation_id = ma.correlationIdHeader();
      const messageId = msg.properties.messageId || 'uknown';
      const l = this_._logger.makeLoggerPerRequest({ correlation_id, messageId });
      let output: any = null;
      try {
        l.info('AMQP worker working...');
        const workResult = await worker.work(msg); // call worker
        if (workResult.success) {
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

      // HTTP callback logic -- regardless of work success/error
      const input = ma.jsonContent();
      if (input.success?.httpCallback) {
        const { httpCallback, ...otherInputs } = input.success;
        const { url, headers = {}, mergeOutput = false } = httpCallback;
        dl.info('http calling', { url });
        const reqBody = mergeOutput ? { ...otherInputs, ...output } : { input: otherInputs, output };
        const httpCallResult = await httpCall(url, reqBody, headers);
        dl.info('http call result', { httpCallResult });
      }

      // AMQP callback logic -- regardless of work success/error
      if (input.success?.amqpCallback && this_.publisher) {
        const { amqpCallback, ...otherInputs } = input.success;
        const { queue: q, headers = {}, mergeOutput = false } = amqpCallback;
        dl.info('amqp calling', { queue: q });
        const content = mergeOutput ? { ...otherInputs, ...output } : { input: otherInputs, output };
        const amqpCallResult = await amqpCall({ channel: this_.publisher(), queue: q, content, headers });
        dl.info('amqp call result', { amqpCallResult });
      }
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
