import { unwrap, isObservable } from '../spellbound-core';


const RE_MUST_ESCAPE = /^\$/;
const RE_ESCAPED = /^\$\$/;
const RE_PRAGMA = /^\$[^$]/;

const getPrototypeOf = Object.getPrototypeOf;
const has = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;
const objectPrototype = Object.prototype;

class Namespace {
  constructor(externals) {
    this.externalsByName = {};
    this.namesByExternal = new Map();
    if (externals)
      this.add(externals);
  }

  add(externals) {
    if (typeof externals !== "object")
      throw new Error("Argument should be a map from names to externals.");

    for (let name in externals) {
      if (has.call(externals, name)) {
        let external = externals[name];

        if (has.call(this.externalsByName, name))
          throw new Error(`External name '${name}' already registered.`);

        if (this.namesByExternal.has(external))
          throw new Error(`External named '${name}' already registered as ${this.namesByExternal.get(external)}.`);

        this.externalsByName[name] = external;
        this.namesByExternal.set(external, name);
      }
    }
  }

  getExternalByName(name) {
    if (!has.call(this.externalsByName, name))
      throw new Error(`Unknown external name '${name}'.`);
    return this.externalsByName[name];
  }

  setConstructorReference(serialized, prototype) {
    let constructor = prototype.constructor;
    let name = this.namesByExternal.get(constructor);
    if (name !== undefined)
      serialized.$n = name;
    else if (prototype !== objectPrototype)
      throw new Error(`Cannot serialize unregistered constuctor ${constructor.name}`);
  }

  getExternalReference(external) {
    let name = this.namesByExternal.get(external);
    if (name !== undefined)
      return { $r: name };
    return external;
  }
}

class EmptyNamespace {
  getExternalByName(name) {
    throw new Error(`Unknown function name '${name}'.`);
  }

  setConstructorReference() {
    // Do nothing
  }

  getExternalReference(external) {
    return external;
  }
}

const EMPTY_NAMESPACE = new EmptyNamespace();

const defaultFilter = (value, property, object) => {
  if (getPrototypeOf(object) === objectPrototype)
    return true;

  if (!has.call(object, property))
    throw new Error(`Unknown property ${property}.`);
  
  return true;
}

const serialize = (v, opts = {}) => {
  let options = Object.assign({
    serialize: true,
    filter: defaultFilter,
    namespace: EMPTY_NAMESPACE,
  }, opts);

  let serialize = options.serialize;
  let filter = options.filter;
  let namespace = options.namespace;

  let u = unwrap(v);

  let external = namespace.getExternalReference(u);
  if (external !== u)
    return external;

  if (!u || typeof u !== "object")
    return u;

  const GRAY = {};
  let map = new Map();
  let addr = 0;

  const gray = (v) => {
    let u = unwrap(v);
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
    let u = unwrap(v);

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
      u.forEach(gray);
    } else {
      entry.serialized = {};
      for (let key in u) {
        let propValue = u[key];
        if (filter(propValue, key, u))
          gray(propValue);
      }
    }
  });
  
  map.forEach((entry, u) => {
    entry.output = true;

    let serialized = entry.serialized;
    if (entry.ref)
      serialized.$a = entry.ref.$r;

    if (isArray(u)) {
      u.forEach(el => {
        serialized.push(output(el));
      });
    } else {
      namespace.setConstructorReference(serialized, getPrototypeOf(u));
      for (let key in u) {
        let propValue = u[key];
        if (filter(propValue, key, u))
          serialized[key.replace(RE_MUST_ESCAPE, "$$$$")] = output(propValue);
      }
    }
  });

  return entry.serialized;
}

const deserialize = (serialized, opts) => {
  if (!serialized || typeof serialized !== "object")
    return serialized;

  let options = Object.assign({
    filter: defaultFilter,
    namespace: EMPTY_NAMESPACE,
  }, opts);

  let filter = options.filter;
  let namespace = options.namespace;

  if (typeof serialized.$r === "string")
    return namespace.getExternalByName(serialized.$r);

  const GRAY = {};
  let map = new Map();

  const gray = (serialized) => {
    if (!serialized || typeof serialized !== "object")
      return;

    if (serialized.$r)
      return;
      
    let addr = serialized.$a || serialized;
    let entry = map.get(addr);
    if (entry === undefined) {
      entry = {
        serialized: serialized,
        value: GRAY,
      };
      map.set(addr, entry);
    }

    return entry;
  }

  let entry = gray(serialized);
  if (options.target)
    entry.value = options.target;

  const output = (serialized) => {
    if (!serialized || typeof serialized !== "object")
      return serialized;

    if (typeof serialized.$r === "string")
      return namespace.getExternalByName(serialized.$r);

    let addr = serialized.$r || serialized.$a || serialized;
    let entry = map.get(addr);
    return entry.value;
  }

  map.forEach(entry => {
    let serialized = entry.serialized;
    if (isArray(serialized)) {
      if (entry.value === GRAY)
        entry.value = [];
      serialized.forEach(gray);
    } else {
      if (entry.value === GRAY) {
        if (has.call(serialized, "$n")) {
          let cl = namespace.getExternalByName(serialized.$n);
          entry.value = new cl();
        } else {
          entry.value = {};
        }
      }

      for (let property in serialized) {
        if (!has.call(serialized, property))
          continue;

        if (RE_PRAGMA.test(property))
          continue;

        gray(serialized[property]);
      }
    }
  });

  map.forEach(entry => {
    let serialized = entry.serialized;
    let target = entry.value;

    if (isArray(serialized)) {
      target.length = 0;
      serialized.forEach((el, i) => {
        target[i] = output(el);
      });
    } else {
      for (let property in serialized) {
        if (!has.call(serialized, property))
          continue;

        if (RE_PRAGMA.test(property))
          continue;

        let targetProperty = property.replace(RE_ESCAPED, "$$");

        let oldValue = target[targetProperty];
        if (!filter(oldValue, targetProperty, target))
          continue;

        let propValue = output(serialized[property]);
        if (isObservable(oldValue)) {
          oldValue.$ = propValue;
        } else {
          target[targetProperty] = propValue;
        }
      }
    }
  });

  return entry.value;
}

export {
  Namespace,
  deserialize,
  serialize,
}
