import { Router } from 'director';
import ReactDOM from 'react-dom';

import { computed, observable } from '../../spellbound-core';
import React from '../../spellbound-react';

import { Todo, todos } from './model';
import { StatsView } from './StatsView';
import { TodoView } from './TodoView';


class AppView extends React.Component {
  constructor() {
    super();

    this.newTodoTitle = observable("");

    this.todoFilter = observable("all");
    this.todoFiltered = computed(() => todos[this.todoFilter.$].$);
    
    this.footerStyle = computed(() => {
      let result = {};
      if (todos.all.$.length === 0)
        result.display = "none";
      return result;
    });

    this.allComplete = computed({
      read: () => !todos.active.$.length,
      write: (v) => {
        todos.all.$.forEach(todo => {
          todo.completed.$ = Boolean(v);
        });
      },
    });
  }

  componentDidMount() {
    let router = Router({
      '/': () => {
        this.todoFilter.$ = "all";
      },
      '/active': () => {
        this.todoFilter.$ = "active";
      },
      '/completed': () => {
        this.todoFilter.$ = "completed";
      },
    });
    router.init('/');
  }

  render() {
    return <div>
             <section className="todoAppView">
               <header className="header">
                 <h1>todos</h1>
                 <input className="new-todo"
                       placeholder="What needs to be done?"
                       autoFocus
                       value={ this.newTodoTitle }
                       onKeyPress={ this.createOnEnter.bind(this) }
                 />
               </header>
               <section className="main">
                 <input className="toggle-all"
                       id="toggle-all"
                       type="checkbox"
                       checked={ this.allComplete }/>
                 <label htmlFor="toggle-all">Mark all as complete</label>
                 <ul className="todo-list">
                   {this.todoFiltered.$.map(todo => <TodoView key={todo.id} todo={todo} />)}
                 </ul>
               </section>
               <footer className="footer" style={this.footerStyle}>
                 <StatsView todoFilter={ this.todoFilter }/>
               </footer>
             </section>
           </div>;
  }

  createOnEnter(event) {
    if (event.key === "Enter" && this.newTodoTitle.$.trim().length) {
      todos.add(new Todo(this.newTodoTitle.$));
      this.newTodoTitle.$ = "";
    }
  }
}

ReactDOM.render(
  <AppView/>,
  document.getElementById("main")
);
