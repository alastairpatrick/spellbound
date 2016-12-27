import sinon from 'sinon';
import { expect } from 'chai';

import { collectObservations, addChangeListener, removeChangeListener } from '../../spellbound-kernel';
import { Observable, isObservable, isWritableObservable, mutate, unwrap } from '..';


describe("Observable", function() {
  let changeListener, observable;

  beforeEach(function() {
    observable = new Observable("initial");
    changeListener = sinon.spy();
    addChangeListener(observable, changeListener);
  });

  afterEach(function() {
    removeChangeListener(observable, changeListener);
  });

  it("isObservable", function() {
    expect(isObservable(observable)).to.be.true;
    expect(isObservable({})).to.be.false;
    expect(isObservable(null)).to.be.false;
    expect(isObservable(undefined)).to.be.false;
    expect(isObservable(1)).to.be.false;
    expect(isObservable(() => undefined)).to.be.false;
  })

  it("isWritableObservable", function() {
    expect(isWritableObservable(observable)).to.be.true;
    expect(isWritableObservable({})).to.be.false;
    expect(observable.writable).to.be.true;
    expect(isWritableObservable(null)).to.be.false;
    expect(isWritableObservable(undefined)).to.be.false;
  })

  it("is undefined by default", function() {
    expect(new Observable().peek).to.be.undefined;
    expect(new Observable().$).to.be.undefined;
  })

  it("has infinite dependencies", function() {
    expect(new Observable().hasDependencies).to.equal(Infinity);
  })

  it("can be constructed with initial value", function() {
    expect(observable.peek).to.equal("initial");
    expect(observable.$).to.equal("initial");
    expect(observable.valueOf()).to.equal("initial");
    expect(observable.toString()).to.equal("initial");
  })

  it("converts to value", function() {
    observable = new Observable(1);
    expect(observable.valueOf()).to.equal(1);
  })

  it("can be used in arithmetic expressions", function() {
    let observable1 = new Observable(1);
    let observable2 = new Observable(2);
    expect(observable1 + observable2).to.equal(3);
  })

  it("converts to string", function() {
    observable = new Observable(1);
    expect(observable.toString()).to.equal("1");
  })

  it("observes when read", function() {
    let listener = sinon.spy();
    collectObservations(() => {
      expect(observable.$).to.equal("initial");
    }, listener);
    sinon.assert.calledOnce(listener);
    sinon.assert.calledWith(listener, observable);
  })

  it("observes when unwrapped", function() {
    let listener = sinon.spy();
    collectObservations(() => {
      expect(unwrap(observable)).to.equal("initial");
    }, listener);
    sinon.assert.calledOnce(listener);
    sinon.assert.calledWith(listener, observable);
  })

  it("does not observe when peeked", function() {
    let listener = sinon.spy();
    collectObservations(() => {
      expect(observable.peek).to.equal("initial");
    }, listener);
    sinon.assert.notCalled(listener);
  })

  it("changes when written", function() {
    sinon.assert.notCalled(changeListener);
    observable.$ = "newValue";
    sinon.assert.calledOnce(changeListener);
  })

  it("does not change when equal value written", function() {
    sinon.assert.notCalled(changeListener);
    observable.$ = "initial";
    sinon.assert.notCalled(changeListener);
  })

  it("does not change when equal null value written", function() {
    observable.$ = null;
    sinon.assert.calledOnce(changeListener);
    observable.$ = null;
    sinon.assert.calledOnce(changeListener);
  })

  it("change when array written, even if identical", function() {
    observable.$ = [];
    sinon.assert.calledOnce(changeListener);
    observable.$ = observable.peek;
    sinon.assert.calledTwice(changeListener);
  })

  it("change when object written, even if identical", function() {
    observable.$ = {};
    sinon.assert.calledOnce(changeListener);
    observable.$ = observable.peek;
    sinon.assert.calledTwice(changeListener);
  })

  it("can unwrap non-observables", function() {
    expect(unwrap(1)).to.equal(1);
    expect(unwrap({a: 1})).to.deep.equal({a: 1});
    expect(unwrap(null)).to.be.null;
    expect(unwrap(undefined)).to.be.undefined;
  });

  it("can bulk unwrap", function() {
    let listener = sinon.spy();
    observable.$ = [1, 2, 3];

    let result = collectObservations(() => {
      return unwrap.within((observable, initial) => {
        let sum = initial;
        for (let i = 0; i < observable.length; ++i)
          sum += observable[i];
        return sum;
      }, observable, 4);
    }, listener);

    expect(result).to.equal(10);
    sinon.assert.calledOnce(listener);
    sinon.assert.calledWith(listener, observable);
  })  

  it("can mutate multiple", function() {
    let odd = new Observable([]);
    let even = [];
    
    let count = mutate((odd, even) => {
      let result = 0;
      [1, 2, 3, 4, 5].forEach(n => {
        ++result;
        if (n % 2 === 0)
          even.$.push(n);
        else
          odd.$.push(n);
      });
      return result;
    }, odd, even);

    expect(odd.$).to.deep.equal([1, 3, 5]);
    expect(even).to.deep.equal([2, 4]);
    expect(count).to.equal(5);
  })  

  it("can replace multiple", function() {
    let odd = new Observable([]);
    let even = new Observable([]);
    
    let count = mutate((odd, even) => {
      let result = 0;
      [1, 2, 3, 4, 5].forEach(n => {
        ++result;
        if (n % 2 === 0)
          even.$ = even.$.concat(n);
        else
          odd.$ = odd.$.concat(n);
      });
      return result;
    }, odd, even);

    expect(odd.$).to.deep.equal([1, 3, 5]);
    expect(even.$).to.deep.equal([2, 4]);
    expect(count).to.equal(5);
  })  
})
