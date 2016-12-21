import { taskQueue } from './task';


const infos = new WeakMap();
let willChangeTodo = null;
let willChangeImpl;

const invokeArg = fn => fn();

const getInfo = (v) => {
  let info = infos.get(v);
  if (!info) {
    info = {
      value: v,
      changeListeners: new Set(),
      wakeListeners: new Set(),
      obscureListeners: new Set(),
    }
    infos.set(v, info);
  }
  return info;
}

const setWillChange = (fn) => {
  let old = willChangeImpl;
  willChangeImpl = fn;
  return old;
}

const addWillChangeTodo = (v) => {
  willChangeTodo.add(v);
}

const defaultWillChange = (v) => {
  let info = getInfo(v);

  if (willChangeTodo) {
    info.changeListeners.forEach(addWillChangeTodo);
  } else {
    willChangeTodo = new Set();
    try {
      info.changeListeners.forEach(addWillChangeTodo);
      willChangeTodo.forEach(invokeArg);
    } finally {
      willChangeTodo = null;
    }
  }
}

willChangeImpl = defaultWillChange;

const willChange = (v, n) => willChangeImpl(v, n);

const obscures = new Set();
let task = null;

const launch = () => {
  if (task !== null)
    return;

  task = taskQueue.finish.schedule(() => {
    task = null;
    obscures.forEach(info => {
      if (info.changeListeners.size !== 0)
        throw new Error(`Object ${info.value} is not obscure because it has ${info.changeListeners.size} change listeners.`);
      info.obscureListeners.forEach(listener => listener(info.value));
      obscures.delete(info);
    });
  });
}

const addChangeListener = (v, listener) => {
  let info = getInfo(v);

  if (info.changeListeners.size === 0) {
    info.wakeListeners.forEach(listener => listener(v, true));
    if (info.obscureListeners.size > 0)
      obscures.delete(info);
  }
  
  info.changeListeners.add(listener);
}

const removeChangeListener = (v, listener) => {
  let info = getInfo(v);
  if (info.changeListeners.delete(listener)) {
    if (info.changeListeners.size === 0) {
      info.wakeListeners.forEach(listener => listener(v, false));
      if (info.obscureListeners.size > 0) {
        obscures.add(info);
        launch();
      }
    }
  }
}

const hasChangeListeners = (v) => {
  let info = getInfo(v);
  return info.changeListeners.size;
}

const addWakeListener = (v, listener) => {
  let info = getInfo(v);
  info.wakeListeners.add(listener);
}

const removeWakeListener = (v, listener) => {
  let info = getInfo(v);
  info.wakeListeners.delete(listener);
}

const addObscureListener = (v, listener) => {
  let info = getInfo(v);

  if (info.obscureListeners.size === 0 && info.changeListeners.size === 0) {
    obscures.add(info);
    launch();
  }
  
  info.obscureListeners.add(listener);
}

const removeObscureListener = (v, listener) => {
  let info = getInfo(v);
  if (info.obscureListeners.delete(listener)) {
    if (info.obscureListeners.size === 0 && info.changeListeners.size === 0)
      obscures.delete(info);
  } 
}


export {
  addChangeListener,
  addObscureListener,
  addWakeListener,
  hasChangeListeners,
  removeChangeListener,
  removeObscureListener,
  removeWakeListener,
  setWillChange,
  willChange,
}
