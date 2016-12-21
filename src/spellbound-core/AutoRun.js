import { guard } from '../spellbound-kernel';


const noop = () => undefined;

class AutoRun {
  constructor() {
    this._disposeGuard = noop;
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
        action(this);
      }, () => {
        this.run(action);
      }, {
        capture: options.capture,
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

export {
  AutoRun,
  autorun,
}
