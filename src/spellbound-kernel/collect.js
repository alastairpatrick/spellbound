const { didObserve, setDidObserve } = require('./observe');

const collectObservations = (monitored, callback, options = {}) => {
  let observed = new Set();
  let oldDidObserve = setDidObserve(Set.prototype.add.bind(observed));
  try {
    return monitored();
  } finally {
    setDidObserve(oldDidObserve);
    try {
      observed.forEach(v => callback(v));
    } catch (e) {
      // Ignore exception.
    }
    if (!options.capture) 
      observed.forEach(v => didObserve(v));
  }
}

module.exports = {
  collectObservations,
}
