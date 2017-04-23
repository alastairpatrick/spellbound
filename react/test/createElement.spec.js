const { expect } = require('chai');

const { observable } = require('../../core');
const React = require('..');


class TestComponent extends React.Component {
  render() {
    return <p {...this.props}></p>;
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
    let value = observable("foo");
    let element = <p className={value}/>;
    expect(element.type).to.equal("p");
    expect(element.props).to.deep.equal({ className: "foo" });
  })

  it("unwraps observable children for elements", function() {
    let value = observable("foo");
    let element = <p>{value}</p>;
    expect(element.type).to.equal("p");
    expect(element.props.children).to.deep.equal("foo");
  })

  it("does not unwrap observable attributes for components", function() {
    let value = observable("foo");
    let element = <TestComponent attr={value}></TestComponent>;
    expect(element.type).to.equal(TestComponent);
    expect(element.props).to.deep.equal({ attr: value });
  })

  it("does not unwrap observable children for components", function() {
    let value = observable("foo");
    let element = <TestComponent>{value}</TestComponent>;
    expect(element.type).to.equal(TestComponent);
    expect(element.props.children).to.deep.equal(value);
  })

  it("unwraps value attribute of input element", function() {
    let value = observable("hello");
    let element = <input type="text" value={value}/>
    expect(element.props.value).to.equal("hello");
  })

  it("unwraps checked attribute of input element", function() {
    let checked = observable(true);
    let element = <input type="checkbox" checked={checked}/>;
    expect(element.props.checked).to.be.true;
  })

  it("writes to value observable on change", function() {
    let value = observable("hello");
    let element = <input type="text" value={value}/>;

    let target = {
      value: "there",
    };
    element.props.onChange({
      target: target,
    });
    expect(value.$).to.equal("there");
  })

  it("writes to checked observable on change", function() {
    let checked = observable(true);
    let element = <input type="checkbox" checked={checked}/>;

    let target = {
      checked: false,
    };
    element.props.onChange({
      target: target,
    });
    expect(checked.$).to.equal(false);
  })

  it("explicit onChange handler called before change if writable value", function() {
    let value = observable("hello");
    let newValue, oldValue;
    let element = <input type="text" value={value} onChange={(event) => {
      newValue = event.target.value;
      oldValue = value.$;
    }}/>;

    let target = {
      value: "there",
    };
    let event = {
      target: target,
      defaultPrevented: false,
    };
    element.props.onChange(event);
    expect(newValue).to.equal("there");
    expect(oldValue).to.equal("hello");
  })

  it("onChange handler can prevent change to value", function() {
    let value = observable("hello");
    let element = <input type="text" value={value} onChange={(event) => {
      event.preventDefault();
    }}/>;

    let target = {
      value: "there",
    };
    let event = {
      target: target,
      defaultPrevented: false,
      preventDefault: () => {
        event.defaultPrevented = true;
      },
    };
    element.props.onChange(event);
    expect(value.$).to.equal("hello");
  })
})
