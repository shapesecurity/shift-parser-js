let expect = require('expect.js');
let parse = require('../').parseScriptWithLocation;
let parseModule = require('../').parseModuleWithLocation;
// let locationSanityCheck = require('./helpers').locationSanityCheck;
let schemaCheck = require('./helpers').schemaCheck;
let SHIFT_SPEC = require('shift-spec').default;
let Parser = require('../dist/parser').GenericParser;
let EarlyErrorChecker = require('../dist/early-errors').EarlyErrorChecker;

exports.testParse = function testParse(program, accessor, expected) {
  let args = arguments.length;
  test(program, function () {
    expect(args).to.be(testParse.length);
    let tree = parse(program).tree;
    schemaCheck(tree, SHIFT_SPEC.Script);
  //  locationSanityCheck(tree);
    expect(accessor(parse(program, { earlyErrors: false }).tree)).to.eql(expected);
  });
};

exports.testParseModule = function testParseModule(program, accessor, expected) {
  let args = arguments.length;
  test(program, function () {
    expect(args).to.be(testParseModule.length);
    let tree = parseModule(program).tree;
    schemaCheck(tree, SHIFT_SPEC.Module);
  //  locationSanityCheck(tree);
    expect(accessor(parseModule(program, { earlyErrors: false }).tree)).to.eql(expected);
  });
};

exports.testParseFailure = function testParseFailure(source, message) {
  let args = arguments.length;
  test('Expect failure in Script: ' + source, function () {
    expect(args).to.be(testParseFailure.length);
    try {
      parse(source, { earlyErrors: false });
    } catch (e) {
      if (!e.description) console.log(e); // eslint-disable-line no-console
      expect(e.description).to.be(message);
      return;
    }
    throw new Error('Expecting error in Script: ' + source);
  });
};

exports.testParseModuleFailure = function testParseModuleFailure(source, message) {
  let args = arguments.length;
  test('Expect failure in Module: ' + source, function () {
    expect(args).to.be(testParseModuleFailure.length);
    try {
      parseModule(source, { earlyErrors: false });
    } catch (e) {
      expect(e.description).to.be(message);
      return;
    }
    throw new Error('Expecting error in Module: ' + source);
  });
};

exports.testEarlyError = function testParseFailure(source, message) {
  let args = arguments.length;
  test('Expect failure in Script: ' + source, function () {
    expect(args).to.be(testParseFailure.length);
    let parser = new Parser(source);
    let ast = parser.parseScript();
    let errors = EarlyErrorChecker.check(ast);
    expect(errors.length).to.be(1);
    expect(errors[0].message).to.be(message);
    return ast;
  });
};

exports.testModuleEarlyError = function testParseFailure(source, message) {
  let args = arguments.length;
  test('Expect failure in Script: ' + source, function () {
    expect(args).to.be(testParseFailure.length);
    let parser = new Parser(source);
    let ast = parser.parseModule();
    let errors = EarlyErrorChecker.check(ast);
    expect(errors.length).to.be(1);
    expect(errors[0].message).to.be(message);
    return ast;
  });
};
