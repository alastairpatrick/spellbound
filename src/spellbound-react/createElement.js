const RealReact = require('react');

const { unwrap, isWritableObservable } = require('../spellbound-core');

const WRITABLE_PROPERTIES = ["value", "checked"];

const has = Object.prototype.hasOwnProperty;

const createElement = (type, props, ...children) => {
  let unwrappedProps = props;
  let unwrappedChildren = children;
  if (typeof type === "string") {
    unwrappedProps = {};
    for (let n in props) {
      if (has.call(props, n))
        unwrappedProps[n] = unwrap(props[n]);
    }
    unwrappedChildren = children.map(unwrap);

    let writables = {};
    let wantsChangeHandler = false;
    if (props) {
      WRITABLE_PROPERTIES.forEach(n => {
        if (isWritableObservable(props[n])) {
          writables[n] = props[n];
          wantsChangeHandler = true;
        }
      });
    }

    if (wantsChangeHandler) {
      let onChange = unwrappedProps.onChange;
      unwrappedProps.onChange = function(event) {
        if (onChange)
          onChange.apply(this, arguments);
        if (!event.defaultPrevented) {
          WRITABLE_PROPERTIES.forEach(n => {
            if (has.call(writables, n))
              writables[n].$ = event.target[n];
          });
        }
      };
    }
  }

  return RealReact.createElement(type, unwrappedProps, ...unwrappedChildren);
}

module.exports = {
  createElement,
}
