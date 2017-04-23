const {
  addChangeListener,
  addObscureListener,
  addWakeListener,
  hasChangeListeners,
  removeChangeListener,
  removeObscureListener,
  removeWakeListener,
  setWillChange,
  willChange,
} = require('./change');

const { TaskQueue, taskQueue } = require('./task');
const { didObserve, setDidObserve, assertNotInterceptingObservations } = require('./observe');
const { collectObservations } = require('./collect');
const { guard } = require('./guard');
const { newSymbol } = require('./symbol');
const { hasEnumerable } = require('./has');

module.exports = {
  TaskQueue,
  addChangeListener,
  addObscureListener,
  addWakeListener,
  assertNotInterceptingObservations,
  didObserve,
  guard,
  hasEnumerable,
  hasChangeListeners,
  collectObservations,
  newSymbol,
  removeChangeListener,
  removeObscureListener,
  removeWakeListener,
  setDidObserve,
  setWillChange,
  taskQueue,
  willChange,
}
