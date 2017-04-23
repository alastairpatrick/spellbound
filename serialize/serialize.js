const { unwrap } = require('../core');
const { GRAY } = require('./External');
const { EMPTY_NAMESPACE } = require('./Namespace');


const getPrototypeOf = Object.getPrototypeOf;
const has = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;
const objectPrototype = Object.prototype;

const defaultFilter = (value, property, object) => {
  if (getPrototypeOf(object) === objectPrototype)
    return true;

  if (!has.call(object, property))
    throw new Error(`Unknown property ${property}.`);
  
  return true;
}

const serializeJS = (v, opts = {}) => {
  let options = Object.assign({
    serialize: true,
    filter: defaultFilter,
    namespace: EMPTY_NAMESPACE,
    transform: unwrap,
  }, opts);

  let serialize = options.serialize;
  let namespace = options.namespace;
  let transform = options.transform;

  let u = transform(v);

  let external = namespace.getExternalReference(u);
  if (external !== u)
    return external;

  if (!u || typeof u !== "object")
    return u;

  let map = new Map();
  let addr = 0;

  const gray = (v) => {
    let u = transform(v);
    if (!u || typeof u !== "object")
      return;

    let entry = map.get(u);
    if (entry === undefined) {
      entry = {
        serialized: GRAY,
        ref: null,
        output: false,
      };
      map.set(u, entry);
    } else if (serialize && !entry.ref) {
      entry.ref = { $r: ++addr };
    }

    return entry;
  };

  const output = (v) => {
    let u = transform(v);

    let external = namespace.getExternalReference(u);
    if (external !== u)
      return external;

    if (!u || typeof u !== "object")
      return u;

    let entry = map.get(u);
    if (entry.output && entry.ref)
      return entry.ref;

    entry.output = true;
    return entry.serialized;
  }

  let entry = gray(u);

  map.forEach((entry, u) => {
    if (isArray(u)) {
      entry.serialized = [];
      let count = 0;
      u.forEach(value => {
        gray(value);
        ++count;
      });
      if (count === u.length)
        entry.serialized = [];
      else
        entry.serialized = { $n: ".SparseArray" };
    } else {
      let nameExternal = namespace.getConstructorExternal(u);
      let external = nameExternal.external;
      entry.serialized = external.newSerialized(u, nameExternal.name);
      external.serializeObject(u, gray, options);
    }
  });
  
  map.forEach((entry, u) => {
    entry.output = true;

    let serialized = entry.serialized;
    if (entry.ref)
      serialized.$a = entry.ref.$r;

    if (isArray(u) && isArray(serialized)) {
      u.forEach(el => {
        serialized.push(output(el));
      });
    } else {
      let nameExternal = namespace.getConstructorExternal(u);
      Object.assign(serialized, nameExternal.external.serializeObject(u, output, options));
    }
  });

  return entry.serialized;
}

const serialize = (u, opts = {}) => {
  let js = serializeJS(u, opts);
  let format = opts.format || "js";
  if (format === "js")
    return js;  
  if (format === "json")
    return JSON.stringify(js);
  throw new Error(`Unknown format '${format}'.`);
}

module.exports = {
  defaultFilter,
  serialize,
}
