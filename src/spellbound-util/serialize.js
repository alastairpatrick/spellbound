import { unwrap, isObservable } from '../spellbound-core';


const RE_PRAGMA = /^\$/;

const getPrototypeOf = Object.getPrototypeOf;
const has = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;
const objectPrototype = Object.prototype;

class Namespace {
  constructor(classes) {
    this.classesByName = {};
    this.namesByClass = new Map();
    if (classes)
      this.add(classes);
  }

  add(classes) {
    if (typeof classes !== "object")
      throw new Error("Argument should be a map from class names to classes.");

    for (let name in classes) {
      if (has.call(classes, name)) {
        let cl = classes[name];

        if (has.call(this.classesByName, name))
          throw new Error(`Class name '${name}' already registered.`);

        if (this.namesByClass.has(cl))
          throw new Error(`Class named '${name}' already registered as ${this.namesByClass.get(cl)}.`);

        this.classesByName[name] = cl;
        this.namesByClass.set(cl, name);
      }
    }
  }

  getClassByName(className) {
    if (!has.call(this.classesByName, className))
      throw new Error(`Unknown class name '${className}'.`);
    return this.classesByName[className];
  }

  getNameByPrototype(prototype) {
    let constructor = prototype.constructor;
    let className = this.namesByClass.get(constructor);
    if (className)
      return className;
    else if (prototype !== objectPrototype)
      throw new Error(`Cannot serialize unregistered class ${constructor.name}`);
    return false;
  }
}

const EMPTY_NAMESPACE = new Namespace({});

const defaultFilter = (value, property, object) => {
  if (getPrototypeOf(object) === objectPrototype)
    return true;

  if (!has.call(object, property))
    throw new Error(`Unknown property ${property}.`);
  
  return true;
}

const serialize = (v, opts = {}) => {
  let u = unwrap(v);
  if (!u || typeof u !== "object")
    return u;

  let options = Object.assign({
    serialize: true,
    filter: defaultFilter,
    namespace: EMPTY_NAMESPACE,
  }, opts);

  let serialize = options.serialize;
  let filter = options.filter;
  let namespace = options.namespace;

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
      let prototype = getPrototypeOf(u);
      let className = namespace.getNameByPrototype(prototype);
      if (className)
        serialized.$n = className;

      for (let key in u) {
        let propValue = u[key];
        if (filter(propValue, key, u))
          serialized[key] = output(propValue);
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
          let cl = namespace.getClassByName(serialized.$n);
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

        let target = entry.value;
        let oldValue = target[property];
        if (!filter(oldValue, property, target))
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

        let oldValue = target[property];
        if (!filter(oldValue, property, target))
          continue;

        let propValue = output(serialized[property]);
        if (isObservable(oldValue)) {
          oldValue.$ = propValue;
        } else {
          target[property] = propValue;
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
