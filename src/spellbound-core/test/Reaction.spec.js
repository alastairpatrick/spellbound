import sinon from 'sinon';
import { expect } from 'chai';

import { Reaction, Observable } from '..';

describe("Reaction", function() {
  let observable, reaction, read, when;

  beforeEach(function() {
    observable = new Observable(1);
    read = sinon.stub().returns(1);
    when = sinon.spy();
    reaction = new Reaction();
  });

  it("evaluates synchronously", function(done) {
    reaction.evaluate(read, when);
    sinon.assert.calledOnce(read);
    sinon.assert.notCalled(when);

    setImmediate(function() {
      sinon.assert.calledOnce(read); 
      setTimeout(function() {
        sinon.assert.notCalled(when);
        done();
      }, 1);
    }); 
  })

  it("reevaluates even if dependencies have not changed", function(done) {
    reaction.evaluate(() => {
      read();
      return observable.$
    }, when);
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    reaction.evaluate(() => {
      read();
      return observable.$
    }, when);
    sinon.assert.calledTwice(read); 
    sinon.assert.notCalled(when);

    setImmediate(function() {
      sinon.assert.calledTwice(read); 
      setTimeout(function() {
        sinon.assert.notCalled(when);
        done();
      }, 1);
    }); 
  })

  it("asynchronously invokes when() and reevaluates after dependency changes", function(done) {
    reaction.evaluate(() => {
      read();
      return observable.$
    }, when);
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    observable.$ = 2;
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    setImmediate(function() {
      sinon.assert.calledTwice(read); 
      setTimeout(function() {
        sinon.assert.calledOnce(when);
        sinon.assert.calledWith(when, 2);
        done();
      }, 1);
    }); 
  })

  it("asynchronously invokes when() multiple times for multiple changes", function(done) {
    reaction.evaluate(() => {
      read();
      return observable.$
    }, when);

    observable.$ = 2;

    setImmediate(function() {
      sinon.assert.calledTwice(read);
      setTimeout(function() { 
        sinon.assert.calledOnce(when);
        sinon.assert.calledWith(when, 2);

        observable.$ = 3;

        setImmediate(function() {
          sinon.assert.calledThrice(read); 
          setTimeout(function() {
            sinon.assert.calledTwice(when);
            sinon.assert.calledWith(when, 3);
            done();
          }, 1);
        });
      }, 1);
    }); 
  })

  it("cancels asynchronous invocation of when() on dispose()", function(done) {
    reaction.evaluate(() => {
      read();
      return observable.$
    }, when);
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    observable.$ = 2;
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    reaction.dispose();

    setImmediate(function() {
      sinon.assert.calledOnce(read); 
      setTimeout(function() {
        sinon.assert.notCalled(when);
        done();
      }, 1);
    }); 
  })

  it("cannot be disposed within read()", function() {
    expect(function() {
      reaction.evaluate(() => {
        read();
        reaction.dispose();
        return observable.$
      }, when);
    }).to.throw();
  })

  it("can be disposed within when()", function(done) {
    reaction.evaluate(() => {
      read();
      return observable.$
    }, (value, reaction) => {
      when(value);
      reaction.dispose();
    });

    observable.$ = 2;

    setImmediate(function() {
      sinon.assert.calledTwice(read);
      setTimeout(function() { 
        sinon.assert.calledOnce(when);
        sinon.assert.calledWith(when, 2);

        observable.$ = 3;

        setImmediate(function() {
          sinon.assert.calledTwice(read); 
          setTimeout(function() {
            sinon.assert.calledOnce(when);
            done();
          }, 1);
        });
      }, 1);
    }); 
  })

  it("cancels asynchronous invocation of when() on reevaluation", function(done) {
    reaction.evaluate(() => {
      read();
      return observable.$
    }, when);
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    observable.$ = 2;
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    reaction.evaluate(() => {
      read();
      return observable.$
    }, when);
    sinon.assert.calledTwice(read); 
    sinon.assert.notCalled(when);

    setImmediate(function() {
      sinon.assert.calledTwice(read); 
      setTimeout(function() {
        sinon.assert.notCalled(when);
        done();
      }, 1);
    });
  })

  it("asynchronously reevaluates after dependency changes and invokes when() after delay", function(done) {
    reaction.evaluate(() => {
      read();
      return observable.$
    }, when, {
      minDelay: 10,
    });
    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    observable.$ = 2;

    sinon.assert.calledOnce(read); 
    sinon.assert.notCalled(when);

    setImmediate(function() {
      sinon.assert.calledTwice(read); 
      sinon.assert.notCalled(when);

      setTimeout(function() {
        sinon.assert.notCalled(when);

        setTimeout(function() {
          sinon.assert.calledOnce(when);
          sinon.assert.calledWith(when, 2);
          done();
        }, 20);
      }, 1);
    }); 
  })
})
