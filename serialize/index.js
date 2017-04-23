const { JSON_DEFAULTS, STRUCTURED_CLONE_DEFAULTS } = require('./External');
const { Namespace } = require('./Namespace');
const { deserialize } = require('./deserialize');
const { serialize } = require('./serialize');

module.exports = {
  STRUCTURED_CLONE_DEFAULTS,
  JSON_DEFAULTS,
  Namespace,
  deserialize,
  serialize,
}
