import sinon from 'sinon';
import { expect } from 'chai';

import { didObserve, setDidObserve, assertNotInterceptingObservations } from '..';

describe("Observe", function() {
  it("can be called while not intercepting", function() {
    didObserve("test");
  })

  it("can intercept observations", function() {
    let obj = {};
    let listener = sinon.spy();
    let old = setDidObserve(listener);
    try {
      didObserve(obj);
    } finally {
      setDidObserve(old);
    }
    sinon.assert.calledOnce(listener);
    sinon.assert.calledWith(listener, obj);
  })

  it("can assert if observing", function() {
    let listener = sinon.spy();
    let old = setDidObserve(listener);
    try {
      expect(function() {
        assertNotInterceptingObservations();
      }).to.throw();
    } finally {
      setDidObserve(old);
    }
  })

  it("does not assert if not observing", function() {
    assertNotInterceptingObservations();
  })

  it("asynchronously resets didObserve", function(done) {
    let listener = sinon.spy();
    setDidObserve(listener);

    expect(function() {
      assertNotInterceptingObservations();
    }).to.throw();

    setImmediate(function() {
      assertNotInterceptingObservations();
      done();
    });
  })
})
