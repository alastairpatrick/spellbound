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

const GRAY = { GRAY: true };

const ResolveError = function (message) {
  this.name = 'ResolveError';
  this.message = message || 'Error resolving reference';
  this.stack = (new Error()).stack;
}
ResolveError.prototype = Object.create(Error.prototype);
ResolveError.prototype.constructor = ResolveError;

class External {
  constructor(value) {
    this.value = value;
  }

  newObject() {
    return new (this.value)();
  }

  serializeObject(object, output, options) {
    let result = {};
    let filter = options.filter;
    for (let property in object) {
      let propValue = object[property];
      if (filter(propValue, property, object))
        result[property.replace(RE_MUST_ESCAPE, "$$$$")] = output(propValue);
    }
    return result;
  }

  deserializeObject(target, serialized, output) {
    let result = {};
    for (let property in serialized) {
      if (!has.call(serialized, property))
        continue;

      if (RE_PRAGMA.test(property))
        continue;

      let targetProperty = property.replace(RE_ESCAPED, "$$");
      result[targetProperty] = output(serialized[property]);
    }

    return result;
  }
}

class ArrayBufferExternal extends External {
  constructor() {
    super(ArrayBuffer);
  }

  newObject(serialized) {
    return new ArrayBuffer(serialized.byteLength);
  }

  serializeObject(object) {
    let view = new Uint8Array(object);
    let dataStr = view.reduce((prev, curr) => prev + String.fromCharCode(curr), "")
    return {
      data: dataStr,
      byteLength: object.byteLength,
    };
  }

  deserializeObject(target, serialized) {
    if (!target)
      return;

    let view = new Uint8Array(target);
    let data = serialized.data;
    for (let i = 0; i < data.length; ++i)
      view[i] = data.charCodeAt(i);
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
    return {
      iso: output(object.toISOString()),
    };
  }

  deserializeObject() {
    // Do nothing: Date initialized by newObject.
  }
}

class MapExternal extends External {
  constructor() {
    super(Map);
  }

  serializeObject(object, output) {
    let values = [];
    object.forEach((value, key) => {
      values.push(output(key), output(value));
    });
    return { values };
  }

  deserializeObject(target, serialized, output) {
    let values = serialized.values;
    for (let i = 0; i < values.length; i += 2) {
      let key = output(values[i]);
      let value = output(values[i + 1]);
      if (target)
        target.set(key, value);
    }
  }
}

class PrimitiveExternal extends External {
  newObject(serialized) {
    return new (this.value)(serialized.value);
  }

  serializeObject(object, output) {
    return {
      value: output(object.valueOf()),
    };
  }

  deserializeObject() {
    // Do nothing: initialized by newObject.
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
    if (has.call(serialized, "lastIndex"))
      result.lastIndex = serialized.lastIndex;
    return result;
  }

  serializeObject(object, output) {
    let result = {
      source: output(object.source),
    };

    if (object.flags.length)
      result.flags = output(object.flags);
    if (object.lastIndex !== 0)
      result.lastIndex = object.lastIndex;
    
    return result;
  }

  deserializeObject() {
    // Do nothing: initialized by newObject.
  }
}

class SetExternal extends External {
  constructor() {
    super(Set);
  }

  serializeObject(object, output) {
    let values = [];
    object.forEach(value => {
      values.push(output(value));
    });
    return { values };
  }

  deserializeObject(target, serialized, output) {
    let values = serialized.values;
    for (let i = 0; i < values.length; ++i) {
      let value = output(values[i]);
      if (target)
        target.add(value);
    }
  }
}

class SparseArrayExternal extends External {
  constructor() {
    super(Array);
  }

  newObject(serialized) {
    return new Array(serialized.length);
  }

  serializeObject(object, output) {
    let values = [];
    object.forEach((el, i) => {
      values.push(i, output(el));
    });
    return {
      values,
      length: object.length,
    };
  }

  deserializeObject(target, serialized, output) {
    let values = serialized.values;
    for (let i = 0; i < values.length; ++i) {
      let key = values[i];
      let value = output(values[i + 1]);
      if (target)
        target[key] = value;
    }
  }
}

class TypedArrayExternal extends External {
  newObject(serialized, output) {
    let buffer = output(serialized.buffer);
    if (buffer === GRAY)
      return GRAY;
    return new (this.value)(buffer, serialized.byteOffset, serialized.length);
  }

  serializeObject(object, output) {
    return {
      buffer: output(object.buffer),
      byteOffset: object.byteOffset,
      length: object.length,
    };
  }

  deserializeObject() {
    // Do nothing: initialized by newObject.
  }
}

const OBJECT_EXTERNAL = new External();

const DEFAULT_EXTERNALS = {
  ".undefined": new External(undefined),
  ".NaN": new External(NaN),
  "+Infinity": new External(Infinity),
  "-Infinity": new External(-Infinity),
  ".ArrayBuffer": new ArrayBufferExternal(),
  ".Boolean": new PrimitiveExternal(Boolean),
  ".Date": new DateExternal(),
  ".Map": new MapExternal(),
  ".Number": new PrimitiveExternal(Number),
  ".RegExp": new RegExpExternal(),
  ".Set": new SetExternal(),
  ".SparseArray": new SparseArrayExternal(),
  ".Uint8Array": new TypedArrayExternal(Uint8Array),
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

  serializeObject(object, output, options) {
    let prototype = getPrototypeOf(object);
    let constructor = prototype.constructor;
    let nameExternal = this.externalsByValue.$.get(constructor);
    if (nameExternal !== undefined) {
      let result = nameExternal.external.serializeObject(object, output, options);
      result.$n = nameExternal.name;
      return result;
    }
    
    if (prototype === objectPrototype) {
      return OBJECT_EXTERNAL.serializeObject(object, output, options);
    }

    throw new Error(`Cannot serialize unregistered constuctor ${constructor.name}`);
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
        entry.serialized = [];  // for dense array
      else
        entry.serialized = {};  // for sparse array
    } else {
      entry.serialized = {};
      namespace.serializeObject(u, gray, options);
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
      Object.assign(serialized, namespace.serializeObject(u, output, options));
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
    } else {
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
    } else {
      let result = entry.external.deserializeObject(target, serialized, output, options);
      for (let property in result) {
        if (!has.call(result, property))
          continue;

        let oldValue = target[property];
        if (!filter(oldValue, property, target))
          continue;

        if (isObservable(oldValue)) {
          oldValue.$ = result[property];
        } else {
          target[property] = result[property];
        }        
      }
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
