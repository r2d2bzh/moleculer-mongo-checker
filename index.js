import assert from 'node:assert';

/**
 * Creates a Healthcheck checker for Mongo liveness
 * This must be passed as a parameter to the HealthMiddleware liveness.createChecker
 * @param {Object} broker to check liveness
 */
const createLivenessChecker = (broker) => {
  return (callback) => {
    try {
      const mongoServices = broker.services.filter((service) => hasMongoAdapter(service));
      for (const service of mongoServices) {
        assert.ok(adapterIsConnected(service.adapter), 'Moleculer database adapter not connected');
      }
      callback();
    } catch (error_) {
      const error = error_.message || error_;
      broker.getLogger('moleculer-mongo-checker').warn(error);
      callback(error);
    }
  };
};

const hasMongoAdapter = (moleculerService) => {
  const adapter = moleculerService.adapter;
  return adapter && adapter.service && adapter.service.name === 'adapterMongo';
};

const adapterIsConnected = (adapter) => {
  const database = adapter.client.db();
  return database.topology.isConnected();
};

export default {
  createLivenessChecker,
};
