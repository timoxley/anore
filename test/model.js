var Anore = require("../"),
    assert = require("chai").assert;

describe("Model", function() {
  describe("#type()", function() {
    it("should return `object'", function() {
      var model = new Anore.Model();

      assert.equal(model.type(), "object");
    });
  });

  describe("#has(path)", function() {
    it("should return true if an attribute is directly accessible", function() {
      var model = new Anore.Model({abc: "xyz"});

      assert.isTrue(model.has("abc"));
    });

    it("should return true if an attribute is indirectly accessible", function() {
      var model = new Anore.Model({abc: {xyz: "qwerty"}});

      assert.isTrue(model.has("abc.xyz"));
    });

    it("should return true if the path is supplied as an array", function() {
      var model = new Anore.Model({abc: {xyz: "qwerty"}});

      assert.isTrue(model.has(["abc", "xyz"]));
    });

    it("should return false if an attribute is not directly accessible", function() {
      var model = new Anore.Model({abc: "xyz"});

      assert.isFalse(model.has("xxx"));
    });

    it("should return false if an attribute is not indirectly accessible", function() {
      var model = new Anore.Model({abc: {xyz: "qwerty"}});

      assert.isFalse(model.has("abc.xxx"));
    });
  });

  describe("#get(path)", function() {
    it("should return the correct attribute if it is directly accessible", function() {
      var property = new Anore.Primitive("xyz");

      var model = new Anore.Model({abc: property});

      assert.strictEqual(model.get("abc"), property);
    });

    it("should return the correct attribute if it is indirectly accessible", function() {
      var property = new Anore.Primitive("xyz");

      var model = new Anore.Model({abc: {xyz: property}});

      assert.strictEqual(model.get("abc.xyz"), property);
    });

    it("should return the correct attribute if the path is supplied as an array", function() {
      var property = new Anore.Primitive("xyz");

      var model = new Anore.Model({abc: {xyz: property}});

      assert.strictEqual(model.get(["abc", "xyz"]), property);
    });

    it("should return undefined if an attribute is not directly accessible", function() {
      var model = new Anore.Model({abc: "xyz"});

      assert.isUndefined(model.get("qwerty"));
    });

    it("should return undefined if an attribute is not indirectly accessible", function() {
      var model = new Anore.Model({abc: {xyz: "qwerty"}});

      assert.isUndefined(model.get("abc.xxx"));
    });
  });

  describe("#set(key, value, options)", function() {
    it("should set the correct property", function() {
      var property = new Anore.Primitive("abc");

      var model = new Anore.Model();

      model.set("abc", property);

      assert.strictEqual(model.get("abc"), property);
    });

    it("should box `false'", function() {
      var model = new Anore.Model();

      model.set("abc", false);

      assert.instanceOf(model.get("abc"), Anore.Primitive);
      assert.equal(model.get("abc").type(), "boolean");
    });

    it("should box `true'", function() {
      var model = new Anore.Model();

      model.set("abc", true);

      assert.instanceOf(model.get("abc"), Anore.Primitive);
      assert.equal(model.get("abc").type(), "boolean");
    });

    it("should box `null'", function() {
      var model = new Anore.Model();

      model.set("abc", null);

      assert.instanceOf(model.get("abc"), Anore.Primitive);
      assert.equal(model.get("abc").type(), "null");
    });

    it("should box an integer", function() {
      var model = new Anore.Model();

      model.set("abc", 1);

      assert.instanceOf(model.get("abc"), Anore.Primitive);
      assert.equal(model.get("abc").type(), "integer");
    });

    it("should box a floating-point number", function() {
      var model = new Anore.Model();

      model.set("abc", 1.5);

      assert.instanceOf(model.get("abc"), Anore.Primitive);
      assert.equal(model.get("abc").type(), "number");
    });

    it("should box a string", function() {
      var model = new Anore.Model();

      model.set("abc", "abc");

      assert.instanceOf(model.get("abc"), Anore.Primitive);
      assert.equal(model.get("abc").type(), "string");
    });

    it("should emit an `add' event if the property does not already exist", function(done) {
      var property = new Anore.Primitive("abc");

      var model = new Anore.Model();

      model.on("add", function(name, value) {
        assert.isArray(name);
        assert.deepEqual(name, ["abc"]);
        assert.strictEqual(value, property);

        return done();
      });

      model.set("abc", property);
    });

    it("should not emit an `add' event if the property does already exist", function(done) {
      var property = new Anore.Primitive("abc");

      var timeoutHandle = setTimeout(done, 5);

      var model = new Anore.Model({abc: null});

      model.on("add", function(name, value) {
        clearTimeout(timeoutHandle);
        return done(Error("shouldn't emit an event"));
      });

      model.set("abc", property);
    });

    it("should emit a `change' event if the property changes", function(done) {
      var property = new Anore.Primitive("abc");

      var model = new Anore.Model({abc: "xyz"});

      model.on("change", function(name, value) {
        assert.isArray(name);
        assert.deepEqual(name, ["abc"]);
        assert.strictEqual(value, property);

        return done();
      });

      model.set("abc", property);
    });

    it("should propagate a `change' event if a primitive changes", function(done) {
      var property = new Anore.Primitive("abc");

      var model = new Anore.Model({abc: property});

      model.on("change", function(name, value) {
        assert.isArray(name);
        assert.deepEqual(name, ["abc"]);
        assert.strictEqual(value, property);

        return done();
      });

      property.set("hello");
    });

    it("should not propagate a `change' event if a primitive changes and the primitive has been removed", function(done) {
      var property = new Anore.Primitive("abc");

      var timeoutHandle = setTimeout(done, 5);

      var model = new Anore.Model({abc: property});

      model.set("abc", "testing");

      model.on("change", function(name, value) {
        clearTimeout(timeoutHandle);
        return done(Error("should not fire an event"));
      });

      property.set("hello");
    });

    it("should not propagate a `change' event if a primitive changes and it has been told to be silent", function(done) {
      var property = new Anore.Primitive("abc");

      var timeoutHandle = setTimeout(done, 5);

      var model = new Anore.Model({abc: property}, {bubbleEvents: false});

      model.on("change", function(name, value) {
        clearTimeout(timeoutHandle);
        return done(Error("should not fire an event"));
      });

      property.set("hello");
    });

    it("should propagate a `change' event if a nested model changes", function(done) {
      var property = new Anore.Primitive("hello");

      var model = new Anore.Model({abc: {xyz: property}});

      model.on("change", function(name, value) {
        assert.isArray(name);
        assert.deepEqual(name, ["abc", "xyz"]);
        assert.strictEqual(value, property);

        return done();
      });

      model.get("abc").get("xyz").set("derp");
    });

    it("should not propagate a `change' event if a nested model changes and the nested model has been removed", function(done) {
      var property = new Anore.Primitive("hello");

      var timeoutHandle = setTimeout(done, 5);

      var model = new Anore.Model({abc: {xyz: property}});

      model.on("change", function(name, value) {
        clearTimeout(timeoutHandle);
        return done(Error("should not fire an event"));
      });

      model.get("abc").get("xyz").set("hello");
    });

    it("should not propagate a `change' event if a nested model changes and it has been told to be silent", function(done) {
      var property = new Anore.Primitive("hello");

      var timeoutHandle = setTimeout(done, 5);

      var model = new Anore.Model({abc: {xyz: property}}, {bubbleEvents: false});

      model.on("change", function(name, value) {
        clearTimeout(timeoutHandle);
        return done(Error("should not fire an event"));
      });

      model.get("abc").get("xyz").set("hello");
    });
  });
});
