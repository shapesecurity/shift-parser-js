let expect = require('expect.js');
let crypto = require('crypto');
let fs = require('fs');
let normalize = require('normalize-parser-test').default;
let parse = require('../').parseScriptWithLocation;
let parseModule = require('../').parseModuleWithLocation;
let locationSanityCheck = require('./helpers').locationSanityCheck;
let schemaCheck = require('./helpers').schemaCheck;
let SHIFT_SPEC = require('shift-spec').default;
let Parser = require('../dist/parser').GenericParser;
let EarlyErrorChecker = require('../dist/early-errors').EarlyErrorChecker;

let expectationsDir = 'node_modules/shift-parser-expectations/expectations';

function getTest262Name(program, isModule) {
  const digest = crypto.createHash('sha256').update(normalize(program, isModule)).digest('hex');
  return digest.substring(0, 16) + (isModule ? '.module' : '');
}

function checkPassNotExists(program, isModule) {
  const name = getTest262Name(program, isModule);
  if (fs.existsSync(expectationsDir + '/' + name + '.js-tree.json')) {
    throw new Error('Test already exists in shift-parser-tests as ' + name);
  }
}

exports.testParse = function testParse(program, accessor, expected) {
  let args = arguments.length;
  test(program, () => {
    expect(args).to.be(testParse.length);
    let { tree, locations } = parse(program);
    schemaCheck(tree, SHIFT_SPEC.Script);
    locationSanityCheck(tree, locations);
    expect(accessor(parse(program, { earlyErrors: false }).tree)).to.eql(expected);

    checkPassNotExists(program, false);
  });
};

exports.testParseModule = function testParseModule(program, accessor, expected) {
  let args = arguments.length;
  test(program, () => {
    expect(args).to.be(testParseModule.length);
    let { tree, locations } = parseModule(program);
    schemaCheck(tree, SHIFT_SPEC.Module);
    locationSanityCheck(tree, locations);
    expect(accessor(parseModule(program, { earlyErrors: false }).tree)).to.eql(expected);

    checkPassNotExists(program, true);
  });
};

exports.testParseSuccess = function testParseSuccess(program) {
  let args = arguments.length;
  test(program, () => {
    expect(args).to.be(testParseSuccess.length);
    let { tree, locations } = parse(program);
    schemaCheck(tree, SHIFT_SPEC.Script);
    locationSanityCheck(tree, locations);
  });
};

exports.testParseFailure = function testParseFailure(source, message) {
  let args = arguments.length;
  test('Expect failure in Script: ' + source, () => {
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
  test('Expect failure in Module: ' + source, () => {
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
  test('Expect failure in Script: ' + source, () => {
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
  test('Expect failure in Script: ' + source, () => {
    expect(args).to.be(testParseFailure.length);
    let parser = new Parser(source);
    let ast = parser.parseModule();
    let errors = EarlyErrorChecker.check(ast);
    expect(errors.length).to.be(1);
    expect(errors[0].message).to.be(message);
    return ast;
  });
};
