const { expect } = require('chai');

const { Computed, Observable, isWritableObservable } = require('../../spellbound-core');
const { Namespace, deserialize } = require('..');


describe("deserialize", function() {
  it("deserializes number to itself", function() {
    expect(deserialize(7)).to.equal(7);
  })

  it("deserializes Number object", function() {
    let result = deserialize({ $n: ".Number", value: 7 });
    expect(result).to.be.instanceof(Number);
    expect(result.valueOf()).to.equal(7);
  })

  it("pass through Number object", function() {
    let object = new Number(7);
    let result = deserialize(object);
    expect(result).to.equal(object);
  })

  it("deserializes string to itself", function() {
    expect(deserialize("hello")).to.equal("hello");
  })

  it("deserializes true to itself", function() {
    expect(deserialize(true)).to.equal(true);
  })

  it("deserializes false to itself", function() {
    expect(deserialize(false)).to.equal(false);
  })

  it("deserializes Boolean object", function() {
    let result = deserialize({ $n: ".Boolean", value: true });
    expect(result).to.be.instanceof(Boolean);
    expect(result.valueOf()).to.equal(true);
  })

  it("pass through Boolean object", function() {
    let object = new Boolean(true);
    let result = deserialize(object);
    expect(result).to.equal(object);
  })

  it("deserializes null to itself", function() {
    expect(deserialize(null)).to.equal(null);
  })

  it("deserializes reference to undefined", function() {
    expect(deserialize({ $r: ".undefined" })).to.equal(undefined);
  })

  it("deserializes reference to NaN", function() {
    expect(deserialize({ $r: ".NaN" })).to.be.NaN;
  })

  it("deserializes reference to Infinity", function() {
    expect(deserialize({ $r: "+Infinity" })).to.equal(Infinity);
  })

  it("deserializes reference to -Infinity", function() {
    expect(deserialize({ $r: "-Infinity" })).to.equal(-Infinity);
  })

  it("passes through function", function() {
    let fn = () => undefined;
    expect(deserialize(fn)).to.equal(fn);
  })

  it("deserializes Object", function() {
    expect(deserialize({ a: 1 })).to.deep.equal({ a: 1 });
  })

  it("deserializes Date", function() {
    let dateStr = "1995-12-25T13:30:00.000Z";
    let result = deserialize({
      $n: ".Date",
      "iso": dateStr,
    })
    expect(result).to.be.instanceof(Date);
    expect(result.toISOString()).to.equal(dateStr);
  })

  it("passes through Date object", function() {
    let object = new Date(0);
    let result = deserialize(object);
    expect(result).to.equal(object);
  })

  it("deserializes RegExp", function() {
    let result = deserialize({
      $n: ".RegExp",
      source: "abc",
    })
    expect(result).to.be.instanceof(RegExp);
    expect(result.source).to.equal("abc");
    expect(result.flags).to.equal("");
    expect(result.lastIndex).to.equal(0);
  })

  it("deserializes RegExp with flags", function() {
    let result = deserialize({
      $n: ".RegExp",
      source: "abc",
      flags: "g",
    })
    expect(result).to.be.instanceof(RegExp);
    expect(result.source).to.equal("abc");
    expect(result.flags).to.equal("g");
    expect(result.lastIndex).to.equal(0);
  })

  it("deserializes RegExp with lastIndex", function() {
    let result = deserialize({
      $n: ".RegExp",
      source: "abc",
      flags: "g",
      lastIndex: 1,
    })
    expect(result).to.be.instanceof(RegExp);
    expect(result.source).to.equal("abc");
    expect(result.flags).to.equal("g");
    expect(result.lastIndex).to.equal(1);
  })

  it("passes through RegExp object", function() {
    let object = /abc/;
    let result = deserialize(object);
    expect(result).to.equal(object);
  })

  it("deserializes Errors", function() {
    let test = (name, cl) => {
      let result = deserialize({
        $n: name,
        message: "Message",
      });
      expect(result).to.be.instanceof(cl);
      expect(result.message).to.equal("Message");
    }

    test(".Error", Error);
    test(".EvalError", EvalError);
    test(".RangeError", RangeError);
    test(".ReferenceError", ReferenceError);
    test(".SyntaxError", SyntaxError);
    test(".TypeError", TypeError);
    test(".URIError", URIError);
  })

  it("deserializes dense Array", function() {
    expect(deserialize([1, 2, 3])).to.deep.equal([1, 2, 3]);
  })

  it("deserializes sparse Array", function() {
    let result = deserialize({
      $n: ".SparseArray",
      length: 4,
      values: [0, 'a', 2, 'c'],
    });

    expect(result.length).to.equal(4);
    let elements = {};
    result.forEach((el, i) => {
      elements[i] = el;
    });
    expect(elements).to.deep.equal({"0": 'a', "2": 'c'});
  })

  it("deserializes Set and retains order", function() {
    let result = deserialize({
      $n: ".Set",
      values: [1, 3, 2, {}],
    });
    expect(result).to.be.instanceof(Set);

    let values = [];
    result.forEach(value => {
      values.push(value);
    });

    expect(values).to.deep.equal([1, 3, 2, {}]);
  })

  it("deserializes Map and retains order", function() {
    let result = deserialize({
      $n: ".Map",
      values: [1, "a", 3, "c", 2, "b", {}, { $r: ".undefined" }],
    });
    expect(result).to.be.instanceof(Map);

    let keys = [];
    let values = [];
    result.forEach((value, key) => {
      keys.push(key);
      values.push(value);
    });

    expect(keys).to.deep.equal([1, 3, 2, {}]);
    expect(values).to.deep.equal(["a", "c", "b", undefined]);
  })

  it("deserializes ArrayBuffer", function() {

    let result = deserialize({
      $n: ".ArrayBuffer",
      data: "ABCD",
      byteLength: 4,
    });
    expect(result).to.be.instanceof(ArrayBuffer);
    expect(result.byteLength).to.equal(4);

    let view = new Uint8Array(result);
    expect(view.reduce((prev, curr) => prev.concat(curr), [])).to.deep.equal([
      65, 66, 67, 68
    ])
  })

  it("passes through ArrayBuffer object", function() {
    let object = new ArrayBuffer(4);
    let result = deserialize(object);
    expect(result).to.equal(object);
  })

  it("deserializes Uint8Array", function() {
    let result = deserialize({
      $n: ".Uint8Array",
      byteOffset: 0,
      length: 4,
      buffer: {
        $n: ".ArrayBuffer",
        data: "ABCD",
        byteLength: 4,
      }
    });

    expect(result).to.be.instanceof(Uint8Array);
    expect(result.length).to.equal(4);
    expect(result.reduce((prev, curr) => prev.concat(curr), [])).to.deep.equal([
      65, 66, 67, 68
    ])
  })

  it("deserializes pair of Uint8Array sharing buffer", function() {
    let result = deserialize([{
      $n: ".Uint8Array",
      byteOffset: 0,
      length: 4,
      buffer: {
        $r: 1,
      }
    }, {
      $n: ".Uint8Array",
      byteOffset: 0,
      length: 4,
      buffer: {
        $n: ".ArrayBuffer",
        $a: 1,
        data: "ABCD",
        byteLength: 4,
      }
    }]);

    expect(result[0]).to.be.instanceof(Uint8Array);
    expect(result[0].length).to.equal(4);
    expect(result[1]).to.be.instanceof(Uint8Array);
    expect(result[1].length).to.equal(4);
    expect(result[1].buffer).to.equal(result[1].buffer);
  })

  it("deserializes object of registered class", function() {
    class A {
      constructor() {
        this.a = 1;
      }
    }
    let namespace = new Namespace({A});
    let result = deserialize({ $n: "A", a: 1 }, {
      namespace
    });
    expect(result).to.be.instanceof(A);
    expect(result).to.deep.equal({ a: 1 });
  })

  it("throws exception for object of unregistered class", function() {
    expect(function() {
      deserialize({ $n: "A", a: 1 });
    }).to.throw();
  })

  it("deserializes registered function", function() {
    let fn = () => undefined;
    let namespace = new Namespace({fn});
    let result = deserialize({ $r: "fn" }, {
      namespace
    });
    expect(result).to.equal(fn);
  })

  it("deserializes array of registered function", function() {
    let fn = () => undefined;
    let namespace = new Namespace({fn});
    let result = deserialize([{ $r: "fn" }], {
      namespace
    });
    expect(result).to.deep.equal([fn]);
  })

  it("deserializes registered Object", function() {
    let myExternal = { x: 123 };
    let namespace = new Namespace({myExternal});
    let result = deserialize({ $r: "myExternal" }, {
      namespace
    });
    expect(result).to.equal(myExternal);
  })

  it("deserializes array of registered Object", function() {
    let myExternal = { x: 123 };
    let namespace = new Namespace({myExternal});
    let result = deserialize([{ $r: "myExternal" }], {
      namespace
    });
    expect(result).to.deep.equal([myExternal]);
  })

  it("deserializes to unobservable object property", function() {
    class A {
      constructor() {
        this.b = 1;
      }
    }
    let namespace = new Namespace({A});
    let result = deserialize({ $n: "A", b: 7 }, {
      namespace
    });
    expect(result).to.be.instanceof(A);
    expect(result.b).to.equal(7);
  });

  it("throws exception trying to deserialize to observable object property that is not writable", function() {
    class A {
      constructor() {
        this.b = new Computed(() => 1);
      }
    }
    let namespace = new Namespace({A});
    expect(function() {
      deserialize({ $n: "A", b: 7 }, {
        namespace
      });
    }).to.throw(/unwritable/);
  });

  it("deserializes to observable object property", function() {
    class A {
      constructor() {
        this.b = new Observable(1);
      }
    }
    let namespace = new Namespace({A});
    let result = deserialize({ $n: "A", b: 7 }, {
      namespace
    });
    expect(result).to.be.instanceof(A);
    expect(result.b.$).to.equal(7);
  });

  it("throws exception for unknown property of object with default filter", function() {
    class A {
    }
    let namespace = new Namespace({A});
    expect(function() {
      deserialize({ $n: "A", b: 7 }, {
        namespace
      });
    }).to.throw(/Unknown property b/);
  });

  it("filter excludes object properties", function() {
    class A {
      constructor() {
        this.b = 1;
      }
    }
    let namespace = new Namespace({A});
    let result = deserialize({ $n: "A", b: 7 }, {
      filter: isWritableObservable,
      namespace,
    });
    expect(result).to.be.instanceof(A);
    expect(result.b).to.equal(1);
  })

  it("filter includes object properties", function() {
    class A {
      constructor() {
        this.b = new Observable(1);
      }
    }
    let namespace = new Namespace({A});
    let result = deserialize({ $n: "A", b: 7 }, {
      filter: isWritableObservable,
      namespace,
    });
    expect(result).to.be.instanceof(A);
    expect(result.b.$).to.equal(7);
  })
 
  it("filter does not apply to (underived) Object properties", function() {
    let result = deserialize({ b: 1 }, {
      filter: isWritableObservable,
    });
    expect(result.b).to.equal(1);
  })
 
  it("deserializes Object of Objects", function() {
    expect(deserialize({ a: { b: 1 } })).to.deep.equal({ a: { b: 1 } });
  })
  
  it("deserializes array of Objects", function() {
    expect(deserialize([{ a: 1 }, { b: 2 }])).to.deep.equal([{ a: 1 }, { b: 2 }]);
  })
  
  it("deserializes Object with array", function() {
    expect(deserialize({ a: [1, 2, 3] })).to.deep.equal({ a: [1, 2, 3] });
  })
  
  it("deserializes array of identical Objects", function() {
    let result = deserialize([{ $a: 1, a: 1}, { $r: 1 }]);
    expect(result.length).to.equal(2);
    expect(result[0]).to.deep.equal({ a: 1 });
    expect(result[0]).to.equal(result[1]);
  })
  
  it("deserializes Object that references itself", function() {
    let result = deserialize({ $a: 1, r: { $r: 1 }});
    expect(result.r).to.equal(result);
  })

  it("deserializes Object of instance of registered class", function() {
    class A {
      constructor() {
        this.b = 1;
      }
    }
    let namespace = new Namespace({A});
    let result = deserialize({ a: { $n: "A", b: 7 } }, {
      namespace
    });
    expect(result.a).to.be.instanceof(A);
    expect(result.a.b).to.equal(7);
  })

  it("deserializes to target Object", function() {
    let obj = {
      a: 1
    };
    deserialize({ a: 2 }, {
      target: obj
    });
    expect(obj).to.deep.equal({ a: 2 });
  })

  it("deserializes to target array", function() {
    let array = [1, 2, 3];
    deserialize([4, 5, 6], {
      target: array
    });
    expect(array).to.deep.equal([4, 5, 6]);
  })

  it("transforms number", function() {
    let result = deserialize(1, {
      transform: v => v + 1,
    });
    expect(result).to.equal(2);
  });

  it("transforms object properties", function() {
    let obj = {
      number: 1,
    };
    let result = deserialize(obj, {
      transform: v => {
        if (typeof v === "number")
          return v + 1;
        return v;
      },
    });
    expect(result).to.deep.equal({ number: 2 });
  });

  it("can transform to object that is itself recursively deserialized", function() {
    let obj = {
      $a: 1,
      number: 1,
    };
    let result = deserialize([{ $r: 1 }, "magic"], {
      transform: v => {
        if (v === "magic")
          return obj;
        return v;
      },
    });
    expect(result).to.deep.equal([{ number: 1 }, { number: 1 }]);
  });

  it("unescapes escaped properties", function() {
    expect(deserialize({ $$z: 1, $$$: 2, z$: 3 })).to.deep.equal({ $z: 1, $$: 2, z$: 3 });
  })

  it("can parse json", function() {
    expect(deserialize('{"a": 7}', {
      format: "json",
    })).to.deep.equal({ a: 7 });
  });

  it("throws exception on unknown format", function() {
    expect(function() {
      deserialize('{"a": 7}', {
        format: "foo",
      });
    }).to.throw(/Unknown format 'foo'/);
  });
})
