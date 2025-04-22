const { validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'boom-stats',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

