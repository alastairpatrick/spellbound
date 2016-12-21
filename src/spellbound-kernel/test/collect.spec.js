import sinon from 'sinon';
import { expect } from 'chai';

import { didObserve, collectObservations } from '..';

describe("Collect", function() {
  it("returns value computed while collecting observations", function() {
    let listener = sinon.spy();
    let value = collectObservations(() => {
      return 1;
    }, listener);
    expect(value).to.equal(1);
  })

  it("listener invoked for observations", function() {
    let listener = sinon.spy();
    collectObservations(() => {
      didObserve("A");
    }, listener);
    sinon.assert.calledOnce(listener);
    sinon.assert.calledWith(listener, "A");
  })

  it("listener not invoked for observations made outside of monitored function", function() {
    let spy = sinon.spy();
    let listener = v => {
      didObserve("B");
      spy(v);
    }
    collectObservations(() => {
      didObserve("A");
    }, listener);
    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, "A");
  })

  it("listeners invoked for nested monitors if not capturing", function() {
    let listener1 = sinon.spy();
    let listener2 = sinon.spy();
    collectObservations(() => {
      collectObservations(() => {
        didObserve("A");
      }, listener1, { capture: false });
    }, listener2, { capture: false });
    sinon.assert.calledOnce(listener1);
    sinon.assert.calledWith(listener1, "A");
    sinon.assert.calledOnce(listener2);
    sinon.assert.calledWith(listener2, "A");
  })

  it("listeners invoked only for inner monitor if it is capturing", function() {
    let listener1 = sinon.spy();
    let listener2 = sinon.spy();
    collectObservations(() => {
      collectObservations(() => {
        didObserve("A");
      }, listener1, { capture: true });
    }, listener2, { capture: false });
    sinon.assert.calledOnce(listener1);
    sinon.assert.calledWith(listener1, "A");
    sinon.assert.notCalled(listener2);
  })

  it("ignores exceptions throws by listeners.", function() {
    let listener1 = sinon.stub().throws(new Error("Error"));
    let listener2 = sinon.spy();
    collectObservations(() => {
      collectObservations(() => {
        didObserve("A");
      }, listener1, { capture: true });
    }, listener2, { capture: false });
    sinon.assert.calledOnce(listener1);
    sinon.assert.calledWith(listener1, "A");
    sinon.assert.notCalled(listener2);
  })
})
