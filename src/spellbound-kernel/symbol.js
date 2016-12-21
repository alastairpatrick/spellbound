let symbolCount = 0;
let newSymbol;
if (typeof Symbol === "function") {
  newSymbol = Symbol;
} else {
  newSymbol = (name) => {
    ++symbolCount;
    return "__spellbound_private_" + symbolCount + "_" + name;
  }
}

export {
  newSymbol,
}
