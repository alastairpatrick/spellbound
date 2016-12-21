import RealReact from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';

import { Observable } from '../../spellbound-core';
import React from '..';


class TestComponent extends RealReact.Component {
  constructor(render) {
    super();
    this.onRender = render;
  }

  render(...args) {
    return this.onRender(...args);
  }
}

describe("createElement", function() {
  it("creates element", function() {
    let element = <p attr="foo"/>;
    expect(element.props.attr).to.equal("foo");
    expect(element).to.be.ok;
  })

  it("creates component", function() {
    let component = <TestComponent attr="foo"/>;
    expect(component.props.attr).to.equal("foo");
  })

  it("unwraps observable attributes for elements", function() {
    let observable = new Observable("foo");
    let element = <p className={observable}/>;
    expect(renderToStaticMarkup(element)).to.equal(
      '<p class="foo"></p>');
  })

  it("unwraps observable children for elements", function() {
    let observable = new Observable("foo");
    let element = <p>{observable}</p>;
    expect(renderToStaticMarkup(element)).to.equal(
      '<p>foo</p>');
  })
})
