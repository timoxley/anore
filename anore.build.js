(function(e){if("function"==typeof bootstrap)bootstrap("anore",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeAnore=e}else"undefined"!=typeof window?window.Anore=e():global.Anore=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var EE = require("./lib/ee"),
    Primitive = require("./lib/primitive"),
    Model = require("./lib/model"),
    Collection = require("./lib/collection");

exports.EE = EE;
exports.Primitive = Primitive;
exports.Model = Model;
exports.Collection = Collection;

},{"./lib/collection":2,"./lib/ee":3,"./lib/model":4,"./lib/primitive":5}],2:[function(require,module,exports){
var EE = require("./ee"),
    Model = require("./model"),
    Primitive = require("./primitive");

var Collection = module.exports = function Collection(elements, options) {
  EE.call(this);

  if (!Array.isArray(elements)) {
    options = elements;
    elements = null;
  }

  options = options || {};

  this._idField = options.idField || "id";

  this._elements = [];
  this.length = 0;

  if (Array.isArray(elements)) {
    var self = this;

    elements.forEach(function(element) {
      self.add(element, options);
    });
  }
};
Collection.prototype = Object.create(EE.prototype, {constructor: {value: Collection}});

Collection.prototype.type = function type() {
  return "array";
};

Collection.prototype.toJSON = function toJSON() {
  return this._elements;
};

Collection.prototype.toString = function toString() {
  return this.toJSON() + "";
};

Collection.prototype.indexOf = function indexOf(element) {
  var literalIndex = this._elements.indexOf(element);
  if (literalIndex !== -1) {
    return literalIndex;
  }

  var foundElement = this.get(element.get(this._idField));
  if (foundElement) {
    return this._elements.indexOf(foundElement);
  }

  return -1;
};

Collection.prototype.empty = function empty() {
  while (this._elements.length) {
    this.remove(this._elements[0]);
  }

  return this;
};

Collection.prototype.setElements = function setElements(elements) {
  this.empty();

  if (!elements) {
    return this;
  }

  elements.forEach(this.add.bind(this));

  return this;
};

Collection.prototype.makeModel = function makeModel(value) {
  if (typeof value === "object" && (value instanceof Primitive || value instanceof Model || value instanceof Collection)) {
    return value;
  } else if (typeof value !== "object" || value === null) {
    return new Primitive(value, typeof value);
  } else if (Array.isArray(value)) {
    return new Collection(value);
  } else {
    return new Model(value);
  }
};

Collection.prototype.add = function add(element, options) {
  options = options || {};

  var position = options.at || this._elements.length;

  element = this.makeModel(element);

  if (this.indexOf(element) !== -1) {
    return this;
  }

  this._elements.splice(position, 0, element);

  this.emit("add", element, {at: position});

  this.length++;

  return this;
};

Collection.prototype.remove = function remove(element) {
  var position = this.indexOf(element);

  if (position === -1) {
    return this;
  }

  this._elements.splice(position, 1);

  this.emit("remove", element, {at: position});
  element.emit("removeFrom", this);

  this.length--;

  return this;
};

Collection.prototype.at = function at(index) {
  return this._elements[index];
};

Collection.prototype.each = function each(fn) {
  this._elements.forEach(fn);

  return this;
};

Collection.prototype.filter = function filter(fn) {
  return this._elements.filter(fn);
};

Collection.prototype.map = function map(fn) {
  return this._elements.map(fn);
};

Collection.prototype.where = function where(query) {
  return this.filter(function(element) {
    return element.match(query);
  });
};

Collection.prototype.get = function get(id) {
  var query = {};

  query[this._idField] = id;

  return this.where(query).shift();
};

Collection.prototype.match = function match(query) {
  return this.where(query);
};

Collection.prototype.create = function create(data, options) {
  options = options || {};

  var model = new Model(data);

  this.add(model);

  return model;
};

},{"./ee":3,"./model":4,"./primitive":5}],3:[function(require,module,exports){
var EE = module.exports = function EE() {
  this._events = {};
};

EE.prototype.on = function on(name, cb, options) {
  options = options || {};

  if (!options.allowDuplicates && this.has(name, cb)) {
    return this;
  }

  if (!this._events[name]) {
    this._events[name] = [];
  }

  this._events[name].push(cb);

  if (!options.silent && !options.quiet) {
    this.emit("addListener", name, cb);
  }

  return this;
};

EE.prototype.has = function has(name, cb) {
  if (!this._events[name]) {
    return false;
  }

  return this._events[name].indexOf(cb) !== -1;
};

EE.prototype.off = function off(name, cb, options) {
  options = options || {};

  if (!this._events[name]) {
    return this;
  }

  var pos;
  while ((pos = this._events[name].indexOf(cb)) !== -1) {
    this._events[name].splice(pos, 1);

    if (!options.silent && !options.quiet) {
      this.emit("removeListener", name, cb);
    }
  }

  return this;
};

EE.prototype.offAll = function offAll(name, options) {
  options = options || {};

  if (!this._events[name]) {
    return;
  }

  this._events[name] = null;

  if (!options.silent && !options.quiet) {
    this.emit("removeAllListeners", name);
  }

  return this;
};

EE.prototype.emit = function emit(name) {
  if (!this._events[name] || !this._events[name].length) {
    return this;
  }

  var args = [].slice.call(arguments, 1);

  var events = this._events[name].slice(0);

  for (var i=0;i<events.length;++i) {
    events[i].apply(null, args);
  }

  return this;
};

},{}],4:[function(require,module,exports){
var EE = require("./ee"),
    Primitive = require("./primitive");

var Model = module.exports = function Model(attributes, options) {
  EE.call(this);

  options = options || {};

  this._bubbleEvents = (typeof options.bubbleEvents === "undefined") || !!options.bubbleEvents;

  this._attributes = {};

  if (typeof attributes === "object" && attributes !== null) {
    this.multiSet(attributes);
  }
};
Model.prototype = Object.create(EE.prototype, {constructor: {value: Model}});

Model.prototype.type = function type() {
  return "object";
};

Model.prototype.toJSON = function toJSON() {
  return this._attributes;
};

Model.prototype.toString = function toString() {
  return this.toJSON() + "";
};

Model.prototype.has = function has(path) {
  return !!this.get(path);
};

Model.prototype.get = function get(path) {
  if (path instanceof Primitive) {
    path = path.get();
  }

  if (typeof path === "string") {
    path = path.split(".");
  }

  var top = path.shift();

  if (!this._attributes[top]) {
    return;
  }

  if (!path.length) {
    return this._attributes[top];
  }

  if (!(this._attributes[top] instanceof Model)) {
    return;
  }

  return this._attributes[top].get(path);
};

Model.prototype.set = function set(key, value, options) {

  // work around for circular dependency
  // between Collection/Model
  var Collection = require("./collection");

  options = options || {};

  // unbox `Primitive` values

  if (key instanceof Primitive) {
    key = key.get();
  }

  // ensure correct key type

  if (typeof key !== "string") {
    throw new Error("`key' argument must be a string or a Primitive-wrapped string");
  }

  // box things that need boxing

  if (typeof value !== "object" || value === null) {
    value = new Primitive(value);
  } else if (typeof value === "object" && Array.isArray(value)) {
    value = new Collection(value);
  } else if (!(value instanceof Primitive || value instanceof Model || value instanceof Collection)) {
    value = new Model(value);
  }

  // record previous value

  var previousValue = this._attributes[key];

  // skip out if there's no change

  if (previousValue === value) {
    return this;
  }

  // handle event bubbling

  if (this._bubbleEvents) {
    var self = this,
        onChange = null;

    if (value instanceof Primitive) {
      onChange = function onChange() {
        self.emit("change", [key], value);
        self.emit("change:" + [key].join("."), value);
      };
    } else {
      onChange = function onChange(path, value) {
        self.emit("change", [key].concat(path), value);
        self.emit("change:" + [key].concat(path).join("."), value);
      };
    }

    var onRemovedFrom = function onRemovedFrom(parent, oldKey) {
      if (parent === self && oldKey === key) {
        value.off("change", onChange);
        value.off("removedFrom", onRemovedFrom);
      }
    };

    value.on("change", onChange);
    value.on("removedFrom", onRemovedFrom);
  }

  // set new value

  this._attributes[key] = value;

  // handle change event emission

  if (!options.silent && !options.quiet) {
    this.emit("change", [key], value, previousValue);
    this.emit("change:" + key, value, previousValue);
  }

  // notify listeners of the old value that it's been removed (and replaced)

  if (previousValue && !options.silent) {
    previousValue.emit("replacedBy", this, key, value);
    previousValue.emit("removedFrom", this, key);
  }

  // emit add events if there was no previous value

  if (!previousValue && !options.silent && !options.quiet) {
    this.emit("add", [key], value);
    this.emit("add:" + key, value);
  }

  // tell listeners of the new value that it's been added to a model

  if (!options.silent) {
    value.emit("addedTo", this, key);
  }

  // tell listeners of the new value that it's replaced another value

  if (previousValue && !options.silent) {
    value.emit("replaced", this, key, previousValue);
  }

  return this;
};

Model.prototype.remove = function remove(key, options) {
  options = options || {};

  if (typeof this._attributes[key] === "undefined") {
    return this;
  }

  var previousValue = this._attributes[key];

  delete this._attributes[key];

  if (!options.silent && !options.quiet) {
    this.emit("remove", key, previousValue);
    this.emit("remove:" + key, previousValue);
  }

  if (!options.silent) {
    previousValue.emit("removedFrom", this, key);
  }

  return this;
};

Model.prototype.multiSet = function multiSet(attributes, options) {
  options = options || {};

  var newKeys = Object.keys(attributes);

  if (options.absolute) {
    var oldKeys = this.keys();

    for (var i=0;i<oldKeys.length;++i) {
      if (newKeys.indexOf(oldKeys[i]) === -1) {
        this.remove(oldKeys[i], options.remove);
      }
    }
  }

  for (var k in attributes) {
    this.set(k, attributes[k], options.add);
  }

  if (!options.quiet) {
    this.emit("multiSet", newKeys);
  }

  return this;
};

Model.prototype.keys = function keys() {
  return Object.keys(this._attributes);
};

Model.prototype.each = function each(fn) {
  var keys = this.keys();

  for (var i=0;i<keys.length;++i) {
    fn.call(null, this.get(keys[i]), keys[i]);
  }

  return this;
};

Model.prototype.move = function move(oldKey, newKey, options) {
  options = options || {};

  if (oldKey === newKey) {
    return;
  }

  this._attributes[newKey] = this._attributes[oldKey];

  delete this._attributes[oldKey];

  if (!options.silent) {
    this.emit("move", oldKey, newKey);
  }

  return this;
};

Model.prototype.match = function match(query) {
  if (typeof query !== "object" || query === null) {
    return false;
  }

  for (var k in query) {
    if (!this.has(k) || !this.get(k).match(query[k])) {
      return false;
    }
  }

  return true;
};

},{"./collection":2,"./ee":3,"./primitive":5}],5:[function(require,module,exports){
var EE = require("./ee");

var Primitive = module.exports = function Primitive(value) {
  EE.call(this);

  this._value = value;
};
Primitive.prototype = Object.create(EE.prototype, {constructor: {value: Primitive}});

Primitive.prototype.type = function type() {
  if (this._value === null) {
    return "null";
  } else if (typeof this._value === "number") {
    return this._value % 1 === 0 ? "integer" : "number";
  } else {
    return typeof this._value;
  }
};

Primitive.prototype.toJSON = function toJSON() {
  return this.get();
};

Primitive.prototype.toString = function toString() {
  return this.toJSON() + "";
};

Primitive.prototype.get = function get() {
  return this._value;
};

Primitive.prototype.set = function set(value, options) {
  options = options || {};

  if (value === this._value) {
    return this;
  }

  var previousValue = this._value;

  this._value = value;

  if (!options.silent && !options.quiet) {
    this.emit("change", value, previousValue);
  }

  return this;
};

Primitive.prototype.match = function match(query) {
  if (query instanceof Primitive) {
    query = query.get();
  }

  return this.get() === query;
};

},{"./ee":3}]},{},[1])(1)
});
;