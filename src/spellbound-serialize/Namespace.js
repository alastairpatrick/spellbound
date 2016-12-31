import { computed, mutate, observable } from '../spellbound-core';
import { JSON_DEFAULTS, OBJECT_EXTERNAL, External } from './External';

const OBJECT_NAME_EXTERNAL = {
  name: "",
  external: OBJECT_EXTERNAL,
}

const RE_VALID_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const getPrototypeOf = Object.getPrototypeOf;
const has = Object.prototype.hasOwnProperty;
const objectPrototype = Object.prototype;

class Namespace {
  constructor(locals, defaults = JSON_DEFAULTS) {
    this.localsByName = observable({});

    this.externalsByName = computed(() => {
      let result = Object.assign({}, defaults);

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

  getConstructorExternal(object) {
    let prototype = getPrototypeOf(object);
    let constructor = prototype.constructor;
    let nameExternal = this.externalsByValue.$.get(constructor);
    if (nameExternal !== undefined)
      return nameExternal;

    if (prototype === objectPrototype)
      return OBJECT_NAME_EXTERNAL;
      
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

export {
  EMPTY_NAMESPACE,
  Namespace,
}
