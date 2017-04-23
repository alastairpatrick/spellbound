const { didObserve, willChange, newSymbol } = require('../kernel');


const VALUE_SYMBOL = newSymbol("value");

class Observable {
  constructor(v) {
    this[VALUE_SYMBOL] = v;
  }

  get peek() {
    return this[VALUE_SYMBOL];
  }

  get $() {
    let v = this[VALUE_SYMBOL];
    didObserve(this);
    return v;
  }

  set $(v) {
    if (this.isEqual(v, this[VALUE_SYMBOL]))
      return;
    willChange(this);
    this[VALUE_SYMBOL] = v;
  }

  get hasDependencies() {
    return Infinity;
  }
  
  valueOf() {
    return this.$;
  }

  toString() {
    return String(this.$);
  }

  isEqual(a, b) {
    if (b !== null && typeof b === "object")
      return false;
    return a === b;
  }

  get writable() {
    return true;
  }
}

const observable = (v) => new Observable(v);

const isObservable = (v) => {
  return v instanceof Observable;
}

const isWritableObservable = (v) => {
  return v instanceof Observable && v.writable;
}

const unwrap = (v) => {
  let u = v;
  while (u instanceof Observable)
    u = u.$;
  return u;
}

unwrap.within = (within, ...vs) => {
  let args = vs.map(v => {
    return unwrap(v);
  });

  return within(...args);
}

const mutate = (mutator, ...vs) => {
  let args = vs.map(v => {
    return { $: unwrap(v) };
  });

  try {
    return mutator(...args);
  } finally {
    vs.forEach((v, i) => {
      if (v instanceof Observable)
        v.$ = args[i].$;
    });
  }
}


module.exports = {
  Observable,
  VALUE_SYMBOL,
  isObservable,
  isWritableObservable,
  mutate,
  observable,
  unwrap,
}
