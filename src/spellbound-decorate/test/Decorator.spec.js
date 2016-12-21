import { expect } from 'chai';

import { Decorator } from '..';


describe("Decorator", function() {
  it("can decorate a class with a decorator having no arguments", function() {
    const TagDecorator = (target => {
      target.wasDecorated = true;
      return target;
    })
    [Decorator()]

    const Example = class {
    }
    [TagDecorator()]

    expect(Example.wasDecorated).to.be.true;
  })

  it("can use shorthand for decorators with no arguments", function() {
    const TagDecorator = (target => {
      target.wasDecorated = true;
      return target;
    })
    [Decorator]

    const Example = class {
    }
    [TagDecorator]

    expect(Example.wasDecorated).to.be.true;
  })

  it("can be invoked directly", function() {
    const TagDecorator = (target => {
      target.wasDecorated = true;
      return target;
    })
    [Decorator]

    class Example {
    }
    
    const Decorated = TagDecorator()(Example);

    expect(Decorated.wasDecorated).to.be.true;
  })

  it("can decorate a class with an decorator having an argument", function() {
    const DesignPalette = ((target, palette) => {
      target.designPalette = palette;
      return target;
    })
    [Decorator]

    const Example = class {
    }
    [DesignPalette("Admin")];

    expect(Example.designPalette).to.equal("Admin");
  })

  it("can subclass a class", function() {
    const InterceptDecorator = ((target, log) => {
      return class extends target {
        constructor(...args) {
          super(...args);
          log.push(Object.assign({}, this));
        }
      };
    })
    [Decorator]

    let log = [];

    const Example = class {
      constructor(x) {
        this.x = x;
      }
    }
    [InterceptDecorator(log)];

    let ignored1 = new Example(1);
    let ignored2 = new Example(2);
    expect(log).to.deep.equal([
      {x: 1},
      {x: 2}
    ]);
  })

  it("can be chained", function() {
    const TagDecorator1 = (target => {
      target.wasDecorated = [1];
      return target;
    })
    [Decorator]

    const TagDecorator2 = (target => {
      target.wasDecorated.push(2);
      return target;
    })
    [Decorator]

    const Example = class {
    }
    [TagDecorator1]
    [TagDecorator2]

    expect(Example.wasDecorated).to.deep.equal([1, 2]);
  })
})
