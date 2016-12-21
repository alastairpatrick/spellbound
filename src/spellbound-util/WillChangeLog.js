import { setWillChange } from '../spellbound-kernel';
import { Observable } from '../spellbound-core';


class WillChangeLog {
  constructor() {
    this.operations = [];
  }

  watch(action) {
    this.operations = [];
    let old = setWillChange((object, propertyName) => {
      if (object instanceof Observable) {
        let oldValue = object.peek;
        if (propertyName !== undefined)
          oldValue = oldValue[propertyName];
          
        this.operations.push({
          observable: object,
          propertyName: propertyName,
          oldValue: oldValue,
        });
      }
      
      old(object, propertyName);
    });

    try {
      action();
    } finally {
      setWillChange(old);
    }
  }

  undo() {
    for (let i = this.operations.length - 1; i >= 0; --i) {
      let { observable, propertyName, oldValue } = this.operations[i];
      if (propertyName === undefined)
        observable.$ = oldValue;
      else
        observable[propertyName] = oldValue;
    }
    this.operations = [];
  }
}

export {
  WillChangeLog,
}
