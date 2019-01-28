let expect = require('expect.js');
let crypto = require('crypto');
let fs = require('fs');
let normalize = require('normalize-parser-test').default;
let parseScript = require('../').parseScriptWithLocation;
let parseModule = require('../').parseModuleWithLocation;
let locationSanityCheck = require('./helpers').locationSanityCheck;
let schemaCheck = require('./helpers').schemaCheck;
let SHIFT_SPEC = require('shift-spec').default;
let Parser = require('../dist/parser').GenericParser;
let EarlyErrorChecker = require('../dist/early-errors').EarlyErrorChecker;

let expectationsDir = 'node_modules/shift-parser-expectations/expectations';


let normalizeParseScript = src => parseScript(src, { earlyErrors: false });
let normalizeParseModule = src => parseModule(src, { earlyErrors: false });
function getTest262Name(program, isModule) {
  const digest = crypto.createHash('sha256').update(normalize(program, { parseFn: isModule ? normalizeParseModule : normalizeParseScript })).digest('hex');
  return digest.substring(0, 16) + (isModule ? '.module' : '');
}

function checkPassNotExists(program, isModule) {
  let name;
  try {
    // TODO: this is guarded until normalize-parser-tests can get updated to 2017
    name = getTest262Name(program, isModule);
  } catch (e) {
    return;
  }
  if (fs.existsSync(expectationsDir + '/' + name + '.js-tree.json')) {
    throw new Error('Test already exists in shift-parser-tests as ' + name);
  }
}

exports.testParse = function testParse(program, accessor, expected) {
  let args = arguments.length;
  test(program, () => {
    expect(args).to.be(testParse.length);
    let { tree, locations } = parseScript(program);
    schemaCheck(tree, SHIFT_SPEC.Script);
    locationSanityCheck(tree, locations);
    expect(accessor(tree)).to.eql(expected);

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
    expect(accessor(tree)).to.eql(expected);

    checkPassNotExists(program, true);
  });
};

exports.testParseSuccess = function testParseSuccess(program) {
  let args = arguments.length;
  test(program, () => {
    expect(args).to.be(testParseSuccess.length);
    let { tree, locations } = parseScript(program);
    schemaCheck(tree, SHIFT_SPEC.Script);
    locationSanityCheck(tree, locations);
  });
};

exports.testParseFailure = function testParseFailure(source, message, ...params) {
  test('Expect failure in Script: ' + source, () => {
    try {
      parseScript(source, { earlyErrors: false });
    } catch (e) {
      let finalMessage;
      if (typeof message === 'function') {
        finalMessage = message(...params);
      } else {
        finalMessage = message;
      }
      expect(e.description).to.be(finalMessage);
      return;
    }
    throw new Error('Expecting error in Script: ' + source);
  });
};

exports.testParseModuleFailure = function testParseModuleFailure(source, message, ...params) {
  test('Expect failure in Module: ' + source, () => {
    try {
      parseModule(source, { earlyErrors: false });
    } catch (e) {
      let finalMessage;
      if (typeof message === 'function') {
        finalMessage = message(...params);
      } else {
        finalMessage = message;
      }
      expect(e.description).to.be(finalMessage);
      return;
    }
    throw new Error('Expecting error in Module: ' + source);
  });
};

exports.testEarlyError = function testParseFailure(source, message, ...params) {
  test('Expect failure in Script: ' + source, () => {
    let parser = new Parser(source);
    let ast = parser.parseScript();
    let errors = EarlyErrorChecker.check(ast);
    expect(errors.length).to.be(1);
    let finalMessage;
    if (typeof message === 'function') {
      finalMessage = message(...params);
    } else {
      finalMessage = message;
    }
    expect(errors[0].message).to.be(finalMessage);
    return ast;
  });
};

exports.testModuleEarlyError = function testParseFailure(source, message, ...params) {
  test('Expect failure in Script: ' + source, () => {
    let parser = new Parser(source);
    let ast = parser.parseModule();
    let errors = EarlyErrorChecker.check(ast);
    expect(errors.length).to.be(1);
    let finalMessage;
    if (typeof message === 'function') {
      finalMessage = message(...params);
    } else {
      finalMessage = message;
    }
    expect(errors[0].message).to.be(finalMessage);
    return ast;
  });
};
