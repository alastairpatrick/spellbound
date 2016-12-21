const functionPrototype = Function.prototype;

let symbolCount = 0;
let newSymbol;
if (typeof Symbol === "function") {
  newSymbol = Symbol;
} else {
  newSymbol = (name) => {
    ++symbolCount;
    return "__spellbound_decorate_private_" + symbolCount + "_" + name;
  }
}

const DECORATOR_SYMBOL = newSymbol("decorator");

const noop = () => undefined;

let immediateId;
const launch = () => {
  if (immediateId !== undefined)
    return;
  
  immediateId = setImmediate(() => {
    immediateId = undefined;
    Object.defineProperty(functionPrototype, DECORATOR_SYMBOL, {
      get: noop,
      enumerable: false,
      configurable: true,
    });
  });
}

const prepare = (fn) => {
  fn.toString = () => {
    launch();
    Object.defineProperty(functionPrototype, DECORATOR_SYMBOL, {
      get: function() {
        return fn(this);
      },
      enumerable: false,
      configurable: true,
    });
    return DECORATOR_SYMBOL;
  }

  return fn;
}

const prepareNoArgs = (fn) => {
  fn.toString = () => {
    launch();
    Object.defineProperty(functionPrototype, DECORATOR_SYMBOL, {
      get: function() {
        return fn()(this);
      },
      enumerable: false,
      configurable: true,
    });
    return DECORATOR_SYMBOL;
  }

  return fn;
}

const Decorator = prepareNoArgs(() => prepare(decorator => prepareNoArgs((...args) => prepare(target => decorator(target, ...args)))));

export {
  Decorator,
}
