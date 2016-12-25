import RealReact from 'react';

import { didObserve, guard, willChange } from '../spellbound-kernel';
import { unwrap } from '../spellbound-core';


const noop = () => undefined;

const UNMOUNTED = {
  MOUNTED: false,
  PENDING_SET_STATE: false,
};
const UNMOUNTED_PENDING_SETSTATE = {
  MOUNTED: false,
  PENDING_SET_STATE: true,
};
const MOUNTED = {
  MOUNTED: true,
  PENDING_SET_STATE: false, 
};

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

class Component extends RealReact.Component {
  constructor() {
    super();
   
    this._disposeGuard = noop;
    this._status = UNMOUNTED;
    
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

      let { dispose, value } = guard(
        () => original(unwrap),
        () => {
          if (this._status.MOUNTED)
            this.setState(state => state)
          else
            this._status = UNMOUNTED_PENDING_SETSTATE;
        }, { sync: false });
      this._disposeGuard = dispose;
      return value;
    });

    patch(this, 'componentDidMount', (original, ...args) => {
      if (this._status.PENDING_SET_STATE)
        this.setState(state => state);
      this._status = MOUNTED;
      return original(...args);
    });

    patch(this, 'componentWillUnmount', (original, ...args) => {
      this._disposeGuard();
      this._disposeGuard = noop;
      return original(...args);
    });
  }
}


export {
  Component,
}