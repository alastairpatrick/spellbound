import sinon from 'sinon';
import { expect } from 'chai';

import { AutoRun, Observable } from '..';

describe("Reaction", function() {
  let action, autorun, observable;

  beforeEach(function() {
    observable = new Observable(1);
    action = sinon.spy();
    autorun = new AutoRun();
  });

  it("evaluates synchronously first time", function() {
    expect(autorun.run(action)).to.equal(autorun);
    sinon.assert.calledOnce(action);
    sinon.assert.calledWith(action, autorun);
  })

  it("is invoked asynchronously when dependency changes", function(done) {
    autorun.run(() => {
      action(observable.$);
    });
    sinon.assert.calledOnce(action);  // called synchronously on creation 
    sinon.assert.calledWith(action, 1);

    observable.$ = 2;
    observable.$ = 3;
    sinon.assert.calledOnce(action);  // called asynchronously thereafter

    setImmediate(function() {
      sinon.assert.calledTwice(action);
      sinon.assert.calledWith(action, 3);
      done();
    });
  })

  it("is not invoked when dependency changes after being disposed", function(done) {
    autorun.run(() => {
      action(observable.$);
    });
    sinon.assert.calledOnce(action);

    observable.$ = 2;
    autorun.dispose();

    setImmediate(function() {
      sinon.assert.calledOnce(action);
      done();
    });
  })

  it("is not invoked after disposing within action", function(done) {
    autorun.run((autorun) => {
      action(observable.$);
      autorun.dispose();
    });
    sinon.assert.calledOnce(action);

    observable.$ = 2;

    setImmediate(function() {
      sinon.assert.calledOnce(action);
      done();
    });
  })
})
