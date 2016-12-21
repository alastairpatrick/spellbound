import { didObserve, willChange } from '../spellbound-kernel';

class Event {
  observe() {
    didObserve(this);
  }

  signal() {
    willChange(this);
  }
}

export {
  Event
}
