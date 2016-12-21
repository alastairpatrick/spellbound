const objectPrototype = Object.prototype;

const hasEnumerable = (obj, n) => {
  for (let i in objectPrototype) {
    if (objectPrototype)  // eslint
      throw new Error(`Object prototype has an enumerable property '${i}'.`);
  }
  return n in obj;
}

export {
  hasEnumerable
}
