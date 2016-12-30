import { isObservable } from '../spellbound-core';

const RE_MUST_ESCAPE = /^\$/;
const RE_ESCAPED = /^\$\$/;
const RE_PRAGMA = /^\$[^$]/;

const has = Object.prototype.hasOwnProperty;

const GRAY = { GRAY: true };

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

  deserializeObject(target, serialized, output, options) {
    let filter = options.filter;
    for (let property in serialized) {
      if (!has.call(serialized, property))
        continue;

      if (RE_PRAGMA.test(property))
        continue;

      let propValue = output(serialized[property]);

      if (target) {
        let targetProperty = property.replace(RE_ESCAPED, "$$");
        if (!filter(target[targetProperty], targetProperty, target))
          continue;

        let oldValue = target[targetProperty];
        if (isObservable(oldValue)) {
          oldValue.$ = propValue;
        } else {
          target[targetProperty] = propValue;
        }        
      }
    }
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

class DataViewExternal extends External {
  constructor() {
    super(DataView);
  }

  newObject(serialized, output) {
    let buffer = output(serialized.buffer);
    if (buffer === GRAY)
      return GRAY;
    return new DataView(buffer, serialized.byteOffset, serialized.byteLength);
  }

  serializeObject(object, output) {
    return {
      buffer: output(object.buffer),
      byteOffset: object.byteOffset,
      byteLength: object.byteLength,
    };
  }

  deserializeObject() {
    // Do nothing: initialized by newObject.
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
    // Do nothing: initialized by newObject.
  }
}

class ErrorExternal extends External {
  serializeObject(object, output) {
    return {
      message: output(object.message),
    }
  }

  deserializeObject(target, serialized, output) {
    let message = output(serialized.message);
    if (target)
      target.message = message;
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

const NO_FILTER_OPTIONS = {
  filter: () => true,
}

class ObjectExternal extends External {
  serializeObject(object, output) {
    return super.serializeObject(object, output, NO_FILTER_OPTIONS);
  }

  deserializeObject(target, serialized, output) {
    return super.deserializeObject(target, serialized, output, NO_FILTER_OPTIONS)
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

const OBJECT_EXTERNAL = new ObjectExternal(Object);

const DEFAULT_EXTERNALS = {
  ".undefined": new External(undefined),
  ".NaN": new External(NaN),
  "+Infinity": new External(Infinity),
  "-Infinity": new External(-Infinity),
  ".ArrayBuffer": new ArrayBufferExternal(),
  ".Boolean": new PrimitiveExternal(Boolean),
  ".DataView": new DataViewExternal(),
  ".Date": new DateExternal(),
  ".Error": new ErrorExternal(Error),
  ".EvalError": new ErrorExternal(EvalError),
  ".Float32Array": new TypedArrayExternal(Float32Array),
  ".Float64Array": new TypedArrayExternal(Float64Array),
  ".Int8Array": new TypedArrayExternal(Int8Array),
  ".Int16Array": new TypedArrayExternal(Int16Array),
  ".Int32Array": new TypedArrayExternal(Int32Array),
  ".Map": new MapExternal(),
  ".Number": new PrimitiveExternal(Number),
  ".Object": OBJECT_EXTERNAL,
  ".RangeError": new ErrorExternal(RangeError),
  ".ReferenceError": new ErrorExternal(ReferenceError),
  ".RegExp": new RegExpExternal(),
  ".Set": new SetExternal(),
  ".SparseArray": new SparseArrayExternal(),
  ".SyntaxError": new ErrorExternal(SyntaxError),
  ".TypeError": new ErrorExternal(TypeError),
  ".URIError": new ErrorExternal(URIError),
  ".Uint8Array": new TypedArrayExternal(Uint8Array),
  ".Uint8ClampedArray": new TypedArrayExternal(Uint8ClampedArray),
  ".Uint16Array": new TypedArrayExternal(Uint16Array),
  ".Uint32Array": new TypedArrayExternal(Uint32Array),
}

export {
  External,
  DEFAULT_EXTERNALS,
  GRAY,
  OBJECT_EXTERNAL,
}
