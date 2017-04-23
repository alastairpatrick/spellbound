const React = require('react');

const { Component } = require('./Component');
const { createElement } = require('./createElement');

module.exports = Object.assign(Object.create(React), {
  Component,
  createElement,
})
