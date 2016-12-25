import cx from 'classnames';

import { computed, observable } from '../../spellbound-core';
import React from '../../spellbound-react';

import { todos } from './model';


class TodoView extends React.Component {
  constructor() {
    super();

    this.editText = observable("");
    this.editMode = observable(false);
    this.className = computed(() => cx({
      editing: this.editMode.$,
      completed: this.props.todo.completed.$,
    }));
  }

  render() {
    let props = this.props;
    return <li className={ this.className }>
             <div className="view">
               <input className="toggle"
                     type="checkbox"
                     checked={ props.todo.completed }
               />
               <label onDoubleClick={ this.beginEdit.bind(this) }
               >
                 { props.todo.title }
               </label>
               <button className="destroy"
                       onClick={ this.remove.bind(this) }
               >
               </button>
             </div>
             <input ref="input"
                   className="edit"
                   value={ this.editText }
                   onBlur={ this.onBlur.bind(this) }
                   onKeyPress={ this.onKeyPress.bind(this) }
                   onKeyDown={ this.onKeyDown.bind(this) }
             />
           </li>
  }

  beginEdit() {
    this.editMode.$ = true;
    this.editText.$ = this.props.todo.title.$;
    setImmediate(() => {
      this.refs.input.focus();
    });
  }

  onBlur() {
    this.editMode.$ = false;
    if (this.editText.$.length)
      this.props.todo.title.$ = this.editText.$;
  }

  onKeyPress(event) {
    if (event.key === "Enter")
      this.refs.input.blur();
  }

  onKeyDown(event) {
    if (event.key === "Escape") {
      this.editText.$ = "";
      this.refs.input.blur();
    }
  }

  remove() {
    todos.remove(this.props.todo);
  }
}

export {
  TodoView,
}