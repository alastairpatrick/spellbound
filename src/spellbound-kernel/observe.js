const { taskQueue } = require('./task');

const notObserving = () => undefined;
let didObserveFn = notObserving;

const didObserve = (v, n) => didObserveFn(v, n);
let task = null;

const setDidObserve = (fn) => {
  if (didObserveFn === notObserving && task === null) {
    task = taskQueue.asap.schedule(() => {
      task = null;

      if (didObserveFn !== notObserving) {
        // console.warn("Unexpectedly resetting didObserve() to perform no operation. This is not a reliable fix.");
        didObserveFn = notObserving;
      }
    });
  }

  let old = didObserveFn;
  didObserveFn = fn;
  return old;
}

const assertNotInterceptingObservations = (msg = "Unexpectedly intercepting observations") => {
  if (didObserveFn !== notObserving)
    throw new Error(msg);
}

module.exports = {
  assertNotInterceptingObservations,
  didObserve,
  setDidObserve,
}
