import { expect } from 'chai';

import { Proto } from '..';


describe("Proto", function() {
  it("can be used to change property descriptor", function() {
    const Example = class {
      get seven() {
        return 7;
      }
      get eight() {
        return 8;
      }
    }
    [Proto.Desc({
      seven: {
        enumerable: false,
      },
      eight: {
        enumerable: true,
      }
    })]

    expect(Object.prototype.propertyIsEnumerable.call(Example.prototype, "seven")).to.be.false;
    expect(Object.prototype.propertyIsEnumerable.call(Example.prototype, "eight")).to.be.true;

    let example = new Example();
    expect(example.seven).to.equal(7);
    expect(example.eight).to.equal(8);
  })

  it("throws an exception if a property is not found", function() {
    expect(function() {
      const IgnoredClass = class {
      }
      [Proto.Desc({
        notThere: {
          enumerable: false,
        }
      })]
    }).to.throw();
  })

  it("freezes", function() {
    const Example = class {
    }
    [Proto.Freeze]

    expect(Object.isFrozen(Example.prototype)).to.be.true;
  })

  it("prevents extensions", function() {
    const Example = class {
    }
    [Proto.PreventExtensions]

    expect(Object.isExtensible(Example.prototype)).to.be.false;
  })

  it("seals", function() {
    const Example = class {
    }
    [Proto.Seal]

    expect(Object.isSealed(Example.prototype)).to.be.true;
  })
})
