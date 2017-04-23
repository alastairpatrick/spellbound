const ReactDOM = require('react-dom');
const ReactDataGrid = require('react-data-grid');

const { observable } = require('../../core');
const { serialize } = require('../../serialize');
const React = require('../../react');

const lastTime = observable(0);

const rows = [];
for (let i = 1; i < 1000; i++) {
  rows.push({
    id: i,
    millisecond: i,
    count: observable(0),
  });
}

setInterval(() => {
  let now = Date.now();
  lastTime.$ = now;
  let bucket = now % rows.length;
  ++rows[bucket].count.$;
}, 1);


class CountFormatter extends React.Component {
  render() {
    const count = this.props.value;
    return <div className="progress" style={{marginTop: '20px'}}>
             <div className="progress-bar"
                  style={{width: count + 'px'}}>
               {count}
             </div>
           </div>;
  }
}

class GridView extends React.Component {
  constructor() {
    super();

    this._columns = [
      {
        key: 'millisecond',
        name: 'Millisecond',
        resizable: true,
      },
      {
        key: 'count',
        name: 'Count',
        resizable: true,
        formatter: CountFormatter,
      }
    ];

    this.rowGetter = this.rowGetter.bind(this);
  }

  rowGetter(i) {
    return serialize(this.props.rows[i]);
  }

  render() {
    return <ReactDataGrid
             columns={this._columns}
             rowGetter={this.observing(this.rowGetter)}
             rowsCount={this.props.rows.length}
             minHeight={500}
           />;
  }
}

class AppView extends React.Component {
  render() {
    return <div>
             <p>Last time {lastTime.$}ms</p>
             <GridView rows={rows}/>
           </div>;
  }
}

ReactDOM.render(
  <AppView/>,
  document.getElementById("main")
);
