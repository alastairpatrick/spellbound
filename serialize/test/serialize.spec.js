const { expect } = require('chai');

const { Observable, isWritableObservable } = require('../../core');
const { serialize, Namespace, STRUCTURED_CLONE_DEFAULTS } = require('..');


describe("serialize", function() {
  it("serializes number to itself", function() {
    expect(serialize(7)).to.equal(7);
  })

  it("serializes Number object", function() {
    expect(serialize(new Number(7))).to.deep.equal({ $n: ".Number", value: 7 });
  })

  it("serializes Number object to itself for structured cloning", function() {
    let object = new Number(7);
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    expect(serialize(object, { namespace })).to.equal(object);
  })

  it("serializes string to itself", function() {
    expect(serialize("hello")).to.equal("hello");
  })

  it("serializes true to itself", function() {
    expect(serialize(true)).to.equal(true);
  })

  it("serializes false to itself", function() {
    expect(serialize(false)).to.equal(false);
  })

  it("serializes Boolean object", function() {
    expect(serialize(new Boolean(true))).to.deep.equal({ $n: ".Boolean", value: true });
  })

  it("serializes Boolean object to itself for structured cloning", function() {
    let object = new Boolean(true);
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    expect(serialize(object, { namespace })).to.equal(object);
  })

  it("serializes null to itself", function() {
    expect(serialize(null)).to.equal(null);
  })

  it("serializes undefined as reference", function() {
    expect(serialize(undefined)).to.deep.equal({ $r: ".undefined" });
  })

  it("serializes undefined to itself for structured cloning", function() {
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    expect(serialize(undefined, { namespace })).to.equal(undefined);
  })

  it("serializes NaN as reference", function() {
    expect(serialize(NaN)).to.deep.equal({ $r: ".NaN" });
  })

  it("serializes NaN to itself for structured cloning", function() {
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    expect(serialize(NaN, { namespace })).to.be.NaN;
  })

  it("serializes Infinity as reference", function() {
    expect(serialize(Infinity)).to.deep.equal({ $r: "+Infinity" });
  })

  it("serializes Infinity to itself for structured cloning", function() {
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    expect(serialize(Infinity, { namespace })).to.equal(Infinity);
  })

  it("serializes -Infinity as reference", function() {
    expect(serialize(-Infinity)).to.deep.equal({ $r: "-Infinity" });
  })

  it("serializes -Infinity to itself for structured cloning", function() {
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    expect(serialize(-Infinity, { namespace })).to.equal(-Infinity);
  })

  it("serializes function to itself", function() {
    let fn = () => undefined;
    expect(serialize(fn)).to.equal(fn);
  })

  it("serializes observable", function() {
    let observable = new Observable("initial");
    expect(serialize(observable)).to.equal("initial");
  })

  it("serializes doubly wrapped observable", function() {
    let observable = new Observable("initial");
    expect(serialize(new Observable(observable))).to.equal("initial");
  })

  it("serializes Object", function() {
    let observable = new Observable("initial");
    expect(serialize({a: observable})).to.deep.equal({a: "initial"});
  })

  it("serializes Date", function() {
    let str = "Mon, 25 Dec 1995 13:30:00 GMT"
    expect(serialize(new Date(str))).to.deep.equal({
      $n: ".Date",
      iso: "1995-12-25T13:30:00.000Z",
    });
  })

  it("serializes Date as itself for structured cloning", function() {
    let object = new Date("Mon, 25 Dec 1995 13:30:00 GMT")
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    expect(serialize(object, { namespace })).to.equal(object);
  })

  it("serializes RegExp", function() {
    expect(serialize(/abc/)).to.deep.equal({
      $n: ".RegExp",
      source: "abc",
    });
  })

  it("serializes RegExp with flags", function() {
    expect(serialize(/abc/g)).to.deep.equal({
      $n: ".RegExp",
      source: "abc",
      flags: "g",
    });
  })

  it("serializes RegExp with non-zero lastIndex", function() {
    let re = /abc/g;
    re.lastIndex = 1;
    expect(serialize(re)).to.deep.equal({
      $n: ".RegExp",
      source: "abc",
      flags: "g",
      lastIndex: 1,
    });
  })

  it("serializes Errors", function() {
    expect(serialize(new Error("Message"))).to.deep.equal({
      $n: ".Error",
      message: "Message",
    });
    expect(serialize(new EvalError("Message"))).to.deep.equal({
      $n: ".EvalError",
      message: "Message",
    });
    expect(serialize(new RangeError("Message"))).to.deep.equal({
      $n: ".RangeError",
      message: "Message",
    });
    expect(serialize(new ReferenceError("Message"))).to.deep.equal({
      $n: ".ReferenceError",
      message: "Message",
    });
    expect(serialize(new SyntaxError("Message"))).to.deep.equal({
      $n: ".SyntaxError",
      message: "Message",
    });
    expect(serialize(new TypeError("Message"))).to.deep.equal({
      $n: ".TypeError",
      message: "Message",
    });
    expect(serialize(new URIError("Message"))).to.deep.equal({
      $n: ".URIError",
      message: "Message",
    });
  })

  it("serializes dense Array", function() {
    expect(serialize([1, 2, 3])).to.deep.equal([1, 2, 3]);
  })

  it("serializes sparse Array", function() {
    let a = ['a', 'b', 'c', 'd'];
    delete a[1];
    delete a[3];
    expect(a.length).to.equal(4);

    expect(serialize(a)).to.deep.equal({
      $n: ".SparseArray",
      length: 4,
      values: [0, 'a', 2, 'c'],
    });
  })

  it("serializes Set and retains order", function() {
    let set = new Set();
    set.add(1);
    set.add(3);
    set.add(2);
    set.add({});
    expect(serialize(set)).to.deep.equal({
      $n: ".Set",
      values: [1, 3, 2, {}],
    });
  })

  it("serializes Map and retains order", function() {
    let set = new Map();
    set.set(1, "a");
    set.set(3, "c");
    set.set(2, "b");
    set.set({}, undefined);
    expect(serialize(set)).to.deep.equal({
      $n: ".Map",
      values: [1, "a", 3, "c", 2, "b", {}, { $r: ".undefined" }],
    });
  })

  it("serializes Map and retains order", function() {
    let set = new Map();
    set.set(1, "a");
    set.set(3, "c");
    set.set(2, "b");
    set.set({}, undefined);
    expect(serialize(set)).to.deep.equal({
      $n: ".Map",
      values: [1, "a", 3, "c", 2, "b", {}, { $r: ".undefined" }],
    });
  })

  it("cannot serialize instances of unregistered classes", function() {
    class A {
      constructor() {
        this.a = 1;
        this.b = new Observable(2);
      }
    }
    let a = new A();
    let namespace = new Namespace();
    expect(function() {
      serialize(a, {
        namespace
      });
    }).to.throw();
  })

  it("serializes instances of registered classes", function() {
    class A {
      constructor() {
        this.a = 1;
        this.b = new Observable(2);
      }
    }
    let namespace = new Namespace({A});
    let a = new A();
    expect(serialize(a, {
      namespace,
    })).to.deep.equal({ $n: "A", a: 1, b: 2 });
  })

  it("serializes array of registered function", function() {
    let fn = () => undefined;
    let namespace = new Namespace({fn});
    expect(serialize([fn], {
      namespace
    })).to.deep.equal([{ $r: "fn" }]);
  })

  it("serializes registered function", function() {
    let fn = () => undefined;
    let namespace = new Namespace({fn});
    expect(serialize(fn, {
      namespace
    })).to.deep.equal({ $r: "fn" });
  })

  it("serializes unregistered function", function() {
    let fn = () => undefined;
    let namespace = new Namespace();
    expect(serialize(fn, {
      namespace
    })).to.deep.equal(fn);
  })

  it("serializes array of registered external Object", function() {
    let myExternal = { x: 123 };
    let namespace = new Namespace({myExternal});
    expect(serialize([myExternal], {
      namespace
    })).to.deep.equal([{ $r: "myExternal" }]);
  })

  it("serializes registered external Object", function() {
    let myExternal = { x: 123 };
    let namespace = new Namespace({myExternal});
    expect(serialize(myExternal, {
      namespace
    })).to.deep.equal({ $r: "myExternal" });
  })

  it("serializes unregistered Object", function() {
    let myExternal = { x: 123 };
    let namespace = new Namespace();
    expect(serialize(myExternal, {
      namespace
    })).to.deep.equal({ x: 123 });
  })

  it("throws if argument passed to Namespace is not an object", function() {
    class A {
    }
    expect(function() {
      let ignored = new Namespace(A);
    }).to.throw();
  })

  it("throws if class name registered twice", function() {
    class A {
    }
    class B {
    }
    let namespace = new Namespace();
    namespace.add({"A": A});
    expect(function() {
      namespace.add({"A": B});
    }).to.throw(/'A' already registered/);
  })

  it("throws if class registered twice", function() {
    class A {
    }
    let namespace = new Namespace();
    namespace.add({"A": A});
    namespace.add({"B": A});
    expect(function() {
      let ignored = namespace.getExternalReference(A);
    }).to.throw(/already registered/);
  })

    it("serializes reference to Object in nested namespace", function() {
    let myExternal = { x: 123 };
    let inner = new Namespace({myExternal});
    let outer = new Namespace({inner});
    expect(outer.getExternalReference(myExternal)).to.deep.equal({ $r: "inner.myExternal" });
    expect(serialize(myExternal, {
      namespace: outer
    })).to.deep.equal({ $r: "inner.myExternal" });
  })

  it("throws in Namespace name contains '.'", function() {
    let namespace = new Namespace();
    expect(function() {
      namespace.add({
        "a.b": {},
      });
    }).to.throw(/Invalid name 'a.b'/);
  })

  it("serializes array of observable", function() {
    let observable = new Observable("initial");
    expect(serialize([observable])).to.deep.equal(["initial"]);
  })
  
  it("serializes observable of observables", function() {
    let fn = () => undefined;
    let a = new Observable("a");
    let outer = new Observable({
      a: a,
      b: "b",
      c: [a, "b"],
      d: {a: 1, b: 2},
      f: fn,
    });

    expect(serialize(outer)).to.deep.equal({
      a: "a",
      b: "b",
      c: ["a", "b"],
      d: {a: 1, b: 2},
      f: fn,
    });
  })
  
  it("eliminates duplicate objects when serialization enabled", function() {
    let obj = { value: 1 };
    let array = [obj, obj];
    let result = serialize(array, {
      serialize: true,
    });
    expect(result).to.deep.equal([{ $a: 1, value: 1}, { $r: 1 }]);
  })
  
  it("eliminates cycles in objects when serialization enabled", function() {
    let cyclic = new Observable();
    cyclic.$ = { cycle: cyclic };
    let result = serialize(cyclic, {
      serialize: true,
    });
    expect(result).to.deep.equal({ $a: 1, cycle: { $r: 1 } });
  })
  
  it("retains cycles in objects when serialization disabled", function() {
    let cyclic = new Observable();
    cyclic.$ = { cycle: cyclic };
    let result = serialize(cyclic, {
      serialize: false,
    });
    expect(result.cycle).to.equal(result);
  })
  
  it("eliminates cycles in arrays when serialization enabled", function() {
    let array = [];
    array.push(array);
    let result = serialize(array, {
      serialize: true,
    });
    expect(result.$a).to.equal(1);
    expect(result.length).to.equal(1);
    expect(result[0]).to.deep.equal({ $r: 1 });
  })
  
  it("retains cycles in arrays when serialization disabled", function() {
    let array = [];
    array.push(array);
    let result = serialize(array, {
      serialize: false,
    });
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal(result);
  })
  
  it("filters object properties", function() {
    let obj = {
      number: 1,
      observable: new Observable(2),
    };
    let result = serialize(obj, {
      serialize: true,
      filter: isWritableObservable,
    });
    expect(result).to.deep.equal({ number: 1, observable: 2 });
  })
  
  it("serializes all (underived) Object properties even when filter in use", function() {
    class A {
      constructor() {
        this.number = 1;
        this.observable = new Observable(2);
      }
    }
    let a = new A();
    let result = serialize(a, {
      serialize: true,
      filter: isWritableObservable,
      namespace: new Namespace({A}),
    });
    expect(result).to.deep.equal({ $n: "A", observable: 2 });
  })

  it("transforms number", function() {
    let result = serialize(1, {
      transform: v => v + 1,
    });
    expect(result).to.equal(2);
  })

  it("transforms object properties", function() {
    let obj = {
      number: 1,
    };
    let result = serialize(obj, {
      transform: v => {
        if (typeof v === "number")
          return v + 1;
        return v;
      },
    });
    expect(result).to.deep.equal({ number: 2 });
  })

  it("can transfrom to object that is itself recursively serialized", function() {
    let obj = {
      number: 1,
    };
    let result = serialize(["magic"], {
      transform: v => {
        if (v === "magic")
          return obj;
        return v;
      },
    });
    expect(result).to.deep.equal([{ number: 1 }]);
  })

  it("escapes properties beginning $", function() {
    expect(serialize({ $z: 1, $$: 2, z$: 3 })).to.deep.equal({ $$z: 1, $$$: 2, z$: 3 });
  })

  it("can stringify to json", function() {
    expect(serialize({ a: 7 }, {
      format: "json"
    })).to.equal('{"a":7}');
  })

  it("throws error on unknown format", function() {
    expect(function() {
      serialize({ a: 7 }, {
        format: "foo"
      });
    }).to.throw(/Unknown format 'foo'/);
  })
})

