import RealReact from 'react';

import { didObserve, guard, willChange } from '../spellbound-kernel';
import { unwrap } from '../spellbound-core';


const noop = () => undefined;

let patch = (obj, name, replacement) => {
  let baseMethod;
  if (typeof obj[name] === "function")
    baseMethod = obj[name];
  else
    baseMethod = noop;
  obj[name] = (...args) => {
    let original = baseMethod.bind(obj);
    return replacement(original, ...args);
  }  
}

class Component extends RealReact.PureComponent {
  constructor() {
    super();

    this._disposeGuard = noop;
    this._mounted = false;
    this.invalidate = this.invalidate.bind(this);

    let propsObservable = {};
    let props = this.props;

    Object.defineProperty(this, 'props', {
      get: function() {
        let v = props;
        didObserve(propsObservable);
        return v;
      },
      set: function(v) {
        willChange(propsObservable);
        props = v;
      },
    });

    patch(this, 'componentWillReceiveProps', (original, ...args) => {
      willChange(propsObservable);
      return original(...args);
    });

    patch(this, 'render', (original) => {
      this._disposeGuard();
      this._disposeGuard = noop;

      let { dispose, collect } = guard(
        this.invalidate,
        { sync: false });
      this._disposeGuard = dispose;
      this.collectObservations = (guarded) => collect(guarded).value;

      let { value } = collect(() => original(unwrap));
      return value;
    });

    patch(this, 'componentDidMount', (original, ...args) => {
      this.setState(state => Object.assign(state || {}, {
        dependencySerial: 0,
      }));
      this._mounted = true;
      return original(...args);
    });

    patch(this, 'componentWillUnmount', (original, ...args) => {
      this._disposeGuard();
      this._disposeGuard = noop;
      this._mounted = false;
      return original(...args);
    });
  }

  collectObservations(guarded) {
    return guarded();
  }
  
  observing(fn) {
    return (...args) => {
      return this.collectObservations(() => fn(...args));
    }
  }
  
  invalidate() {
    if (!this._mounted)
      return;
    this.setState(state => Object.assign(state || {}, {
      dependencySerial: state.dependencySerial ? state.dependencySerial + 1 : 1,
    }));
  }
}


export {
  Component,
}