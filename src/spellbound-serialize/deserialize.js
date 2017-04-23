const { GRAY, OBJECT_EXTERNAL } = require('./External');
const { EMPTY_NAMESPACE } = require('./Namespace');
const { defaultFilter } = require('./serialize');

const getPrototypeOf = Object.getPrototypeOf;
const has = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;
const objectPrototype = Object.prototype;


const identity = v => v;

const ResolveError = function (message) {
  this.name = 'ResolveError';
  this.message = message || 'Error resolving reference';
  this.stack = (new Error()).stack;
}
ResolveError.prototype = Object.create(Error.prototype);
ResolveError.prototype.constructor = ResolveError;

const deserializeJS = (serialized, opts) => {
  let options = Object.assign({
    filter: defaultFilter,
    namespace: EMPTY_NAMESPACE,
    transform: identity,
  }, opts);

  let namespace = options.namespace;
  let transform = options.transform;

  serialized = transform(serialized);
  if (!serialized || typeof serialized !== "object")
    return serialized;
  if (typeof serialized.$r === "string")
    return namespace.getExternalByName(serialized.$r).value;

  let map = new Map();

  const queue = (serialized) => {
    let addr = serialized.$a || serialized;
    let entry = map.get(addr);
    if (entry === undefined) {
      entry = {
        serialized: serialized,
        addr: addr,
        external: OBJECT_EXTERNAL,
        value: GRAY,
      };
      map.set(addr, entry);
    }
    return entry;
  }

  const gray = (serialized) => {
    serialized = transform(serialized);
    if (!serialized || typeof serialized !== "object")
      return;
    if (serialized.$r)
      return;
      
    queue(serialized);
    return GRAY;
  }

  let entry = queue(serialized);
  if (options.target)
    entry.value = options.target;

  const output = (serialized) => {
    serialized = transform(serialized);
    if (!serialized || typeof serialized !== "object")
      return serialized;
    if (typeof serialized.$r === "string")
      return namespace.getExternalByName(serialized.$r).value;

    let addr = serialized.$r || serialized.$a || serialized;
    let entry = map.get(addr);
    if (entry === undefined || entry.value === GRAY)
      throw new ResolveError(`Cannot resolve ${serialized}.`);

    return entry.value;
  }

  let deferred = [];
  map.forEach(entry => {
    let serialized = entry.serialized;
    if (isArray(serialized)) {
      if (entry.value === GRAY)
        entry.value = [];
      serialized.forEach(gray);
    } else if (getPrototypeOf(serialized) === objectPrototype) {
      if (entry.value === GRAY) {
        if (has.call(serialized, "$n")) {
          entry.external = namespace.getExternalByName(serialized.$n);
          entry.external.newObject(entry.serialized, gray, options);
          deferred.push(entry);
        } else {
          entry.value = {};
        }
      }

      entry.external.deserializeObject(null, serialized, gray, options);
    } else {
      entry.value = serialized;
    }
  });

  const createDeferred = entry => {
    if (entry.value === GRAY) {
      try {
        entry.value = entry.external.newObject(entry.serialized, output, options);
        if (entry.value === GRAY)
          deferred.push(entry);
      } catch (e) {
        if (e instanceof ResolveError)
          deferred.push(entry);
        else
          throw e;
      }
    }
  }

  // Reversing first is unnecessary but it generally results in fewer iterations
  // of the following loop.
  deferred.reverse();
  while (deferred.length) {
    let todo = deferred;
    deferred = [];
    todo.forEach(createDeferred);
    if (deferred.length >= todo.length)
      throw new Error(`Cannot instantiate ${deferred.length} objects.`);
  }

  map.forEach(entry => {
    let serialized = entry.serialized;
    let target = entry.value;

    if (isArray(serialized)) {
      target.length = 0;
      serialized.forEach((el, i) => {
        target[i] = output(el);
      });
    } else if (getPrototypeOf(serialized) === objectPrototype) {
      entry.external.deserializeObject(target, serialized, output, options);
    }
  });

  return entry.value;
}

const deserialize = (serialized, opts = {}) => {
  let format = opts.format || "js";
  let js;
  if (format === "js")
    js = serialized;
  else if (format === "json")
    js = JSON.parse(serialized);
  else
    throw new Error(`Unknown format '${format}'.`);
  return deserializeJS(js, opts);
}

module.exports = {
  deserialize,
}
