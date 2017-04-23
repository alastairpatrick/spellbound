const has = Object.prototype.hasOwnProperty;
const CAT = Symbol("Entry");
const RESOLVE_RE = /^(?:.*\/)?(node_modules)\/(.*?)(?:\.[a-zA-Z0-9_]+)?$/;
const NO_EXT_RE = /^(.*?)(?:\.[a-zA-Z0-9_]+)?$/;

let prefixes = [];  // in descending order of length
let entries = Object.create(null);

const normalizeName = (name) => {
  if (typeof name !== "string" || name.length === 0)
    throw new Error(`Expected name but got ${name}.`);

  name = name.replace(/\\/g, "/");
  let match = RESOLVE_RE.exec(name)
  if (match)
    return match[2];

  for (let i = 0; i < prefixes.length; ++i) {
    let prefix = prefixes[i];
    if (name.substring(0, prefix.length) == prefix) {
      match = NO_EXT_RE.exec(name.substring(prefix.length));
      return "./" + match[1];
    }
  }

  return name;
}

let cat;

class Entry {
  constructor(qname) {
    this.qname = qname;
    this.target = undefined;

    let idx = qname.lastIndexOf("/");
    if (idx >= 0) {
      this.provider = cat(qname.substring(0, idx));
      this.name = qname.substring(idx + 1);
    } else {
      this.provider = null;
      this.name = qname;
    }
  }

  provides(target) {
    this.target = target;
    if (target && (typeof target === "object" || typeof target === "function")) {
      target[CAT] = this;
    }
    return this;
  }

  exports(target) {
    if (!this.target)
      this.target = target;
    return this;
  }

  providesEach(target) {
    this.provides(target);
    for (let n in target) {
      if (has.call(target, n))
        cat(this.qname, n).provides(target[n]);
    }
    return this;
  }

  exportsEach(target) {
    this.exports(target);
    for (let n in target) {
      if (has.call(target, n)) {
        this.target[n] = target[n];
        cat(this.qname, n).exports(target[n]);
      }
    }
    return this;
  }
}

cat = (...names) => {
  let qname = names.map(normalizeName).join("/");
  let entry = entries[qname];
  if (entry)
    return entry;
  
  entry = new Entry(qname);
  entries[qname] = entry;
  return entry;
}

cat.prefix = (name) => {
  name = name.replace(/\\/g, "/");
  if (name[name.length - 1] !== "/")
    name += "/";
  prefixes.push(name);
  prefixes.sort((a, b) => b.length - a.length);
}

module.exports = {
  CAT,
  cat,
}