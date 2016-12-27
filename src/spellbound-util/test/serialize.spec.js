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

  it("without namspace, serializes instances of non-Object classes as Ojbects", function() {
    class A {
      constructor() {
        this.a = 1;
        this.b = new Observable(2);
      }
    }
    let a = new A();
    expect(serialize(a)).to.deep.equal({ a: 1, b: 2});
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
    expect(function() {
      namespace.add({"B": A});
    }).to.throw(/'B' already registered/);
  })

  it("serializes array", function() {
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

  it("escapes properties beginning $", function() {
    expect(serialize({ $z: 1, $$: 2, z$: 3 })).to.deep.equal({ $$z: 1, $$$: 2, z$: 3 });
  })
})
