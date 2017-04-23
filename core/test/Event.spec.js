const sinon = require('sinon');

const { guard } = require('../../kernel');
const { Event } = require('..');

describe("Event", function() {
  let event, listener;

  beforeEach(function() {
    event = new Event();
    listener = sinon.spy();
  })

  it("is not signalled by default", function() {
    guard(listener, { sync: true }).collect(() => event.observe());
    sinon.assert.notCalled(listener); 
  })

  it("can be signalled", function() {
    guard(listener, { sync: true }).collect(() => event.observe());
    event.signal();
    sinon.assert.calledOnce(listener); 
  })
})
