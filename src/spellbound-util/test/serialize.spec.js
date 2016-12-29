import { expect } from 'chai';

import { Observable, isWritableObservable } from '../../spellbound-core';
import { serialize, Namespace } from '..';


describe("serialize", function() {
  it("serializes number to itself", function() {
    expect(serialize(7)).to.equal(7);
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

  it("serializes null to itself", function() {
    expect(serialize(null)).to.equal(null);
  })

  it("serializes undefined as reference", function() {
    expect(serialize(undefined)).to.deep.equal({ $r: ".undefined" });
  })

  it("serializes NaN as reference", function() {
    expect(serialize(NaN)).to.deep.equal({ $r: ".NaN" });
  })

  it("serializes Infinity as reference", function() {
    expect(serialize(Infinity)).to.deep.equal({ $r: "+Infinity" });
  })

  it("serializes -Infinity as reference", function() {
    expect(serialize(-Infinity)).to.deep.equal({ $r: "-Infinity" });
  })

  it("serializes function", function() {
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
    expect(result).to.deep.equal({ observable: 2 });
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
