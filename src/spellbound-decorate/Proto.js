import { Decorator } from './Decorator';

const has = Object.prototype.hasOwnProperty;

const Desc = ((target, descs) => {
  let prototype = target.prototype;
  for (let name in descs) {
    if (has.call(descs, name)) {
      let targetDesc = Object.getOwnPropertyDescriptor(prototype, name);
      if (!targetDesc)
        throw new Error(`Prototype has no property '${name}'`);
      Object.assign(targetDesc, descs[name]);
      Object.defineProperty(prototype, name, targetDesc);
    }
  }
  return target;
})
[Decorator()]

const Freeze = (target => {
  Object.freeze(target.prototype);
  return target;
})
[Decorator()]

const PreventExtensions = (target => {
  Object.preventExtensions(target.prototype);
  return target;
})
[Decorator()]

const Seal = (target => {
  Object.seal(target.prototype);
  return target;
})
[Decorator()]

const Proto = {
  Desc,
  Freeze,
  PreventExtensions,
  Seal,
}

export {
  Proto,
}