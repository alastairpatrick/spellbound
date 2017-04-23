const { didObserve, willChange } = require('../kernel');

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
