const sinon = require('sinon');
const { expect} = require('chai');
const { TaskQueue } = require('..');


describe("TaskQueue", function() {
  afterEach(function(done) {
    setImmediate(function() {
      done();
    });
  })

  it("can schedule task that runs asynchronously", function(done) {
    let instance = new TaskQueue(0);
    let spy = sinon.spy();

    instance.schedule(spy);
    
    sinon.assert.notCalled(spy);

    setImmediate(function() {
      sinon.assert.calledOnce(spy);
      done();
    });
  })

  it("runs tasks on same queue in the order they are scheduled", function(done) {
    let instance = new TaskQueue(0);
    let nums = [];
    
    instance.schedule(() => nums.push(1));
    instance.schedule(() => nums.push(2));
    instance.schedule(() => nums.push(3));

    setImmediate(function() {
      expect(nums).to.deep.equal([1, 2, 3]);
      done();
    });
  })

  it("runs tasks in the order of their queue priority", function(done) {
    let instance2 = new TaskQueue(2);
    let instance1 = new TaskQueue(1);
    let instance3 = new TaskQueue(3);
    let nums = [];
    
    instance3.schedule(() => nums.push(3));
    instance1.schedule(() => nums.push(1));
    instance2.schedule(() => nums.push(2));

    setImmediate(function() {
      expect(nums).to.deep.equal([1, 2, 3]);
      done();
    });
  })

  it("runs tasks on different queues with the same priority in order of first task being scheduled", function(done) {
    let instance3 = new TaskQueue(1);
    let instance2 = new TaskQueue(1);
    let instance1 = new TaskQueue(1);
    let nums = [];
    
    instance3.schedule(() => nums.push(1));
    instance1.schedule(() => nums.push(2));
    instance2.schedule(() => nums.push(3));

    setImmediate(function() {
      expect(nums).to.deep.equal([1, 2, 3]);
      done();
    });
  })

  it("can schedule more tasks after tasks run", function(done) {
    let instance2 = new TaskQueue(2);
    let instance1 = new TaskQueue(1);
    let instance3 = new TaskQueue(3);
    let nums = [];
    
    instance3.schedule(() => nums.push(30));
    instance1.schedule(() => nums.push(10));
    instance2.schedule(() => nums.push(20));
    instance3.schedule(() => nums.push(31));
    instance1.schedule(() => nums.push(11));
    instance2.schedule(() => nums.push(21));

    setImmediate(function() {
      expect(nums).to.deep.equal([10, 11, 20, 21, 30, 31]);

      instance1.schedule(() => nums.push('X'));
      setImmediate(function() {
        expect(nums).to.deep.equal([10, 11, 20, 21, 30, 31, 'X']);
        done();
      });
    });
  })

  it("can schedule task on same queue within running task", function(done) {
    let instance = new TaskQueue(1);
    let spy = sinon.spy();
    instance.schedule(() => {
      instance.schedule(spy);
    });
    sinon.assert.notCalled(spy);

    setImmediate(function() {
      sinon.assert.calledOnce(spy);
      done();
    });
  })

  it("can schedule task on later queue within running task", function(done) {
    let instance1 = new TaskQueue(1);
    let instance2 = new TaskQueue(2);
    let spy = sinon.spy();
    instance1.schedule(() => {
      instance2.schedule(spy);
    });
    sinon.assert.notCalled(spy);
    
    setImmediate(function() {
      sinon.assert.calledOnce(spy);
      done();
    });
  })

  it("can schedule task on earlier queue within running task", function(done) {
    let instance1 = new TaskQueue(1);
    let instance2 = new TaskQueue(2);
    let spy = sinon.spy();
    instance2.schedule(() => {
      instance1.schedule(spy);
    });
    sinon.assert.notCalled(spy);
    
    setImmediate(function() {
      sinon.assert.calledOnce(spy);
      done();
    });
  })

  it("can dispose task", function(done) {
    let instance = new TaskQueue(0);
    let spy = sinon.stub().returns(1);

    let task = instance.schedule(spy);
    task.dispose();

    setImmediate(function() {
      sinon.assert.notCalled(spy);
      done();
    });
  })

  it("can dispose task within its own handler", function(done) {
    let instance = new TaskQueue(0);
    let task = instance.schedule(() => task.dispose());

    setImmediate(function() {
      done();
    });
  })
})
