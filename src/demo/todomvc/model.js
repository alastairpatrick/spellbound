import { autorun, computed, isWritableObservable, mutate, observable } from '../../spellbound-core';
import { uuid } from './util';

import { serialize, deserialize, Namespace } from '../../spellbound-util';

const namespace = new Namespace();

class Todo {
  constructor(arg) {
    if (typeof arg === "object") {
      this.id = observable(arg.id);
      this.title = observable(arg.title);
      this.completed = observable(arg.completed);
    } else {
      this.id = observable(uuid());
      this.title = observable(arg || "");
      this.completed = observable(false);
    }
  }

  toJSON() {
    return {
      id: this.id.$,
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

  toJSON() {
    return serialize(this, {
      namespace,
      filter: isWritableObservable
    });
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this));
  }

  load() {
    let json = localStorage.getItem(this.key);
    if (json) {
      deserialize(JSON.parse(json), {
        namespace,
        filter: isWritableObservable,
        target: this,
      });
    } else {
      this.all.$ = [];
    }
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

namespace.add({TodoList, Todo});

const todos = new TodoList("spellbound-todos");

export {
  Todo,
  todos,
}