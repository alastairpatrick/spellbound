import { Decorator, Uno } from '../spellbound-decorate';
import { didObserve, willChange, newSymbol } from '../spellbound-kernel';

const has = Object.prototype.hasOwnProperty;
const VALUE_SYMBOL = newSymbol("value");


class Observable extends Uno {
  constructor(v) {
    super();
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

unwrap.deep = (v) => {
  let u = unwrap(v);
  if (!u || typeof u !== "object")
    return u;

  const GRAY = {};
  let map = new Map();

  const gray = (v) => {
    let u = unwrap(v);
    if (!u || typeof u !== "object")
      return;

    if (!map.has(u))
      map.set(u, GRAY);
  };

  const mappedFor = (v) => {
    let u = unwrap(v);
    if (!u || typeof u !== "object")
      return u;

    return map.get(u);
  }

  gray(u);

  const isArray = Array.isArray;
  const toString = Object.prototype.toString;
  const isObject = (u) => toString.call(u) === "[object Object]";

  map.forEach((_, u) => {
    let mapped;
    if (isArray(u)) {
      mapped = [];
      u.forEach(gray);
    } else if (isObject(u)) {
      mapped = {};
      for (let key in u) {
        if (Object.prototype.hasOwnProperty.call(u, key))
          gray(u[key]);
      }
    } else {
      mapped = u;
    }

    map.set(u, mapped);
  });

  map.forEach((mapped, u) => {
    if (isArray(u)) {
      u.forEach(el => {
        mapped.push(mappedFor(el));
      });
    } else if (isObject(u)) {
      for (let key in u) {
        if (Object.prototype.hasOwnProperty.call(u, key))
          mapped[key] = mappedFor(u[key]);
      }
    }
  });

  return map.get(u);
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

const initObservableObject = function() {
  return Observable.call(this, Object.create(null));
}

Observable.Properties = ((superClass, descs) => {
  let derived = superClass;
  while (derived) {
    let parent = Object.getPrototypeOf(derived);
    if (parent === initObservableObject)
      break;
    
    if (parent === Observable) {
      Object.setPrototypeOf(derived, initObservableObject);
      break;
    }
    
    derived = parent;
  }
    
  let subDescs = {};
  for (let name in descs) {
    if (has.call(descs, name)) {
      subDescs[name] = Object.assign({
        get: function() {
          let v = this[VALUE_SYMBOL][name];
          didObserve(this, name);
          return v;
        },
        set: function(v) {
          if (v === this[VALUE_SYMBOL][name])
            return;
          willChange(this, name);
          this[VALUE_SYMBOL][name] = v;
        },
        enumerable: false,
        configurable: true,
      }, descs[name]);
    }
  }
  
  let subClass = function() {
    superClass.apply(this, arguments);
  };

  Object.setPrototypeOf(subClass, superClass);

  subClass.prototype = Object.create(superClass.prototype, Object.assign({
    constuctor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  }, subDescs));

  return subClass;
})
[Decorator]

export {
  Observable,
  VALUE_SYMBOL,
  isObservable,
  isWritableObservable,
  mutate,
  observable,
  unwrap,
}
