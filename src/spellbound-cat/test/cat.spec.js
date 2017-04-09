import { expect } from 'chai';

import { CAT, cat } from '..';

class A {
}

const add = (a, b) => a + b;
const sub = (a, b) => a - b;

export {
  A,
  add,
}

cat(__filename).providesEach(module.exports).exportsEach({
  sub
});

cat(__filename, "alt/location").exportsEach(module.exports);

describe("Catalog", function() {
  it("module contains classes with qualified names", function() {
    expect(A[CAT].provider).to.equal(module.exports[CAT]);
    expect(A[CAT].provider.target).to.equal(module.exports);
    expect(A[CAT].qname).to.equal("./spellbound-cat/test/cat.spec/A");
  })

  it("module contains functions with qualified names", function() {
    expect(add[CAT].provider).to.equal(module.exports[CAT]);
    expect(add[CAT].provider.target).to.equal(module.exports);
    expect(add[CAT].qname).to.equal("./spellbound-cat/test/cat.spec/add");
  })

  it("exports that are not provided are not given entries", function() {
    expect(sub[CAT]).to.equal(undefined);
  })

  it("module exports classes and functions", function() {
    expect(module.exports).to.deep.equal({ A, add, sub });
  })
  
  it("modules can be located by name", function() {
    expect(cat("./spellbound-cat/test/cat.spec").target).to.equal(module.exports);
  })

  it("classes can be located by name", function() {
    expect(cat("./spellbound-cat/test/cat.spec/A").target).to.equal(A);
  })

  it("functions can be located by name", function() {
    let fn = cat("./spellbound-cat/test/cat.spec/add").target;
    expect(fn).to.equal(add);
    expect(fn(1, 2)).to.equal(3);
  })

  it("can configure aliases for module", function() {
    expect(cat("./spellbound-cat/test/cat.spec/alt/location/A").target).to.equal(A);
    expect(cat("./spellbound-cat/test/cat.spec/alt/location/add").target).to.equal(add);
  })

  it("equals catalog with same name", function() {
    expect(cat(__filename, "a/b/c")).to.equal(cat(__filename, "a/b/c"));
    expect(cat(__filename, "a/b")).to.not.equal(cat(__filename, "b/a"));
  })

  it("has qualified name", function() {
    let c = cat(__filename, "a/b/c");
    expect(c.qname).to.equal("./spellbound-cat/test/cat.spec/a/b/c");
  })

  it("at top level qualified name", function() {
    let c = cat(__filename, "a");
    expect(c.qname).to.equal("./spellbound-cat/test/cat.spec/a");
  })

  it("has name", function() {
    let c = cat(__filename, "a/b/c");
    expect(c.name).to.equal("c");
  })

  it("at top level has name", function() {
    let c = cat(__filename, "a");
    expect(c.name).to.equal("a");
  })

  it("has provider", function() {
    let c = cat(__filename, "a/b/c");
    expect(c.provider).to.equal(cat(__filename, "a/b"));
  })

  it("has undefined target by default", function() {
    let c = cat(__filename, "a/b/c");
    expect(c.target).to.be.undefined;
  })

  it("can provide empty object", function() {
    let obj = {};
    let c = cat(__filename, "a/b/c").provides(obj);
    expect(c.target).to.equal(obj);
    expect(obj[CAT]).to.equal(c);
  })

  it("can provide object and its properties", function() {
    let obj = { d: {}, e: {} };
    let c = cat(__filename, "a/b/c").providesEach(obj);
    expect(c.target).to.equal(obj);
    expect(cat(__filename, "a/b/c/d").target).to.equal(obj.d);
    expect(cat(__filename, "a/b/c/e").target).to.equal(obj.e);
    expect(obj.d[CAT]).to.equal(cat(__filename, "a/b/c/d"));
    expect(obj.e[CAT]).to.equal(cat(__filename, "a/b/c/e"));
  })

  it("can add additional exports", function() {
    let obj = {};
    let c = cat(__filename, "a/b/c").provides(obj).exportsEach({f: {}, g: {}});
    expect(c.target).to.equal(obj);
    expect(cat(__filename, "a/b/c/f").target).to.equal(obj.f);
    expect(cat(__filename, "a/b/c/g").target).to.equal(obj.g);
    expect(obj.f[CAT]).to.be.undefined;
    expect(obj.g[CAT]).to.be.undefined;
    expect(obj).to.deep.equal({ f: {}, g: {} });
  })
})
