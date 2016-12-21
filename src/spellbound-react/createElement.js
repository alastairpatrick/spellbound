import RealReact from 'react';

import { unwrap, isObservable } from '../spellbound-core';
import { Component } from './Component';

const has = Object.prototype.hasOwnProperty;

class ObservableUnwrapper extends Component {
  render() {
    let { type, props, children } = this.props;
    
    let unwrappedProps = {};
    for (let n in props) {
      if (has.call(props, n))
        unwrappedProps[n] = unwrap(props[n]);
    }

    let unwrappedChildren = children.map(unwrap);
    return RealReact.createElement(type, unwrappedProps, ...unwrappedChildren);
  }
}

ObservableUnwrapper.displayName = "ObservableUnwrapper";


const createElement = (type, props, ...children) => {
  let hasObservables = false;
  for (let n in props) {
    if (has.call(props, n)) {
      if (isObservable(props[n])) {
        hasObservables = true;
        break;
      }
    }
  }
  if (!hasObservables) {
    for (let i = 0; i < children.length; ++i) {
      if (isObservable(children[i])) {
        hasObservables = true;
        break;
      }
    }
  }

  if (!hasObservables)
    return RealReact.createElement(type, props, ...children);

  return RealReact.createElement(
    ObservableUnwrapper,
    { type, props, children });
}

export {
  createElement,
}
