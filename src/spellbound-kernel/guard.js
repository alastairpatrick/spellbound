import { collectObservations } from './collect';
import { addChangeListener, removeChangeListener } from './change';
import { taskQueue } from './task';

const guard = (guarded, changed, options = {}) => {
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

  let value = collectObservations(guarded, (v) => {
    dependencies.add(v);
    addChangeListener(v, invoke);
  }, options);

  return {
    value,
    dispose,
    hasDependencies: dependencies.size,
  };
} 

export {
  guard,
}
