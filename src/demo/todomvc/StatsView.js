const cx = require('classnames');

const React = require('../../spellbound-react');

const { todos } = require('./model');


class StatsView extends React.Component {
  render() {
    let props = this.props;

    let clearButton;
    if (todos.active.$.length) {
      clearButton = <button className="clear-completed"
                            onClick={ this.onClearCompleted.bind(this) }
                    >
                      Clear completed
                    </button>;
    }

    return <div>
             <span className="todo-count">
               <strong>{ todos.active.$.length }</strong> { todos.active.$.length === 1 ? 'item' : 'items' } left
             </span>
             <ul className="filters">
               <li>
                 <a className={ cx({selected: props.todoFilter.$ === "all"}) } href="#/">All</a>
               </li>
               <li>
                 <a className={ cx({selected: props.todoFilter.$ === "active"}) } href="#/active">Active</a>
               </li>
               <li>
                 <a className={ cx({selected: props.todoFilter.$ === "completed"}) } href="#/completed">Completed</a>
               </li>
             </ul>
             { clearButton }
           </div>
  }

  onClearCompleted() {
    todos.all.$ = todos.active.$;
  }
}

module.exports = {
  StatsView,
}
