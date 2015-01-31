var expect = require('expect.js');
var esprima = require('esprima');
var converters = require('shift-spidermonkey-converter');
var ShiftParser = require('../');
var parse = ShiftParser.default;

exports.testParseFailure = function testParseFailure(source, message) {
  test(source, function () {
    try {
      parse(source);
    } catch (e) {
      expect(e.description).be(message);
      return;
    }
    throw new Error("Expecting error");
  });
};

exports.testEsprimaEquiv = function testEsprimaEquiv(source) {
  test(source, function () {
    var tree = parse(source);
    var oracle = converters.toShift(esprima.parse(source));
    expect(tree).eql(oracle);
  });
};

exports.testParse = function testParse(program, fn) {
  test(program, function () {
    fn(parse(program));
  });
}
