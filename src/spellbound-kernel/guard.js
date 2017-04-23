const { collectObservations } = require('./collect');
const { addChangeListener, removeChangeListener } = require('./change');
const { taskQueue } = require('./task');

const guard = (changed, options = {}) => {
  let mutableChanged = changed;
  let dependencies = new Set();

  let dispose;

  let task = null;
  let invoke = () => {
    dispose();
  
    if (options.sync)
      mutableChanged();
    else
      task = taskQueue.notification.schedule(mutableChanged);
  };

  dispose = () => {
    if (task !== null) {
      task.dispose();
      task = null;
    }

    dependencies.forEach(v => {
      removeChangeListener(v, invoke);
    });
    dependencies.clear();
  };

  let collect = (guarded) => {
    let value = collectObservations(guarded, (v) => {
      dependencies.add(v);
      addChangeListener(v, invoke);
    }, options);

    return { value, hasDependencies: dependencies.size, collect, dispose };
  };

  return {
    collect,
    dispose,
  };
} 

module.exports = {
  guard,
}
