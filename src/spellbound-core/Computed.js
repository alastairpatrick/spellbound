import {
  addObscureListener,
  guard,
  willChange,
} from '../spellbound-kernel';

import { Observable, VALUE_SYMBOL } from './Observable';


const UNCOMPUTED = {
  UNCOMPUTED: "Computed value is uninitialized or stale.",
};

const GUARD_OPTIONS = {
  capture: true,
  sync: true,
};

const noWrite = (newValue) => {
  throw new Error(`Cannot write ${newValue} to unwritable computed.`); 
}

class Computed extends Observable {
  constructor(options) {
    super(UNCOMPUTED);
    this._hasDependencies = 0;

    let manualDispose;
    if (typeof options === "function") {
      this.read = options;
      this.write = noWrite;
      manualDispose = false;
    } else {
      this.read = options.read;
      this.write = options.write || noWrite;
      manualDispose = options.manualDispose;
    }

    if (!manualDispose)
      addObscureListener(this, () => this.dispose());
  }

  dispose() {
    if (this[VALUE_SYMBOL] !== UNCOMPUTED)
      throw new Error("Should be disposed");
  }

  update() {
    if (this[VALUE_SYMBOL] !== UNCOMPUTED)
      return;

    let restoreDispose = () => {
      this[VALUE_SYMBOL] = UNCOMPUTED;
      this._hasDependencies = 0;
      delete this.dispose;
    }

    let guardResult = guard(this.read, () => {
      willChange(this);
      restoreDispose();
    }, GUARD_OPTIONS);

    this[VALUE_SYMBOL] = guardResult.value;
    this._hasDependencies = guardResult.hasDependencies;
    this.dispose = () => {
      guardResult.dispose();
      restoreDispose();
    };

    return this;
  }

  get peek() {
    this.update();
    return super.peek;
  }

  get $() {
    this.update();
    return super.$;
  }

  set $(newValue) {
    this.write(newValue);
  }

  get hasDependencies() {
    this.update();
    return this._hasDependencies;
  }

  get writable() {
    return this.write !== noWrite;
  }
}

const computed = (options) => new Computed(options);

export {
  Computed,
  computed,
}
