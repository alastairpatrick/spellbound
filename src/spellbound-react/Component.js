import RealReact from 'react';

import { guard } from '../spellbound-kernel';
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
        }, { sync: true });
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