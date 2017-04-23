const { expect } = require('chai');

const { guard } = require('../../spellbound-kernel');
const { Clock } = require('..');


describe("Clock", function() {
  let clock, observable;

  beforeEach(function() {
    clock = new Clock(1);
    observable = clock.observable;
  });

  afterEach(function() {
    clock.dispose();
  });

  it("defaults to numeric time", function() {
    expect(observable.$).to.be.at.least(0);
  })

  it("eventually updates", function(done) {
    let startTime;
    guard(() => {
      setTimeout(() => {
        let endTime = observable.$;
        expect(endTime - startTime).to.be.at.least(1);
        done();
      }, 2);
    }, { sync: true }).collect(() => {
      startTime = observable.$;
    });
  })

  it("reports same time until control returns to event loop", function() {
    let startTime = observable.$;
    while (Date.now() <= startTime + 1);
    expect(observable.$).to.equal(startTime);
  })

  it("keeps updating", function(done) {
    guard(() => {
      setImmediate(() => {
        guard(() => {
            done();
          }, { sync: true }).collect(() => {
            let ignored = observable.$;
          });
      });
    }, { sync: true }).collect(() => {
      let ignored = observable.$;
    });
  })

  it("automatically shuts down when it becomes obscure", function(done) {
    guard(() => undefined, { sync: true }).collect(() => {
      let ignored = observable.$;
    });
    expect(clock.timeoutId).to.be.ok;

    setTimeout(() => {
      expect(clock.timeoutId).to.not.be.ok;
      done();
    }, 2);
  })

  it("automatically starts back up again when it ceases to be obscure", function(done) {
    let startTime;
    guard(() => undefined, { sync: true }).collect(() => {
      startTime = observable.$;
    });
    expect(clock.timeoutId).to.be.ok;

    setTimeout(() => {
      expect(clock.timeoutId).to.not.be.ok;
      let endTime = observable.$; 
      expect(endTime - startTime).to.be.at.least(1);
      done();
    }, 2);
  })
})
