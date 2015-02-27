var expect = require('expect.js');
var esprima = require('esprima');
var converters = require('shift-spidermonkey-converter');
var parse = require('../').default;
var parseModule = require('../').parseModule;

exports.testEsprimaEquiv = function testEsprimaEquiv(source) {
  var args = arguments.length;
  test(source, function () {
    expect(args).to.be(testEsprimaEquiv.length);
    var tree = parse(source);
    var oracle = converters.toShift(esprima.parse(source));
    expect(tree).to.eql(oracle);
  });
};

exports.testParse = function testParse(program, accessor, expected) {
  var args = arguments.length;
  test(program, function () {
    expect(args).to.be(testParse.length);
    expect(accessor(parse(program))).to.eql(expected);
  });
};

exports.testParseModule = function testParseModule(program, accessor, expected) {
  var args = arguments.length;
  test(program, function () {
    expect(args).to.be(testParseModule.length);
    expect(accessor(parseModule(program))).to.eql(expected);
  });
};

exports.testParseFailure = function testParseFailure(source, message) {
  var args = arguments.length;
  test('Expect failure in Script: ' + source, function () {
    expect(args).to.be(testParseFailure.length);
    try {
      parse(source);
    } catch (e) {
      expect(e.description).to.be(message);
      return;
    }
    throw new Error("Expecting error in Script: " + source);
  });
};

exports.testParseModuleFailure = function testParseModuleFailure(source, message) {
  var args = arguments.length;
  test('Expect failure in Module: ' + source, function () {
    expect(args).to.be(testParseModuleFailure.length);
    try {
      parseModule(source);
    } catch (e) {
      expect(e.description).to.be(message);
      return;
    }
    throw new Error("Expecting error in Module: " + source);
  });
};
