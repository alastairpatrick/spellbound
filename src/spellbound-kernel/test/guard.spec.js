import sinon from 'sinon';
import { expect } from 'chai';

import { didObserve, guard, willChange } from '..';

describe("Guard", function() {
  let objObserved1 = {};
  let objObserved2 = {};
  let objUnrelated = {};

  it("returns value when there are no dependencies", function() {
    let listener = sinon.spy();
    let { value, hasDependencies } = guard(listener, { sync: true }).collect(() => {
      return 1;
    });
    
    expect(value).to.equal(1);
    expect(hasDependencies).to.equal(0);
  })

  it("returns value when there are no dependencies", function() {
    let listener = sinon.spy();
    let { value, hasDependencies } = guard(listener, { sync: true }).collect(() => {
      didObserve(objObserved1);
      didObserve(objObserved2);
      return 1;
    });

    expect(value).to.equal(1);
    expect(hasDependencies).to.equal(2);
  })

  it("does not invoke listener if no change", function() {
    let listener = sinon.spy();
    guard(listener, { sync: true }).collect(() => {
      didObserve(objObserved1);
    });
    willChange(objUnrelated);

    sinon.assert.notCalled(listener);
  })

  it("invokes listener after first observed changed", function() {
    let listener = sinon.spy();
    guard(listener, { sync: true }).collect(() => {
      didObserve(objObserved1);
      didObserve(objObserved2);
    });
    willChange(objObserved1);

    sinon.assert.calledOnce(listener);
  })

  it("invokes listener after second observed changed", function() {
    let listener = sinon.spy();
    guard(listener, { sync: true }).collect(() => {
      didObserve(objObserved1);
      didObserve(objObserved2);
    });
    willChange(objObserved2);

    sinon.assert.calledOnce(listener);
  })

  it("invokes listener after chained observed changed", function() {
    let listener = sinon.spy();
    guard(listener, { sync: true }).collect(() => {
      didObserve(objObserved1);
    }).collect(() => {
      didObserve(objObserved2);
    });
    willChange(objObserved2);

    sinon.assert.calledOnce(listener);
  })

  it("invokes listener for each of multiple guards after observed changed", function() {
    let listener1 = sinon.spy();
    let listener2 = sinon.spy();

    guard(listener1, { sync: true }).collect(() => {
      didObserve(objObserved1);
    });

    guard(listener2, { sync: true }).collect(() => {
      didObserve(objObserved1);
    });

    willChange(objObserved1);

    sinon.assert.calledOnce(listener1);
    sinon.assert.calledOnce(listener1);
  })

  it("does not invoke same listener more than once", function() {
    let listener = sinon.spy();
    guard(listener, { sync: true }).collect(() => {
      didObserve(objObserved1);
    });
    willChange(objObserved1);

    sinon.assert.calledOnce(listener);
    willChange(objObserved1);

    sinon.assert.calledOnce(listener);
  })

  it("invokes listeners for both inner and outer guards if not capturing", function() {
    let listener1 = sinon.spy();
    let listener2 = sinon.spy();

    guard(listener1, { capture: false, sync: true }).collect(() => {
      guard(listener2, { capture: false, sync: true }).collect(() => {
        didObserve(objObserved1);
      });
    });
    
    willChange(objObserved1);

    sinon.assert.calledOnce(listener2);
    sinon.assert.calledOnce(listener1);
  })

  it("only invokes listener for inner guard if capturing", function() {
    let listener1 = sinon.spy();
    let listener2 = sinon.spy();

    guard(listener1, { capture: false, sync: true }).collect(() => {
      guard(listener2, { capture: true, sync: true }).collect(() => {
        didObserve(objObserved1);
      });
    });
    
    willChange(objObserved1);

    sinon.assert.calledOnce(listener2);
    sinon.assert.notCalled(listener1);
  })

  it("does not invoke listener if disposed before change", function() {
    let listener = sinon.spy();
    let { dispose } = guard(listener, { sync: true }).collect(() => {
      didObserve(objObserved1);
    });
    dispose();
    willChange(objObserved1);

    sinon.assert.notCalled(listener);
  })

  it("invokes listener asynchronously after first observed changed", function(done) {
    let listener = sinon.spy();
    guard(listener, { sync: false }).collect(() => {
      didObserve(objObserved1);
    });
    willChange(objObserved1);

    sinon.assert.notCalled(listener);
    setImmediate(function() {
      sinon.assert.calledOnce(listener);
      done();
    });
  })

  it("does not invoke listener asynchronously if disposed after change", function(done) {
    let listener = sinon.spy();
    let { dispose } = guard(listener, { sync: false }).collect(() => {
      didObserve(objObserved1);
    });
    willChange(objObserved1);
    
    dispose();

    sinon.assert.notCalled(listener);
    setImmediate(function() {
      sinon.assert.notCalled(listener);
      done();
    });
  })
})
