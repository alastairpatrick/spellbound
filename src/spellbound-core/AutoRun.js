const { guard } = require('../spellbound-kernel');


const noop = () => undefined;

class AutoRun {
  constructor() {
    this._disposeGuard = noop;
    this.count = 0;
  }

  dispose() {
    this._disposeGuard();
    this._disposeGuard = noop;
  }

  run(action, options = {}) {
    let dispose = noop;

    let disposedInAction = false;
    this._disposeGuard = () => {
      disposedInAction = true;
    }
    try {
      dispose = guard(() => {
        this.run(action);
      }, {
        capture: options.capture,
      }).collect(() => {
        action(this);
        ++this.count;
      }).dispose;
    } finally {
      if (disposedInAction) {
        dispose();
        this._disposeGuard = noop;
      } else {
        this._disposeGuard = dispose;
      }
    }

    return this;
  }
}

const autorun = (action) => new AutoRun().run(action);

module.exports = {
  AutoRun,
  autorun,
}
