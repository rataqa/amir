import { makeLogger } from '@rataqa/sijil';
import { Channel, ConsumeMessage } from 'amqplib';
import amqp from 'amqp-connection-manager';
import dotenv from 'dotenv';
import { strictEqual } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';

import { Amir } from '../amir/service';
import { waitForMs } from '../utils';
import { IOutput } from '../types';
import { IAmil } from '../amil/types';
import { MessageAdapter } from '../messages';
import { IMsgContentWithAmqpCallback } from '../services/amqp/types';
import { IMsgContentWithHttpCallback } from '../services/http/types';

dotenv.config(); // use .env and configure AMQP_URI

// you can use Docker
const {
  AMQP_URI = 'amqp://localhost:5672',
  HTTP_CALLBACK = 'http://example.com',
  API_KEY = 'api-key-missing',
} = process.env;

interface IInput1 extends IMsgContentWithHttpCallback {
  a: number;
  b: number;
}
interface IOutput1 {
  c: number;
}

class MyWorker1 implements IAmil<IOutput1>  {

  async work(msg: ConsumeMessage): Promise<IOutput<IOutput1>> {
    const ma = new MessageAdapter<IInput1>(msg);
    const input = ma.jsonContent();
    const a = input?.success?.a || 0;
    const b = input?.success?.b || 0;
    const c = a + b;
    console.info({ a, b, c });
    return { success: { c } };
  }
}

interface IInput2 extends IMsgContentWithAmqpCallback {
  aa: number;
  bb: number;
}
interface IOutput2 {
  cc: number;
}

class MyWorker2 implements IAmil<IOutput2>  {

  async work(msg: ConsumeMessage): Promise<IOutput<IOutput2>> {
    const ma = new MessageAdapter<IInput2>(msg);
    const input = ma.jsonContent();
    const aa = input?.success?.aa || 0;
    const bb = input?.success?.bb || 0;
    const cc = aa * bb;
    console.info({ aa, bb, cc });
    return { success: { cc } };
  }
}

describe('amir', () => {

  const amqpConn = amqp.connect(AMQP_URI);
  const logger = makeLogger('pino', { appName: 'test', appVersion: '1.0.0' });

  const amil1 = new MyWorker1();
  const amil2 = new MyWorker2();

  it('should register workers, consume messages and delegate', async () => {
    const chTester = await amqpConn.createChannel();
    //await chTester.assertQueue('test-q1', { durable: false });
    //await chTester.assertQueue('test-q2', { durable: false });

    const amir = new Amir(amqpConn, logger);

    await amir.start();

    amir.register('test-q1', amil1, { isDurable: false });
    amir.register('test-q2', amil2, { isDurable: false });

    async function sendInput1(mergeOutput = false) {
      const corr1 = randomUUID();
      const input: IInput1 = {
        a: 1,
        b: 2,
        httpCallback: {
          url: HTTP_CALLBACK,
          headers: { 'x-correlation-id': corr1, 'x-api-key': API_KEY },
          mergeOutput,
        },
      }
      const b1 = Buffer.from(JSON.stringify(input), 'utf-8');
      await chTester.sendToQueue('test-q1', b1, { headers: { 'x-correlation-id': corr1 }});
    }

    await sendInput1(false); // case 1
    await waitForMs(5_000);
    await sendInput1(true); // case 2
    await waitForMs(5_000);

    const chCheckCallback = await amqpConn.createChannel({
      setup: async (ch: Channel) => {
        await ch.assertQueue('test-q2-cb'); //, { durable: true });
      },
    });
    await chCheckCallback.consume('test-q2-cb', (msg) => {
      const content = msg.content.toString('utf-8');
      const { headers } = msg.properties;
      console.info('msg on callback queue', { content, headers });
    });

    await waitForMs(5_000);

    async function sendInput2(mergeOutput = false) {
      const corr2 = randomUUID();
      const input2: IInput2 = {
        aa: 2,
        bb: 3,
        amqpCallback: {
          queue: 'test-q2-cb',
          headers: {
            'x-correlation-id': corr2,
          },
          mergeOutput,
        },
      };
      const b2 = Buffer.from(JSON.stringify(input2), 'utf-8');
      await chTester.sendToQueue('test-q2', b2, { headers: { 'x-correlation-id': corr2 }});
    }

    await sendInput2(false); // case 3
    await waitForMs(5_000);
    await sendInput2(true); // case 4
    await waitForMs(5_000);

    await chTester.close();
    await chCheckCallback.close();
    await amir.stop();

    strictEqual(1, 1);// do not expect any errors
  });

});
