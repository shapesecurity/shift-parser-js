/**
 * Copyright 2016 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { GenericParser } = require('./parser');
const { JsError } = require('./tokenizer');
const { EarlyErrorChecker } = require('./early-errors');
const { isLineTerminator } = require('./utils');
const { Tokenizer, TokenClass, TokenType } = require('./tokenizer');

class ParserWithLocation extends GenericParser {
  constructor(source) {
    super(source);
    this.locations = new WeakMap;
    this.comments = [];
  }

  startNode() {
    return this.getLocation();
  }

  finishNode(node, start) {
    if (node.type === 'Script' || node.type === 'Module') {
      this.locations.set(node, {
        start: { line: 1, column: 0, offset: 0 },
        end: this.getLocation(),
      });
      return node;
    }
    if (node.type === 'TemplateExpression') {
      // Adjust TemplateElements to not include surrounding backticks or braces
      for (let i = 0; i < node.elements.length; i += 2) {
        const endAdjustment = i < node.elements.length - 1 ? 2 : 1; // discard '${' or '`' respectively
        const element = node.elements[i];
        const location = this.locations.get(element);
        this.locations.set(element, {
          start: { line: location.start.line, column: location.start.column + 1, offset: location.start.offset + 1 }, // discard '}' or '`'
          end: { line: location.end.line, column: location.end.column - endAdjustment, offset: location.end.offset - endAdjustment },
        });
      }
    }
    this.locations.set(node, {
      start,
      end: this.getLastTokenEndLocation(),
    });
    return node;
  }

  copyNode(src, dest) {
    this.locations.set(dest, this.locations.get(src)); // todo check undefined
    return dest;
  }

  skipSingleLineComment(offset) {
    // We're actually extending the *tokenizer*, here.
    const start = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const c = this.source[this.index];
    const type = c === '/' ? 'SingleLine' : c === '<' ? 'HTMLOpen' : 'HTMLClose';

    super.skipSingleLineComment(offset);

    const end = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const trailingLineTerminatorCharacters = this.source[this.index - 2] === '\r' ? 2 : isLineTerminator(this.source.charCodeAt(this.index - 1)) ? 1 : 0;
    const text = this.source.substring(start.offset + offset, end.offset - trailingLineTerminatorCharacters);

    this.comments.push({ text, type, start, end });
  }

  skipMultiLineComment() {
    const start = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const type = 'MultiLine';

    const retval = super.skipMultiLineComment();

    const end = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const text = this.source.substring(start.offset + 2, end.offset - 2);

    this.comments.push({ text, type, start, end });

    return retval;
  }
}

function generateInterface(parsingFunctionName) {
  return function parse(code, { earlyErrors = true } = {}) {
    let parser = new GenericParser(code);
    let tree = parser[parsingFunctionName]();
    if (earlyErrors) {
      let errors = EarlyErrorChecker.check(tree);
      // for now, just throw the first error; we will handle multiple errors later
      if (errors.length > 0) {
        throw new JsError(0, 1, 0, errors[0].message);
      }
    }
    return tree;
  };
}

function generateInterfaceWithLocation(parsingFunctionName) {
  return function parse(code, { earlyErrors = true } = {}) {
    let parser = new ParserWithLocation(code);
    let tree = parser[parsingFunctionName]();
    if (earlyErrors) {
      let errors = EarlyErrorChecker.check(tree);
      // for now, just throw the first error; we will handle multiple errors later
      if (errors.length > 0) {
        let { node, message } = errors[0];
        let { offset, line, column } = parser.locations.get(node).start;
        throw new JsError(offset, line, column, message);
      }
    }
    return { tree, locations: parser.locations, comments: parser.comments };
  };
}

const parseScript = generateInterface('parseScript');
const parseModule = generateInterface('parseModule');
const parseModuleWithLocation = generateInterfaceWithLocation('parseModule');
const parseScriptWithLocation = generateInterfaceWithLocation('parseScript');

module.exports = {
  default: parseScript,
  parseScript,
  parseModule,
  parseModuleWithLocation,
  parseScriptWithLocation,
  EarlyErrorChecker,
  GenericParser,
  ParserWithLocation,
  Tokenizer,
  TokenClass,
  TokenType,
};
