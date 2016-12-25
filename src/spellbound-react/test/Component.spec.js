import { renderToStaticMarkup } from 'react-dom/server';
import sinon from 'sinon';
import { expect } from 'chai';

import { Observable } from '../../spellbound-core';
import React from '..';


class StatusComponent extends React.Component {
  render($) {
    let props = this.props;
    return <div>
      <h1>Hello, {$(props.name)}!</h1>
      <p>You have {$(props.count)} unread messages.</p>
      </div>;
  }
}

class TestComponent extends React.Component {
  constructor(render) {
    super();
    this.onRender = render;
  }

  render(...args) {
    return this.onRender(...args);
  }
}

describe("Component", function() {
  it("renders component to static markup", function() {
    let name = new Observable("Al");
    let count = new Observable(1);
    let component = <StatusComponent name={name} count={count}/>;
    expect(renderToStaticMarkup(component)).to.equal(
      "<div><h1>Hello, Al!</h1><p>You have 1 unread messages.</p></div>");
  })

  it("renders computed DOM", function() {
    let dom = <p>Hello</p>;
    let component = new TestComponent(() => dom);
    component.setState = sinon.spy();
    expect(component.render()).to.equal(dom);
  })

  it("calls setState when dependency changes after mounting", function() {
    let observable = new Observable(7);
    let component = new TestComponent(($) =>
      <p>Test {$(observable)}</p>
    );
    component.setState = sinon.spy();
    component.render();
    component.componentDidMount();

    sinon.assert.notCalled(component.setState);
    observable.$ = 8;
    sinon.assert.notCalled(component.setState);
    setImmediate(() => {
      sinon.assert.calledOnce(component.setState);
    });
  })

  // This is so setState is not called when server rendering: server only calls componentWillMount and not componentDidMount.
  it("does not call setState when dependency changes until mounted", function() {
    let observable = new Observable(7);
    let component = new TestComponent(($) =>
      <p>Test {$(observable)}</p>
    );
    component.setState = sinon.spy();
    component.render();

    sinon.assert.notCalled(component.setState);
    observable.$ = 8;
    sinon.assert.notCalled(component.setState);
    component.componentDidMount();
    sinon.assert.notCalled(component.setState);
    setImmediate(() => {
      sinon.assert.calledOnce(component.setState);
    });
  })

  it("does not render after unmount", function(done) {
    let observable = new Observable(7);
    let component = new TestComponent(($) =>
      <p>Test {$(observable)}</p>
    );
    component.setState = sinon.spy();
    component.render();
    component.componentDidMount();
    component.componentWillUnmount();

    sinon.assert.notCalled(component.setState);
    observable.$ = 8;

    setImmediate(function() {
      sinon.assert.notCalled(component.setState);
      done();
    });
  })
})