const assert = require('assert');
const MongoDBAdapter = require('moleculer-db-adapter-mongo');

module.exports = {
  createLivenessChecker
};

/**
 * Creates a Healthcheck checker for Mongo liveness
 * This must be passed as a parameter to the HealthMiddleware liveness.createChecker
 * @param {Object} broker to check liveness
 */
function createLivenessChecker(broker) {
  return (next) => {
    const servicesWithAdapter = broker.services.filter(hasMongoAdapter);
    if (servicesWithAdapter.length === 0) {
      next();
    } else {
      let error;
      servicesWithAdapter.forEach((service) => {
        try {
          assert(adapterIsConnected(service.adapter), 'Moleculer database adapter not connected');
        } catch (e) {
          error = e.message;
          broker.getLogger('healthcheck').error(error);
        }
        next(error);
      });
    }
  }
};

function hasMongoAdapter(moleculerService) {
  const adapter = moleculerService.adapter;
  return adapter && adapter instanceof MongoDBAdapter;
};

function adapterIsConnected(adapter) {
  const db = adapter.client.db();
  return db.topology.isConnected();
};