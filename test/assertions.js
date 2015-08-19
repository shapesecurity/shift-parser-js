var expect = require("expect.js");
var parse = require("../").default;
var parseModule = require("../").parseModule;
var locationSanityCheck = require("./helpers").locationSanityCheck;
var schemaCheck = require("./helpers").schemaCheck;
var SHIFT_SPEC = require("shift-spec").default;
var Parser = require("../dist/parser").Parser;
var EarlyErrorChecker = require("../dist/early-errors").EarlyErrorChecker;

exports.testParse = function testParse(program, accessor, expected) {
  var args = arguments.length;
  test(program, function () {
    expect(args).to.be(testParse.length);
    var tree = parse(program, { loc: true });
    schemaCheck(tree, SHIFT_SPEC.Script);
    locationSanityCheck(tree);
    expect(accessor(parse(program, { earlyErrors: false }))).to.eql(expected);
  });
};

exports.testParseModule = function testParseModule(program, accessor, expected) {
  var args = arguments.length;
  test(program, function () {
    expect(args).to.be(testParseModule.length);
    var tree = parseModule(program, { loc: true });
    schemaCheck(tree, SHIFT_SPEC.Module);
    locationSanityCheck(tree);
    expect(accessor(parseModule(program, { earlyErrors: false }))).to.eql(expected);
  });
};

exports.testParseFailure = function testParseFailure(source, message) {
  var args = arguments.length;
  test("Expect failure in Script: " + source, function () {
    expect(args).to.be(testParseFailure.length);
    try {
      parse(source, { earlyErrors: false });
    } catch (e) {
      expect(e.description).to.be(message);
      return;
    }
    throw new Error("Expecting error in Script: " + source);
  });
};

exports.testParseModuleFailure = function testParseModuleFailure(source, message) {
  var args = arguments.length;
  test("Expect failure in Module: " + source, function () {
    expect(args).to.be(testParseModuleFailure.length);
    try {
      parseModule(source, { earlyErrors: false });
    } catch (e) {
      expect(e.description).to.be(message);
      return;
    }
    throw new Error("Expecting error in Module: " + source);
  });
};

exports.testEarlyError = function testParseFailure(source, message) {
  var args = arguments.length;
  test("Expect failure in Script: " + source, function () {
    expect(args).to.be(testParseFailure.length);
    var parser = new Parser(source);
    var ast = parser.parseScript();
    var errors = EarlyErrorChecker.check(ast);
    expect(errors.length).to.be(1);
    expect(errors[0].message).to.be(message);
    return ast;
  });
};

exports.testModuleEarlyError = function testParseFailure(source, message) {
  var args = arguments.length;
  test("Expect failure in Script: " + source, function () {
    expect(args).to.be(testParseFailure.length);
    var parser = new Parser(source);
    var ast = parser.parseModule();
    var errors = EarlyErrorChecker.check(ast);
    expect(errors.length).to.be(1);
    expect(errors[0].message).to.be(message);
    return ast;
  });
};
