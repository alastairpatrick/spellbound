import { expect } from 'chai';

import { hasEnumerable } from '..';

const objectPrototype = Object.prototype;

describe("hasEnumerable", function() {
  it("throws if Object has enumerable property", function() {
    objectPrototype.blink = function(msg) {
      return `<blink>${msg}</blink>`;
    };
    try {
      expect(function() {
        hasEnumerable({x: 1}, "x");
      }).to.throw();
    } finally {
      delete objectPrototype.blink;
    }
  })

  it("throws for null", function() {
    expect(function() {
      hasEnumerable(null, "x");
    }).to.throw();
  })

  it("throws for undefined", function() {
    expect(function() {
      hasEnumerable(undefined, "x");
    }).to.throw();
  })

  it("throws for string", function() {
    expect(function() {
      hasEnumerable("fox", "x");
    }).to.throw();
  })

  it("throws for number", function() {
    expect(function() {
      hasEnumerable(1, "x");
    }).to.throw();
  })

  it("returns true for property owned by object", function() {
    expect(hasEnumerable({x: 1}, "x")).to.be.true;
  })

  it("returns true for property inherited by object", function() {
    let a = {x: 1}
    let b = Object.create(a);
    expect(hasEnumerable(b, "x")).to.be.true;
  })

  it("returns true for element in array", function() {
    expect(hasEnumerable([1, 2], 1)).to.be.true;
  })

  it("returns false for property not in object", function() {
    expect(hasEnumerable({a: 1}, "x")).to.be.false;
  })

  it("returns false for property deleted from object", function() {
    let a = {x: 1};
    delete a.x;
    expect(hasEnumerable(a, "x")).to.be.false;
  })

  it("returns false for negative array element", function() {
    expect(hasEnumerable([1, 2], -1)).to.be.false;
  })

  it("returns false for out of bounds array element", function() {
    expect(hasEnumerable([1, 2], 2)).to.be.false;
  })

  it("returns false for deleted array element", function() {
    let a = [1, 2, 3];
    delete a[1];
    expect(hasEnumerable(a, 1)).to.be.false;
  })
})
