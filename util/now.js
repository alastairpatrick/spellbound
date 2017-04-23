
const { hasChangeListeners } = require('../kernel');
const { Computed, Event } = require('../core');

const MIN_DELAY = 1;

const roundDown = (now, precision) => Math.floor(now / precision) * precision;
const roundUp = (now, precision) => Math.ceil(now / precision) * precision;


class Clock {
  constructor(precision = 1000) {
    this.precision = precision;
    this.timeoutId = undefined;

    this.event = new Event();
    this.observable = new Computed(() => {
      this.schedule();
      this.event.observe();
      let now = Date.now();
      return roundDown(now, this.precision);
    });
  }

  dispose() {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  schedule() {
    if (this.timeoutId !== undefined)
      return;

    let now = Date.now();
    let scheduleTime = roundUp(now, this.precision);
    let scheduleDelay = Math.max(MIN_DELAY, scheduleTime - now);
    this.timeoutId = setTimeout(() => {
      this.timeoutId = undefined;
      this.event.signal();
      if (hasChangeListeners(this.observable))
        this.schedule();
    }, scheduleDelay);
  }
}

const now = {
  seconds: new Clock(1000).observable,
  minutes: new Clock(60 * 1000).observable,
  hours: new Clock(24 * 60 * 1000).observable,
}

module.exports = {
  Clock,
  now,
}
