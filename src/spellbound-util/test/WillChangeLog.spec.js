import sinon from 'sinon';
import { expect } from 'chai';

import { addChangeListener } from '../../spellbound-kernel';
import { Event, Observable, observable } from '../../spellbound-core';
import { WillChangeLog } from '..';


describe("WillChangeLog", function() {
  let operations;

  beforeEach(function() {
    operations = new WillChangeLog();
  })

  it("can perform action", function() {
    let x = observable(1);
    operations.watch(() => {
      x.$ = 2;
    }); 
    expect(x.$).to.equal(2);
  })

  it("can undo action", function() {
    let x = observable(1);
    operations.watch(() => {
      x.$ = 2;
    }); 
    expect(x.$).to.equal(2);

    operations.undo();
    expect(x.$).to.equal(1);
  })

  it("can undo multiple changes to same observable", function() {
    let x = observable(1);
    operations.watch(() => {
      x.$ = 2;
      x.$ = 3;
    }); 
    expect(x.$).to.equal(3);

    operations.undo();
    expect(x.$).to.equal(1);
  })

  it("skips signalled events", function() {
    let event = new Event();
    let x = observable(1);
    operations.watch(() => {
      event.signal();
      x.$ = 2;
    });
    expect(x.$).to.equal(2);

    operations.undo();
    expect(x.$).to.equal(1);
    expect(event.$).to.be.undefined;
  })

  it("clears operations after undo", function() {
    let x = observable(1);
    operations.watch(() => {
      x.$ = 2;
    }); 
    expect(x.$).to.equal(2);

    operations.undo();
    expect(x.$).to.equal(1);

    x.$ = 2;
    expect(x.$).to.equal(2);
    operations.undo();
    expect(x.$).to.equal(2);
  })

  it("can undo change to property of observable object", function() {
    const Point = class extends Observable {
      constructor() {
        super();
        this.x = 1;
        this.y = 1;
      }
    }
    [Observable.Properties({
      x: {},
      y: {},
    })]

    let point = new Point();

    operations.watch(() => {
      point.x = 2;
    }); 
    expect(point.x).to.equal(2);
    expect(point.y).to.equal(1);

    operations.undo();
    expect(point.x).to.equal(1);
    expect(point.y).to.equal(1);
  })

  it("does not interfere with change listeners", function() {
    let x = observable(1);
    let listener = sinon.spy();
    addChangeListener(x, listener);

    operations.watch(() => {
      x.$ = 2;
    });

    sinon.assert.calledOnce(listener);
  })
})
