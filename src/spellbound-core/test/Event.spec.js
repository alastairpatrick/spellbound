import sinon from 'sinon';

import { guard } from '../../spellbound-kernel';
import { Event } from '..';

describe("Event", function() {
  let event, listener;

  beforeEach(function() {
    event = new Event();
    listener = sinon.spy();
  })

  it("is not signalled by default", function() {
    guard(() => event.observe(), listener, { sync: true });
    sinon.assert.notCalled(listener); 
  })

  it("can be signalled", function() {
    guard(() => event.observe(), listener, { sync: true });
    event.signal();
    sinon.assert.calledOnce(listener); 
  })
})
