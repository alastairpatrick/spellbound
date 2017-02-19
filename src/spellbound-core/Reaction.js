import { guard } from '../spellbound-kernel';


const noop = () => undefined;


class Reaction {
  constructor() {
    this._changeTime = Infinity;
    this._disposeGuard = noop;
    this._timeoutId = undefined;
  }

  dispose() {
    if (this._timeoutId !== undefined) {
      clearTimeout(this._timeoutId);
      this._timeoutId = undefined;
    }

    this._disposeGuard();
    this._disposeGuard = noop;
  }

  evaluate(read, when, opts = {}) {
    let options = Object.assign({
      minDelay: -Infinity,
      maxDelay: Infinity,
      fireImmediately: false,
      capture: true,
    }, opts);

    this.dispose();

    let guardResult;
    this._disposeGuard = () => {
      throw new Error("Cannot dispose Reaction within read().");
    };
    try {
      guardResult = guard(() => {
        this.evaluate(read, when, options);
      }, {
        capture: options.capture,
      }).collect(read);
    } finally {
      this._disposeGuard = noop;
    }

    if (options.fireImmediately) {
      let now = Date.now();
      this._changeTime = Math.min(this._changeTime, now);
      let delay = Math.max(0, Math.min(options.minDelay, this._changeTime + options.maxDelay - now));
      this._timeoutId = setTimeout(() => {
        this._changeTime = Infinity;
        when(guardResult.value, this);
      }, delay);
    }
    options.fireImmediately = true;

    this._disposeGuard = guardResult.dispose;
    return this;
  }
}

const reaction = (read, when, options) => {
  return new Reaction().evaluate(read, when, options);
}

export {
  Reaction,
  reaction,
}
