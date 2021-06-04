const test = require('ava');
const { ServiceBroker } = require('moleculer');
const fetch = require('node-fetch');
const MongoHealthcheck = require('..');
const HealthMiddleware = require('@r2d2bzh/moleculer-healthcheck-middleware');
const DbService = require('moleculer-db');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');

const event = (emitter, eventName) =>
  new Promise((resolve) => emitter.once(eventName, resolve));

const startBroker = async (t, services, healthCheckOpts = {}) => {
  const broker = new ServiceBroker({
    middlewares: [HealthMiddleware({
      liveness: {
        createChecker: MongoHealthcheck.createLivenessChecker
      },
      port: 0,
      ...healthCheckOpts
    })],
    logLevel: 'warn',
  });
  services.forEach(service => {
    broker.createService(service);
  });
  await broker.start();

  let port;
  if (!broker.healthcheck.port) {
    port = await event(broker.healthcheck, 'port');
  } else {
    port = broker.healthcheck.port;
  }

  t.context.broker = broker;
  t.context.healthport = port;
};

const realAdapter = () => new MongoDBAdapter('mongodb://localhost', {
  connectTimeoutMS: 100,
});

const mockAdapter = (t) => {
  return {
    init: () => new Promise(resolve => {resolve(true)}),
    connect: () => new Promise(resolve => {resolve(true)}),
    client: {
      db: () => {
        return {
          topology: {
            isConnected: () => { t.fail('This should not be called') }
          }
        }
      }
    }
  }
};

// This is a temporary workaround for https://github.com/avajs/ava/issues/1378.
// It occurs when the mongo engine is not up, the MongoClient will loop forever
// to initiate its first connection.
test.beforeEach((t) => {
  t.context.timeout = setTimeout(() => process.exit(1), 3000);
});

test.afterEach.always(async (t) => {
  if(t.context.broker) {
    await t.context.broker.stop();
  }
  clearTimeout(t.context.timeout);
});

test('healthcheck answers a 200 when mongo is up', async (t) => {
  await startBroker(t, [
    {
      name: 'adapterMongo',
      mixins: [DbService],
      adapter: realAdapter(),
      collection: 'posts',
    }
  ]);
  const port = t.context.healthport;
  const response = await fetch(`http://127.0.0.1:${port}/live`);
  t.deepEqual(response.status, 200);
});

test('healthcheck answers a 200 when no adapter is found', async (t) => {
  await startBroker(t, [
    {
      name: 'noAdapter',
    }
  ]);
  const port = t.context.healthport;
  const response = await fetch(`http://127.0.0.1:${port}/live`);
  t.deepEqual(response.status, 200);
});

test('healthcheck should only be called on Mongo adapter', async (t) => {
  await startBroker(t, [
    {
      name: 'adapterMongo',
      mixins: [DbService],
      adapter: realAdapter(),
      collection: 'posts',
    },
    {
      name: 'adapterFake',
      mixins: [DbService],
      adapter: mockAdapter(t)
    }
  ]);
  const port = t.context.healthport;
  const response = await fetch(`http://127.0.0.1:${port}/live`);
  t.deepEqual(response.status, 200);
});
