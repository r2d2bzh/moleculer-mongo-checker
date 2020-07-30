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
    let error;
    const servicesWithAdapter = broker.services.filter((service) => hasMongoAdapter(service));
    if (servicesWithAdapter.length > 0) {
      servicesWithAdapter.forEach((service) => {
        try {
          assert(adapterIsConnected(service.adapter));
        } catch (e) {
          error = e;
          broker.getLogger('healthcheck').error(error);
        }
        next(error);
      })
    } else {
      next('No services with adapters');
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