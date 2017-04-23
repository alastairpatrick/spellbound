const sinon = require('sinon');
const { expect } = require('chai');

const {
  addChangeListener,
  addObscureListener,
  addWakeListener,
  hasChangeListeners,
  removeChangeListener,
  removeObscureListener,
  removeWakeListener,
  setWillChange,
  willChange,
} = require('..');

describe("Change tracking", function() {
  let listener1, listener2;
  let objChanged1, objChanged2;

  beforeEach(function() {
    objChanged1 = {};
    objChanged2 = {};
    listener1 = sinon.spy();
    listener2 = sinon.spy();
  });

  it("can globally intercept willChange", function() {
    let old = setWillChange(listener1);
    try {
      willChange(objChanged1);
    } finally {
      setWillChange(old);
    }

    sinon.assert.calledOnce(listener1);
    sinon.assert.calledWith(listener1, objChanged1);
  })

  it("can count change listeners", function() {
    expect(hasChangeListeners(objChanged1)).to.equal(0);
    addChangeListener(objChanged1, listener1);
    expect(hasChangeListeners(objChanged1)).to.equal(1);
    addChangeListener(objChanged1, listener2);
    expect(hasChangeListeners(objChanged1)).to.equal(2);
  });

  it("each change listeners only counts once", function() {
    expect(hasChangeListeners(objChanged1)).to.equal(0);
    addChangeListener(objChanged1, listener1);
    addChangeListener(objChanged1, listener1);
    expect(hasChangeListeners(objChanged1)).to.equal(1);
  });

  it("invokes change listeners on change", function() {
    addChangeListener(objChanged1, listener1);
    addChangeListener(objChanged2, listener2);

    willChange(objChanged1);
    sinon.assert.calledOnce(listener1);

    willChange(objChanged2);
    sinon.assert.calledOnce(listener2);
  })

  it("invokes change listeners for changes that occur while in prior change listeners", function() {
    addChangeListener(objChanged1, listener1);
    addChangeListener(objChanged2, listener2);

    let changingListener = () => willChange(objChanged2);
    addChangeListener(objChanged1, changingListener);

    willChange(objChanged1);

    sinon.assert.calledOnce(listener1);
    sinon.assert.calledOnce(listener2);
  })

  it("invoked change listeners only once even when recursively rescheduled", function() {
    addChangeListener(objChanged1, listener1);

    let changingListener = () => willChange(objChanged1);
    addChangeListener(objChanged1, changingListener);

    willChange(objChanged1);

    sinon.assert.calledOnce(listener1);
  })

  it("does not invoke change listener once removed", function() {
    addChangeListener(objChanged1, listener1);
    removeChangeListener(objChanged1, listener1);
    willChange(objChanged1);
    sinon.assert.notCalled(listener1);
  })

  it("invokes wake listener when change listener is added", function() {
    addWakeListener(objChanged1, listener1);
    sinon.assert.notCalled(listener1);
    addChangeListener(objChanged1, listener2);
    sinon.assert.calledOnce(listener1);
    sinon.assert.calledWith(listener1, objChanged1, true);
  })

  it("does not invoke change listener for changes made within wake listener", function() {
    addWakeListener(objChanged1, () => willChange(objChanged1));
    addChangeListener(objChanged1, listener1);
    sinon.assert.notCalled(listener1);
  })

  it("invokes wake listener when last change listener is removed", function() {
    addWakeListener(objChanged1, listener1);
    sinon.assert.notCalled(listener1);
    addChangeListener(objChanged1, listener2);
    sinon.assert.calledOnce(listener1);
    sinon.assert.calledWith(listener1, objChanged1, true);
    removeChangeListener(objChanged1, listener2);
    sinon.assert.calledTwice(listener1);
    sinon.assert.calledWith(listener1, objChanged1, false);
  })

  it("does not invoke wake listener after it is removed", function() {
    addWakeListener(objChanged1, listener1);
    removeWakeListener(objChanged1, listener1);
    addChangeListener(objChanged1, listener2);
    sinon.assert.notCalled(listener1);
  })

  it("does not invoke change listener that is being removed because of change in wake listener", function() {
    addWakeListener(objChanged1, () => willChange(objChanged1));
    addChangeListener(objChanged1, listener1);
    removeChangeListener(objChanged1, listener1);
    sinon.assert.notCalled(listener1);
  })
})

