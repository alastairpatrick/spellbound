import { autorun, computed, mutate, observable } from '../../spellbound-core';

const uuid = () => {
  let i, random;
  let uuid = '';

  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }

    if (i === 12)
      uuid += '4';
    else if (i === 16)
      uuid += ((random & 3) | 8).toString(16);
    else
      uuid += random.toString(16);
  }

  return uuid;
}

class Todo {
  constructor(arg) {
    if (typeof arg === "object") {
      this.id = arg.id;
      this.title = observable(arg.title);
      this.completed = observable(arg.completed);
    } else {
      this.id = uuid();
      this.title = observable(arg || "");
      this.completed = observable(false);
    }
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title.$,
      completed: this.completed.$,
    };
  }
}

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

    this.storer = null;
    if (key) {
      this.load();

      this.storageListener = (event) => {
        if (event.storageArea !== localStorage)
          return;
        if (event.key !== key)
          return;
        this.load();
      }

      this.storer = autorun(() => {
        removeEventListener("storage", this.storageListener);
        this.save();
        addEventListener("storage", this.storageListener);
      });
    }
  }

  dispose() {
    if (this.storer) {
      this.storer.dispose();
      this.storer = null;
    }

    if (this.listener) {
      removeEventListener("storage", this.storageListener);
      this.listener = null;
    }
  }

  load() {
    let json = localStorage.getItem(this.key);
    if (json) {
      json = JSON.parse(json);
      this.all.$ = json.map(item => new Todo(item));
    } else {
      this.all.$ = [];
    }
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.all.$));
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

const todos = new TodoList("spellbound-todos");

export {
  Todo,
  todos,
}