const assert = require('assert');

module.exports = {
  createLivenessChecker
};

/**
 * Creates a Healthcheck checker for Mongo liveness
 * This must be passed as a parameter to the HealthMiddleware liveness.createChecker
 * @param {Object} broker to check liveness
 */
function createLivenessChecker(broker) {
  return (callback) => {
    try {
      broker.services
        .filter(hasMongoAdapter)
        .forEach((service) => assert(adapterIsConnected(service.adapter), 'Moleculer database adapter not connected'));
      callback();
    } catch (e) {
      const error = e.message || e;
      broker.getLogger('moleculer-mongo-checker').warn(error);
      callback(error);
    }
  }
};

function hasMongoAdapter(moleculerService) {
  const adapter = moleculerService.adapter;
  return adapter && adapter.service && adapter.service.name === 'adapterMongo';
};

function adapterIsConnected(adapter) {
  const db = adapter.client.db();
  return db.topology.isConnected();
};
