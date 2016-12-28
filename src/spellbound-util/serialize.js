import { isObservable, computed, mutate, observable, unwrap } from '../spellbound-core';


const RE_VALID_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const RE_MUST_ESCAPE = /^\$/;
const RE_ESCAPED = /^\$\$/;
const RE_PRAGMA = /^\$[^$]/;

const getPrototypeOf = Object.getPrototypeOf;
const has = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;
const objectPrototype = Object.prototype;

const identity = v => v;

class External {
  constructor(value) {
    this.value = value;
  }

  newObject() {
    return new (this.value)();
  }

  serializeObject(object, output, options) {
    let filter = options.filter;
    for (let property in object) {
      let propValue = object[property];
      if (filter(propValue, property, object))
        output(property, propValue);
    }
  }

  deserializeObject(target, serialized, output) {
    for (let property in serialized) {
      if (has.call(serialized, property))
        output(property, serialized[property]);
    }
  }
}

class DateExternal extends External {
  constructor() {
    super(Date);
  }

  newObject(serialized) {
    return new Date(Date.parse(serialized.iso));
  }

  serializeObject(object, output) {
    output("iso", object.toISOString());
  }

  deserializeObject() {
    // Do nothing: Date initialized by newObject.
  }
}

class RegExpExternal extends External {
  constructor() {
    super(RegExp);
  }

  newObject(serialized) {
    let flags = "";
    if (has.call(serialized, "flags"))
      flags = serialized.flags;
    let result = new RegExp(serialized.source, flags);
    return result;
  }

  serializeObject(object, output) {
    output("source", object.source);
    if (object.flags.length)
      output("flags", object.flags);
    if (object.lastIndex !== 0)
      output("lastIndex", object.lastIndex);
  }

  deserializeObject(target, serialized) {
    if (has.call(serialized, "lastIndex"))
      target.lastIndex = serialized.lastIndex;
  }
}

const OBJECT_EXTERNAL = new External();

const DEFAULT_EXTERNALS = {
  ".undefined": new External(undefined),
  ".NaN": new External(NaN),
  "+Infinity": new External(Infinity),
  "-Infinity": new External(-Infinity),
  ".Date": new DateExternal(),
  ".RegExp": new RegExpExternal(),
}

class Namespace {
  constructor(locals) {
    this.localsByName = observable({});

    this.externalsByName = computed(() => {
      let result = Object.assign({}, DEFAULT_EXTERNALS);

      let map = new Map();
      map.set(this.localsByName.$, "");

      map.forEach((prefix, localsByName) => {
        for (let name in localsByName) {
          if (!has.call(localsByName, name))
            continue;
          
          let local = localsByName[name];
          if (local instanceof Namespace)
            map.set(local.localsByName.$, prefix + name + '.');
          else
            result[prefix + name] = local;
        }
      });

      return result;
    });

    this.externalsByValue = computed(() => {
      let externals = this.externalsByName.$;
      let result = new Map();
      for (let name in externals) {
        if (has.call(externals, name)) {
          let external = externals[name];
          let value = external.value;
          if (result.has(value))
            throw new Error(`External named '${name}' already registered as '${result.get(value)}'.`);

          result.set(value, {
            name: name,
            external: external,
          });
        }
      }
      return result;
    });

    if (locals)
      this.add(locals);
  }

  add(locals) {
    if (typeof locals !== "object")
      throw new Error("Argument should be a map from names to externals.");

    mutate((localsByName) => {
      for (let name in locals) {
        if (!has.call(locals, name))
          continue;

        if (!RE_VALID_NAME.test(name))
          throw new Error(`Invalid name '${name}'.`);

        let local = locals[name];
        if (has.call(localsByName.$, name))
          throw new Error(`External name '${name}' already registered.`);

        if (!(local instanceof Namespace || local instanceof External))
          local = new External(local);

        localsByName.$[name] = local;
      }
    }, this.localsByName);
  }

  getExternalByName(name) {
    let externalsByName = this.externalsByName.$;
    if (!has.call(externalsByName, name))
      throw new Error(`Unknown external name '${name}'.`);
    return externalsByName[name];
  }

  serializeObject(serialized, object, output, options) {
    let prototype = getPrototypeOf(object);
    let constructor = prototype.constructor;
    let nameExternal = this.externalsByValue.$.get(constructor);
    if (nameExternal !== undefined) {
      serialized.$n = nameExternal.name;
      nameExternal.external.serializeObject(object, output, options);
    } else if (prototype === objectPrototype) {
      OBJECT_EXTERNAL.serializeObject(object, output, options);
    } else {
      throw new Error(`Cannot serialize unregistered constuctor ${constructor.name}`);
    }
  }

  getExternalReference(value) {
    let nameExternal = this.externalsByValue.$.get(value);
    if (nameExternal !== undefined)
      return { $r: nameExternal.name };
    return value;
  }
}

const EMPTY_NAMESPACE = new Namespace();

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
  let filter = options.filter;
  let namespace = options.namespace;
  let transform = options.transform;

  let u = transform(v);

  let external = namespace.getExternalReference(u);
  if (external !== u)
    return external;

  if (!u || typeof u !== "object")
    return u;

  const GRAY = {};
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
      namespace.serializeObject(serialized, u, (property, propValue) => {
        serialized[property.replace(RE_MUST_ESCAPE, "$$$$")] = output(propValue);
      }, options);
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

const deserializeJS = (serialized, opts) => {
  let options = Object.assign({
    filter: defaultFilter,
    namespace: EMPTY_NAMESPACE,
    transform: identity,
  }, opts);

  let filter = options.filter;
  let namespace = options.namespace;
  let transform = options.transform;

  serialized = transform(serialized);
  if (!serialized || typeof serialized !== "object")
    return serialized;
  if (typeof serialized.$r === "string")
    return namespace.getExternalByName(serialized.$r).value;

  const GRAY = {};
  let map = new Map();

  const gray = (serialized) => {
    serialized = transform(serialized);
    if (!serialized || typeof serialized !== "object")
      return;
    if (serialized.$r)
      return;
      
    let addr = serialized.$a || serialized;
    let entry = map.get(addr);
    if (entry === undefined) {
      entry = {
        serialized: serialized,
        external: OBJECT_EXTERNAL,
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
    serialized = transform(serialized);
    if (!serialized || typeof serialized !== "object")
      return serialized;
    if (typeof serialized.$r === "string")
      return namespace.getExternalByName(serialized.$r).value;

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
          entry.external = namespace.getExternalByName(serialized.$n);
          entry.value = entry.external.newObject(serialized, options);
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
      entry.external.deserializeObject(target, serialized, (property, propValue) => {
        if (RE_PRAGMA.test(property))
          return;

        let targetProperty = property.replace(RE_ESCAPED, "$$");
        let oldValue = target[targetProperty];
        if (!filter(oldValue, targetProperty, target))
          return;

        if (isObservable(oldValue)) {
          oldValue.$ = output(propValue);
        } else {
          target[targetProperty] = output(propValue);
        }
      }, options);
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

export {
  Namespace,
  deserialize,
  serialize,
}
