const sinon = require('sinon');
const { expect } = require('chai');

const { addChangeListener, collectObservations } = require('../../spellbound-kernel');
const { Computed, Observable, isObservable, isWritableObservable, unwrap } = require('..');

describe("Computed", function() {
  let computed, observable, read;

  beforeEach(function() {
    observable = new Observable(1);
    read = sinon.spy();
    computed = new Computed(() => {
      read();
      return observable.$ + 1;
    }); 
  });

  it("isObservable", function() {
    expect(isObservable(computed)).to.be.true;
  })

  it("isWriteableObservable", function() {
    expect(isWritableObservable(computed)).to.be.false;
  })

  it("can be configured with write function", function() {
    let target;
    computed = new Computed({
      read: () => 1,
      write: (v) => {
        target = v;
      },
    });
    expect(computed.$).to.equal(1);
    computed.$ = 123;
    expect(target).to.equal(123);
    expect(isWritableObservable(computed)).to.be.true;
  })

  it("can be evaluated", function() {
    expect(computed.$).to.equal(2);
  })

  it("counts dependencies", function() {
    expect(new Computed(() => 1).hasDependencies).to.equal(0);
    expect(computed.hasDependencies).to.equal(1);
  })

  it("is reevaluated after dependency changes", function() {
    observable.$ = 2;
    expect(computed.$).to.equal(3);
  })

  it("is reevaluated after indirect dependency changes", function() {
    let computed2 = new Computed(() => computed.$ + 1);
    expect(computed2.$).to.equal(3);
    observable.$ = 2;
    expect(computed2.$).to.equal(4);
  })

  it("throws exception on circular dependency", function() {
    let computed2;
    let computed1 = new Computed(() => computed2.$ + 1);
    computed2 = new Computed(() => computed1.$ + 1);
    expect(function() {
      let ignored = computed2.$;
    }).to.throw();
  })

  it("is not reevaluated if dependency does not change", function() {
    expect(computed.$).to.equal(2);
    expect(computed.$).to.equal(2);
    sinon.assert.calledOnce(read);
  })

  it("observes when read", function() {
    let listener = sinon.spy();
    collectObservations(() => {
      expect(computed.$).to.equal(2);
    }, listener);
    sinon.assert.calledOnce(listener);
    sinon.assert.calledWith(listener, computed);
  })

  it("observes when unwrapped", function() {
    let listener = sinon.spy();
    collectObservations(() => {
      expect(unwrap(computed)).to.equal(2);
    }, listener);
    sinon.assert.calledOnce(listener);
    sinon.assert.calledWith(listener, computed);
  })

  it("does not observe when peeked", function() {
    let listener = sinon.spy();
    collectObservations(() => {
      expect(computed.peek).to.equal(2);
    }, listener);
    sinon.assert.notCalled(listener);
  })

  it("can be reevaluated after dispose", function() {
    computed.update();
    sinon.assert.calledOnce(read);
    computed.dispose();
    sinon.assert.calledOnce(read);
    expect(computed.$).to.equal(2);
    sinon.assert.calledTwice(read);
  })

  it("is automatically reevaluated after becoming obscure", function(done) {
    expect(computed.$).to.equal(2);
    sinon.assert.calledOnce(read);

    setImmediate(function() {
      expect(computed.$).to.equal(2);
      sinon.assert.calledTwice(read);
      done();
    });
  })

  it("is not reevaluated in manual disposal mode", function(done) {
    computed = new Computed({
      read: computed.read,
      manualDispose: true,
    });

    expect(computed.$).to.equal(2);
    sinon.assert.calledOnce(read);

    setImmediate(function() {
      expect(computed.$).to.equal(2);
      sinon.assert.calledOnce(read);
      done();
    });
  })

  it("is not reevaluate if has change listeners", function(done) {
    expect(computed.$).to.equal(2);
    sinon.assert.calledOnce(read);

    let listener = sinon.spy();
    addChangeListener(computed, listener);

    setImmediate(function() {
      expect(computed.$).to.equal(2);
      sinon.assert.calledOnce(read);
      done();
    });
  })

  it("sleeps multiple computeds in one pass", function(done) {
    let read2 = sinon.spy();
    let computed2 = new Computed(() => {
      read2();
      return computed.$ + 1;
    });

    expect(computed.$).to.equal(2);
    expect(computed2.$).to.equal(3);
    sinon.assert.calledOnce(read);
    sinon.assert.calledOnce(read2);
    
    setImmediate(function() {
      expect(computed.$).to.equal(2);
      expect(computed2.$).to.equal(3);
      sinon.assert.calledTwice(read);
      sinon.assert.calledTwice(read2);
      done();
    });
  })
})
