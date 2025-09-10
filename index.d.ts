declare namespace _default {
    export { createLivenessChecker };
}
export default _default;
/**
 * Creates a Healthcheck checker for Mongo liveness
 * This must be passed as a parameter to the HealthMiddleware liveness.createChecker
 * @param {Object} broker to check liveness
 */
declare function createLivenessChecker(broker: any): (callback: any) => void;
