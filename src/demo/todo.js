import cx from 'classnames';
import { Router } from 'director';
import ReactDOM from 'react-dom';

import React from '../spellbound-react';
import { computed, observable, mutate } from '../spellbound-core';


const todos = observable([]);
const newTodoTitle = observable("");
let todoId = 0;

const FILTER_ALL = () => true;
const FILTER_COMPLETED = (todo) => todo.completed.$;
const FILTER_ACTIVE = (todo) => !todo.completed.$;

const todosCompleted = computed(() => {
  return todos.$.filter(todo => todo.completed.$);
});

const todosRemaining = computed(() => {
  return todos.$.filter(todo => !todo.completed.$);
});

class Todo {
  constructor(title) {
    this.id = ++todoId;
    this.title = observable(title || "");
    this.completed = observable(false);
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.completed.$ = !this.completed.$;
  }
}

class TodoItem extends React.Component {
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
        <input
          className="toggle"
          type="checkbox"
          checked={ props.todo.completed }
        />
        <label
          onDoubleClick={ this.beginEdit.bind(this) }
        >
          { props.todo.title }
        </label>
        <button
          className="destroy"
          onClick={ this.remove.bind(this) }
        >
        </button>
      </div>
      <input
        ref="input"
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
    let idx = todos.$.indexOf(this.props.todo);
    if (idx >= 0) {
      mutate((todos) => {
        todos.$.splice(idx, 1);
      }, todos);
    }
  }

  static createOnEnter(event) {
    if (event.key === "Enter" && newTodoTitle.$.trim().length) {
      mutate((todos) => {
        todos.$.push(new Todo(newTodoTitle.$));
      }, todos);

      newTodoTitle.$ = "";
    }
  }
}

class Stats extends React.Component {
  render() {
    let props = this.props;

    let clearButton;
    if (todosCompleted.$.length) {
      clearButton = <button
        className="clear-completed"
        onClick={ this.onClearAll.bind(this) }
      >
        Clear completed
      </button>;
    }

    return <div>
      <span className="todo-count">
        <strong>{ todosRemaining.$.length }</strong> { todosRemaining.$.length === 1 ? 'item' : 'items' } left
      </span>
      <ul className="filters">
        <li>
          <a className={ cx({selected: props.todoFilter.$ === FILTER_ALL}) } href="#/">All</a>
        </li>
        <li>
          <a className={ cx({selected: props.todoFilter.$ === FILTER_ACTIVE}) } href="#/active">Active</a>
        </li>
        <li>
          <a className={ cx({selected: props.todoFilter.$ === FILTER_COMPLETED}) } href="#/completed">Completed</a>
        </li>
      </ul>
      { clearButton }
    </div>
  }

  onClearAll() {
    todos.$ = todosRemaining.$;
  }
}

class App extends React.Component {
  constructor() {
    super();

    this.todoFilter = observable(FILTER_ALL);
    this.todoFiltered = computed(() => {
      let filter = this.todoFilter.$;
      return todos.$.filter(filter);
    });
    
    this.footerStyle = computed(() => {
      let result = {};
      if (todos.$.length === 0)
        result.display = "none";
      return result;
    });

    this.allComplete = computed({
      read: () => !todosRemaining.$.length,
      write: (v) => {
        todos.$.forEach(todo => {
          todo.completed.$ = Boolean(v);
        });
      },
    });
  }

  componentDidMount() {
    let router = Router({
      '/': () => {
        this.todoFilter.$ = FILTER_ALL;
      },
      '/active': () => {
        this.todoFilter.$ = FILTER_ACTIVE;
      },
      '/completed': () => {
        this.todoFilter.$ = FILTER_COMPLETED;
      },
    });
    router.init('/');
  }

  render() {
    return <div>
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <input className="new-todo" placeholder="What needs to be done?" autoFocus value={newTodoTitle} onKeyPress={TodoItem.createOnEnter} />
        </header>
        <section className="main">
          <input className="toggle-all" id="toggle-all" type="checkbox" checked={this.allComplete}/>
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul className="todo-list">
            {this.todoFiltered.$.map(todo => <TodoItem key={todo.id} todo={todo} />)}
          </ul>
        </section>
        <footer className="footer" style={this.footerStyle}>
          <Stats todoFilter={ this.todoFilter }/>
        </footer>
      </section>
    </div>;
  }
}

ReactDOM.render(
  <App/>,
  document.getElementById("main")
);