describe("Obscure", function() {
  let listener, observed;

  beforeEach(function() {
    observed = {};
    listener = sinon.spy();
  })

  it("obscure if no change listener added", function(done) {
    addObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    setImmediate(function() {
      sinon.assert.calledOnce(listener);
      sinon.assert.calledWith(listener, observed);
      done();
    });
  })

  it("obscures only once per listener", function(done) {
    addObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    setImmediate(function() {
      sinon.assert.calledOnce(listener);
      sinon.assert.calledWith(listener, observed);

      addObscureListener(observed, () => undefined);

      setImmediate(function() {
        sinon.assert.calledOnce(listener);
        done();
      });
    });
  })

  it("does not obscure if change listener added before obscure listener", function(done) {
    addChangeListener(observed, () => undefined);
    addObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    setImmediate(function() {
      sinon.assert.notCalled(listener);
      done();
    });
  })

  it("does not obscure if change listener added after obscure listener", function(done) {
    addObscureListener(observed, listener);
    addChangeListener(observed, () => undefined);
    sinon.assert.notCalled(listener);

    setImmediate(function() {
      sinon.assert.notCalled(listener);
      done();
    });
  })

  it("obscure if all change listeners removed", function(done) {
    addObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    let changeListener = () => undefined;
    addChangeListener(observed, changeListener);
    removeChangeListener(observed, changeListener);

    setImmediate(function() {
      sinon.assert.calledOnce(listener);
      sinon.assert.calledWith(listener, observed);
      done();
    });
  })

  it("obscure if all change listeners later removed", function(done) {
    addObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    let changeListener = () => undefined;
    addChangeListener(observed, changeListener);

    setImmediate(function() {
      removeChangeListener(observed, changeListener);

      setImmediate(function() {
        sinon.assert.calledOnce(listener);
        sinon.assert.calledWith(listener, observed);
        done();
      });
    });
  })

  it("does not obscure if all change listeners later removed and added", function(done) {
    addObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    let changeListener = () => undefined;
    addChangeListener(observed, changeListener);

    setImmediate(function() {
      removeChangeListener(observed, changeListener);
      addChangeListener(observed, changeListener);

      setImmediate(function() {
        sinon.assert.notCalled(listener);
        done();
      });
    });
  })

  it("does not obscure if obscure listener removed", function(done) {
    addObscureListener(observed, listener);
    removeObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    setImmediate(function() {
      sinon.assert.notCalled(listener);
      done();
    });
  })

  it("obscures if not all obscure listeners removed", function(done) {
    let listener2 = sinon.spy();
    addObscureListener(observed, listener2);
    addObscureListener(observed, listener);
    removeObscureListener(observed, listener);
    sinon.assert.notCalled(listener);
    sinon.assert.notCalled(listener2);

    setImmediate(function() {
      sinon.assert.notCalled(listener);
      sinon.assert.calledOnce(listener2);
      done();
    });
  })

  it("does not obscure if obscure listener removed, then change listener added and removed", function(done) {
    addObscureListener(observed, listener);
    removeObscureListener(observed, listener);
    sinon.assert.notCalled(listener);

    let changeListener = () => undefined;
    addChangeListener(observed, changeListener);
    removeChangeListener(observed, changeListener);

    setImmediate(function() {
      sinon.assert.notCalled(listener);
      done();
    });
  })

  it("does not obscure if obscure listener added and removed, then change listener added", function(done) {
    addObscureListener(observed, listener);
    removeObscureListener(observed, listener);
    addChangeListener(observed, () => undefined);
    sinon.assert.notCalled(listener);

    setImmediate(function() {
      sinon.assert.notCalled(listener);
      done();
    });
  })
})