describe("serialize ArrayBuffer", function() {
  let buffer;

  beforeEach(function() {
    buffer = new ArrayBuffer(8);
    let view = new Uint8Array(buffer, 0, 8);
    for (let i = 0; i < view.length; ++i)
      view[i] = i + 65;
  })

  it("serializes ArrayBuffer", function() {
    expect(serialize(buffer)).to.deep.equal({
      $n: ".ArrayBuffer",
      data: "ABCDEFGH",
      byteLength: 8,
    });
  })

  it("serializes Uint8Array", function() {
    let view = new Uint8Array(buffer, 0, 8);
    expect(serialize(view)).to.deep.equal({
      $n: ".Uint8Array",
      byteOffset: 0,
      length: 8,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Uint8ClampedArray", function() {
    let view = new Uint8ClampedArray(buffer, 0, 8);
    expect(serialize(view)).to.deep.equal({
      $n: ".Uint8ClampedArray",
      byteOffset: 0,
      length: 8,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Int8Array", function() {
    let view = new Int8Array(buffer, 0, 8);
    expect(serialize(view)).to.deep.equal({
      $n: ".Int8Array",
      byteOffset: 0,
      length: 8,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Uint16Array", function() {
    let view = new Uint16Array(buffer, 0, 4);
    expect(serialize(view)).to.deep.equal({
      $n: ".Uint16Array",
      byteOffset: 0,
      length: 4,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Int16Array", function() {
    let view = new Int16Array(buffer, 0, 4);
    expect(serialize(view)).to.deep.equal({
      $n: ".Int16Array",
      byteOffset: 0,
      length: 4,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Uint32Array", function() {
    let view = new Uint32Array(buffer, 0, 2);
    expect(serialize(view)).to.deep.equal({
      $n: ".Uint32Array",
      byteOffset: 0,
      length: 2,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Int32Array", function() {
    let view = new Int32Array(buffer, 0, 2);
    expect(serialize(view)).to.deep.equal({
      $n: ".Int32Array",
      byteOffset: 0,
      length: 2,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Float32Array", function() {
    let view = new Float32Array(buffer, 0, 2);
    expect(serialize(view)).to.deep.equal({
      $n: ".Float32Array",
      byteOffset: 0,
      length: 2,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes Float64Array", function() {
    let view = new Float64Array(buffer, 0, 1);
    expect(serialize(view)).to.deep.equal({
      $n: ".Float64Array",
      byteOffset: 0,
      length: 1,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("serializes DataView", function() {
    let view = new DataView(buffer, 0, 8);
    expect(serialize(view)).to.deep.equal({
      $n: ".DataView",
      byteOffset: 0,
      byteLength: 8,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCDEFGH",
        byteLength: 8,
      }
    });
  })

  it("does not serialize ArrayBuffer for structured cloning", function() {
    let namespace = new Namespace({}, STRUCTURED_CLONE_DEFAULTS);
    let result = serialize(buffer, { namespace });
    expect(result).to.be.instanceof(ArrayBuffer);
    expect(result).to.equal(buffer);
  })
})
