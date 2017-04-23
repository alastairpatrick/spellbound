const { didObserve, willChange } = require('../spellbound-kernel');

class Event {
  observe() {
    didObserve(this);
  }

  signal() {
    willChange(this);
  }
}

module.exports = {
  Event
}
