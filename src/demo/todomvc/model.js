import { computed, mutate, observable } from '../../spellbound-core';


let todoId = 0;

class TodoList {
  constructor(key) {
    this.key = key;
    this.all = observable([]);

    this.completed = computed(() => {
      return this.all.$.filter((todo) => todo.completed.$);
    });

    this.active = computed(() => {
      return this.all.$.filter((todo) => !todo.completed.$);
    });
  }

  add(item) {
    mutate((all) => {
      all.$.push(item);
    }, this.all);
  }

  remove(item) {
    let idx = this.all.$.indexOf(item);
    if (idx >= 0) {
      mutate((all) => {
        all.$.splice(idx, 1);
      }, this.all);
    }
  }
}

const todos = new TodoList();

class Todo {
  constructor(title) {
    this.id = ++todoId;
    this.title = observable(title || "");
    this.completed = observable(false);
  }
}

export {
  Todo,
  todos,
}