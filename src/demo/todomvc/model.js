import { autorun, computed, isWritableObservable, mutate, observable } from '../../spellbound-core';
import { uuid } from './util';

import { serialize, deserialize, Namespace } from '../../spellbound-util';

const namespace = new Namespace();

class Todo {
  constructor(title) {
    this.id = observable(uuid());
    this.title = observable(title || "");
    this.completed = observable(false);
  }
}

class TodoList {
  constructor(key) {
    this.key = key;
    this.all = observable([]);
    this.onStorage = this.onStorage.bind(this);
    this.storer = null;
    
    this.completed = computed(() => {
      return this.all.$.filter((todo) => todo.completed.$);
    });

    this.active = computed(() => {
      return this.all.$.filter((todo) => !todo.completed.$);
    });

    if (key) {
      this.load();
      this.storer = autorun(() => {
        removeEventListener("storage", this.onStorage);
        this.save();
        addEventListener("storage", this.onStorage);
      });
    }
  }

  dispose() {
    if (this.storer) {
      this.storer.dispose();
      this.storer = null;
    }

    removeEventListener("storage", this.onStorage);
  }

  save() {
    localStorage.setItem(this.key, serialize(this, {
      filter: isWritableObservable,
      namespace,
      format: "json",
    }));
  }

  load() {
    let json = localStorage.getItem(this.key);
    if (json) {
      deserialize(json, {
        target: this,
        filter: isWritableObservable,
        namespace,
        format: "json",
      });
    } else {
      this.all.$ = [];
    }
  }

  onStorage(event) {
    if (event.storageArea !== localStorage)
      return;
    if (event.key !== key)
      return;
    this.load();
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