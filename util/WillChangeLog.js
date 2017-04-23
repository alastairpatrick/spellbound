const { setWillChange } = require('../kernel');
const { Observable } = require('../core');


class WillChangeLog {
  constructor() {
    this.operations = [];
  }

  watch(action) {
    this.operations = [];
    let old = setWillChange((object) => {
      if (object instanceof Observable) {
        let oldValue = object.peek;
          
        this.operations.push({
          observable: object,
          oldValue: oldValue,
        });
      }
      
      old(object);
    });

    try {
      action();
    } finally {
      setWillChange(old);
    }
  }

  undo() {
    for (let i = this.operations.length - 1; i >= 0; --i) {
      let { observable, oldValue } = this.operations[i];
      observable.$ = oldValue;
    }
    this.operations = [];
  }
}

module.exports = {
  WillChangeLog,
}
