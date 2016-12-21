import { expect } from 'chai';

import { Uno } from '..';


describe("Uno", function() {
  let uno;
  beforeEach(function() {
    uno = new Uno();
  });

  it("has object type", function() {
    expect(typeof uno).to.equal("object");
  })

  it("has object toString", function() {
    expect(uno.toString()).to.equal("[object Object]");
  })

  it("has object toLocaleString", function() {
    expect(uno.toLocaleString()).to.equal("[object Object]");
  })

  it("has object valueOf", function() {
    expect(uno.valueOf()).to.equal(uno);
  })

  it("has working hasOwnProperty", function() {
    uno.x = 1;

    Object.defineProperty(uno, "hidden", {
      value: 2,
      enumerable: false,
    });

    expect(Uno.prototype.hasOwnProperty.call(uno, "hasOwnProperty")).to.be.false;
    expect(Uno.prototype.hasOwnProperty.call(uno, "x")).to.be.true;
    expect(Uno.prototype.hasOwnProperty.call(uno, "y")).to.be.false;
    expect(Uno.prototype.hasOwnProperty.call(uno, "hidden")).to.be.true;
  })

  it("has working propertyIsEnumerable", function() {
    uno.x = 1;

    Object.defineProperty(uno, "hidden", {
      value: 2,
      enumerable: false,
    });

    expect(Uno.prototype.propertyIsEnumerable.call(uno, "hasOwnProperty")).to.be.false;
    expect(Uno.prototype.propertyIsEnumerable.call(uno, "x")).to.be.true;
    expect(Uno.prototype.propertyIsEnumerable.call(uno, "y")).to.be.false;
    expect(Uno.prototype.propertyIsEnumerable.call(uno, "hidden")).to.be.false;
  })

  it("has working isPrototypeOf", function() {
    class Example extends Uno {
    }

    expect(Uno.prototype.isPrototypeOf.call(Object.prototype, Uno.prototype)).to.be.false;
    expect(Uno.prototype.isPrototypeOf.call(Uno.prototype, Example.prototype)).to.be.true;
  })

  it("has working instanceof", function() {
    expect(uno instanceof Object).to.be.false;
    expect(uno instanceof Uno).to.be.true;
  })

  it("has a constructor property", function() {
    expect(uno.constructor).to.be.equal(Uno);
  })

  it("copies owned properties of object passed to constructor", function() {
    expect(uno.constructor).to.be.equal(Uno);
  })
})
