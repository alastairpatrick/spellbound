import React from 'react';

import { Component } from './Component';
import { createElement } from './createElement';

export default Object.assign(Object.create(React), {
  Component,
  createElement,
})
