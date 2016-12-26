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

export {
  uuid,
}
