// Unlike those that unherit from Object.prototype, objects that inherit
// from the Uno.prototype are never used as maps or dictionaries where
// there is possibility of a dictionary key overlapping a property
// in the prototype chain.
//
// Object.prototype _is not_ a prototype of Uno.prototype. However,
// particular methods of Object.prototype are copied to Uno.prototype.
// This means that changes mde to Object.prototype are not visible in
// Uno.prototype.
//
// Common ways of identifying an object in JavaScript are
// indistinguishable from Uno versus Object. In particular, typeof
// yields "object" and Object.prototype.toString yields the same as
// Object, e.g. "[object Object]".
//
// Uno is intended to be use as the root of a prototype chain for
// "classes" that are not used as dictionaries or maps, i.e. where
// property names are carefully selected so they do not interfere with
// each other or overlap  well known properties such as hasOwnProperty.
//
// For-in loops over Uno instances should not use a hasOwnProperty guard
// if the intent is to include enumerable properties present in the
// prototype chain. The non-enumerable properties of Uno.prototype will
// be excluded.
//
// Properties added to objects should be non-enumerable unless they are
// intended to be enumerated.
//
// For tests seeking to establish whether an instance has a particular
// property, consider propertyIsEnumerable over hasOwnProperty, where
// consistency with the properties that would be enumerated by an
// unguarded for-in loop is desirable.
//
// Since Uno objects are not used as maps or dictionaries, there is no
// reason to access methods directly through the prototype chain. This
// is a safe way to iterate over the owned property of an Uno object:
//
// for (let n in myUnoObject) {
//   if (myUnoObject.hasOwnProperty(n))
//     soSomethingWith(n);
// }
//
// This is equivalent and also acceptable:
//
// for (let n in myUnoObject) {
//   if (Object.prototype.hasOwnProperty.call(myUnoObject, n))
//     soSomethingWith(n);
// }
//
// This iterates over all the enumerable properties, including those
// that are inherited:
//
// for (let n in myUnoObject) {
//   soSomethingWith(n);
// }
//
// Uno stands for "Uno is Not Object".

class Uno {
}

const descs = {};
[
  "hasOwnProperty",
  "isPrototypeOf",
  "propertyIsEnumerable",
  "toLocaleString",
  "toString",
  "valueOf",
].forEach(name => {
  descs[name] = {
    value: Object.prototype[name],
    writable: true,
    enumerable: false,
    configurable: true,
  };
});

descs.constructor = {
  value: Uno,
  writable: true,
  enumerable: false,
  configurable: true,
};

Uno.prototype = Object.create(null, descs);

export {
  Uno,
}
