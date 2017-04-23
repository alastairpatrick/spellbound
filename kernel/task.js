const _ = require('lodash');

let activeTasksQueues = [];

let launched = false;
const launch = () => {
  if (launched)
    return;
  launched = true;

  setImmediate(() => {
    launched = false;
    while (activeTasksQueues.length > 0) {
      let queue = activeTasksQueues[0];
      let [fn] = queue.tasks.entries().next().value; 
      queue.tasks.delete(fn);
      if (queue.tasks.size === 0)
        activeTasksQueues.shift();
      fn();
    }
  });
}

class TaskQueue {
  constructor(priority) {
    this.priority = priority;
    this.tasks = new Map();
  }

  schedule(fn) {
    if (this.tasks.size === 0) {
      launch();
      activeTasksQueues.splice(_.sortedLastIndexBy(activeTasksQueues, this, queue => queue.priority), 0, this);
    }

    let task = this.tasks.get(fn);
    if (task)
      return task;

    task = {
      dispose: () => {
        if (this.tasks.delete(fn) && this.tasks.size === 0) {
          let idx = activeTasksQueues.indexOf(this);
          activeTasksQueues.splice(idx, 1);
        }
      },
      fn: fn,
    };

    this.tasks.set(fn, task);
    return task;
  }
}

const taskQueue = {
  asap: new TaskQueue(0),
  notification: new TaskQueue(100),
  finish: new TaskQueue(200),
};

module.exports = {
  TaskQueue,
  taskQueue,
}
