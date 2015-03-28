// istanbul ignore next
"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

// istanbul ignore next

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// istanbul ignore next

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * Copyright 2014 Shape Security, Inc.
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

var _utils = require("./utils");

var getHexValue = _utils.getHexValue;
var isLineTerminator = _utils.isLineTerminator;
var isWhiteSpace = _utils.isWhiteSpace;
var isIdentifierStart = _utils.isIdentifierStart;
var isIdentifierPart = _utils.isIdentifierPart;
var isDecimalDigit = _utils.isDecimalDigit;

var ErrorMessages = require("./errors").ErrorMessages;

var TokenClass = {
  Eof: { name: "<End>" },
  Ident: { name: "Identifier", isIdentifierName: true },
  Keyword: { name: "Keyword", isIdentifierName: true },
  NumericLiteral: { name: "Numeric" },
  TemplateElement: { name: "Template" },
  Punctuator: { name: "Punctuator" },
  StringLiteral: { name: "String" },
  RegularExpression: { name: "RegularExpression" },
  LineComment: { name: "Line" },
  BlockComment: { name: "Block" },
  Illegal: { name: "Illegal" }
};

exports.TokenClass = TokenClass;
var TokenType = {
  EOS: { klass: TokenClass.Eof, name: "EOS" },
  LPAREN: { klass: TokenClass.Punctuator, name: "(" },
  RPAREN: { klass: TokenClass.Punctuator, name: ")" },
  LBRACK: { klass: TokenClass.Punctuator, name: "[" },
  RBRACK: { klass: TokenClass.Punctuator, name: "]" },
  LBRACE: { klass: TokenClass.Punctuator, name: "{" },
  RBRACE: { klass: TokenClass.Punctuator, name: "}" },
  COLON: { klass: TokenClass.Punctuator, name: ":" },
  SEMICOLON: { klass: TokenClass.Punctuator, name: ";" },
  PERIOD: { klass: TokenClass.Punctuator, name: "." },
  ELLIPSIS: { klass: TokenClass.Punctuator, name: "..." },
  ARROW: { klass: TokenClass.Punctuator, name: "=>" },
  CONDITIONAL: { klass: TokenClass.Punctuator, name: "?" },
  INC: { klass: TokenClass.Punctuator, name: "++" },
  DEC: { klass: TokenClass.Punctuator, name: "--" },
  ASSIGN: { klass: TokenClass.Punctuator, name: "=" },
  ASSIGN_BIT_OR: { klass: TokenClass.Punctuator, name: "|=" },
  ASSIGN_BIT_XOR: { klass: TokenClass.Punctuator, name: "^=" },
  ASSIGN_BIT_AND: { klass: TokenClass.Punctuator, name: "&=" },
  ASSIGN_SHL: { klass: TokenClass.Punctuator, name: "<<=" },
  ASSIGN_SHR: { klass: TokenClass.Punctuator, name: ">>=" },
  ASSIGN_SHR_UNSIGNED: { klass: TokenClass.Punctuator, name: ">>>=" },
  ASSIGN_ADD: { klass: TokenClass.Punctuator, name: "+=" },
  ASSIGN_SUB: { klass: TokenClass.Punctuator, name: "-=" },
  ASSIGN_MUL: { klass: TokenClass.Punctuator, name: "*=" },
  ASSIGN_DIV: { klass: TokenClass.Punctuator, name: "/=" },
  ASSIGN_MOD: { klass: TokenClass.Punctuator, name: "%=" },
  COMMA: { klass: TokenClass.Punctuator, name: "," },
  OR: { klass: TokenClass.Punctuator, name: "||" },
  AND: { klass: TokenClass.Punctuator, name: "&&" },
  BIT_OR: { klass: TokenClass.Punctuator, name: "|" },
  BIT_XOR: { klass: TokenClass.Punctuator, name: "^" },
  BIT_AND: { klass: TokenClass.Punctuator, name: "&" },
  SHL: { klass: TokenClass.Punctuator, name: "<<" },
  SHR: { klass: TokenClass.Punctuator, name: ">>" },
  SHR_UNSIGNED: { klass: TokenClass.Punctuator, name: ">>>" },
  ADD: { klass: TokenClass.Punctuator, name: "+" },
  SUB: { klass: TokenClass.Punctuator, name: "-" },
  MUL: { klass: TokenClass.Punctuator, name: "*" },
  DIV: { klass: TokenClass.Punctuator, name: "/" },
  MOD: { klass: TokenClass.Punctuator, name: "%" },
  EQ: { klass: TokenClass.Punctuator, name: "==" },
  NE: { klass: TokenClass.Punctuator, name: "!=" },
  EQ_STRICT: { klass: TokenClass.Punctuator, name: "===" },
  NE_STRICT: { klass: TokenClass.Punctuator, name: "!==" },
  LT: { klass: TokenClass.Punctuator, name: "<" },
  GT: { klass: TokenClass.Punctuator, name: ">" },
  LTE: { klass: TokenClass.Punctuator, name: "<=" },
  GTE: { klass: TokenClass.Punctuator, name: ">=" },
  INSTANCEOF: { klass: TokenClass.Keyword, name: "instanceof" },
  IN: { klass: TokenClass.Keyword, name: "in" },
  NOT: { klass: TokenClass.Punctuator, name: "!" },
  BIT_NOT: { klass: TokenClass.Punctuator, name: "~" },
  DELETE: { klass: TokenClass.Keyword, name: "delete" },
  TYPEOF: { klass: TokenClass.Keyword, name: "typeof" },
  VOID: { klass: TokenClass.Keyword, name: "void" },
  BREAK: { klass: TokenClass.Keyword, name: "break" },
  CASE: { klass: TokenClass.Keyword, name: "case" },
  CATCH: { klass: TokenClass.Keyword, name: "catch" },
  CLASS: { klass: TokenClass.Keyword, name: "class" },
  CONTINUE: { klass: TokenClass.Keyword, name: "continue" },
  DEBUGGER: { klass: TokenClass.Keyword, name: "debugger" },
  DEFAULT: { klass: TokenClass.Keyword, name: "default" },
  DO: { klass: TokenClass.Keyword, name: "do" },
  ELSE: { klass: TokenClass.Keyword, name: "else" },
  EXPORT: { klass: TokenClass.Keyword, name: "export" },
  EXTENDS: { klass: TokenClass.Keyword, name: "extends" },
  FINALLY: { klass: TokenClass.Keyword, name: "finally" },
  FOR: { klass: TokenClass.Keyword, name: "for" },
  FUNCTION: { klass: TokenClass.Keyword, name: "function" },
  IF: { klass: TokenClass.Keyword, name: "if" },
  IMPORT: { klass: TokenClass.Keyword, name: "import" },
  LET: { klass: TokenClass.Keyword, name: "let" },
  NEW: { klass: TokenClass.Keyword, name: "new" },
  RETURN: { klass: TokenClass.Keyword, name: "return" },
  SUPER: { klass: TokenClass.Keyword, name: "super" },
  SWITCH: { klass: TokenClass.Keyword, name: "switch" },
  THIS: { klass: TokenClass.Keyword, name: "this" },
  THROW: { klass: TokenClass.Keyword, name: "throw" },
  TRY: { klass: TokenClass.Keyword, name: "try" },
  VAR: { klass: TokenClass.Keyword, name: "var" },
  WHILE: { klass: TokenClass.Keyword, name: "while" },
  WITH: { klass: TokenClass.Keyword, name: "with" },
  NULL: { klass: TokenClass.Keyword, name: "null" },
  TRUE: { klass: TokenClass.Keyword, name: "true" },
  FALSE: { klass: TokenClass.Keyword, name: "false" },
  YIELD: { klass: TokenClass.Keyword, name: "yield" },
  NUMBER: { klass: TokenClass.NumericLiteral, name: "" },
  STRING: { klass: TokenClass.StringLiteral, name: "" },
  REGEXP: { klass: TokenClass.RegularExpression, name: "" },
  IDENTIFIER: { klass: TokenClass.Ident, name: "" },
  CONST: { klass: TokenClass.Keyword, name: "const" },
  TEMPLATE: { klass: TokenClass.TemplateElement, name: "" },
  ILLEGAL: { klass: TokenClass.Illegal, name: "" }
};

exports.TokenType = TokenType;
var TT = TokenType;
var I = TT.ILLEGAL;
var F = false;
var T = true;

var ONE_CHAR_PUNCTUATOR = [I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.NOT, I, I, I, TT.MOD, TT.BIT_AND, I, TT.LPAREN, TT.RPAREN, TT.MUL, TT.ADD, TT.COMMA, TT.SUB, TT.PERIOD, TT.DIV, I, I, I, I, I, I, I, I, I, I, TT.COLON, TT.SEMICOLON, TT.LT, TT.ASSIGN, TT.GT, TT.CONDITIONAL, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACK, I, TT.RBRACK, TT.BIT_XOR, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACE, TT.BIT_OR, TT.RBRACE, TT.BIT_NOT];

var PUNCTUATOR_START = [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, T, T, F, T, T, T, T, T, T, F, T, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, T, T, T, F];

var JsError = exports.JsError = (function (_Error) {
  function JsError(index, line, column, msg) {
    _classCallCheck(this, JsError);

    this.index = index;
    this.line = line;
    this.column = column;
    this.description = msg;
    this.message = "[" + line + ":" + column + "]: " + msg;
  }

  _inherits(JsError, _Error);

  return JsError;
})(Error);

function fromCodePoint(cp) {
  if (cp <= 65535) {
    return String.fromCharCode(cp);
  }var cu1 = String.fromCharCode(Math.floor((cp - 65536) / 1024) + 55296);
  var cu2 = String.fromCharCode((cp - 65536) % 1024 + 56320);
  return cu1 + cu2;
}

function decodeUtf16(lead, trail) {
  return (lead - 55296) * 1024 + (trail - 56320) + 65536;
}

var Tokenizer = (function () {
  function Tokenizer(source) {
    _classCallCheck(this, Tokenizer);

    this.source = source;
    this.index = 0;
    this.line = 0;
    this.lineStart = 0;
    this.startIndex = 0;
    this.startLine = 0;
    this.startLineStart = 0;
    this.lastIndex = 0;
    this.lastLine = 0;
    this.lastLineStart = 0;
    this.hasLineTerminatorBeforeNext = false;
    this.tokenIndex = 0;
  }

  _createClass(Tokenizer, {
    saveLexerState: {
      value: function saveLexerState() {
        return {
          source: this.source,
          index: this.index,
          line: this.line,
          lineStart: this.lineStart,
          startIndex: this.startIndex,
          startLine: this.startLine,
          startLineStart: this.startLineStart,
          lastIndex: this.lastIndex,
          lastLine: this.lastLine,
          lastLineStart: this.lastLineStart,
          lookahead: this.lookahead,
          hasLineTerminatorBeforeNext: this.hasLineTerminatorBeforeNext,
          tokenIndex: this.tokenIndex
        };
      }
    },
    restoreLexerState: {
      value: function restoreLexerState(state) {
        this.source = state.source;
        this.index = state.index;
        this.line = state.line;
        this.lineStart = state.lineStart;
        this.startIndex = state.startIndex;
        this.startLine = state.startLine;
        this.startLineStart = state.startLineStart;
        this.lastIndex = state.lastIndex;
        this.lastLine = state.lastLine;
        this.lastLineStart = state.lastLineStart;
        this.lookahead = state.lookahead;
        this.hasLineTerminatorBeforeNext = state.hasLineTerminatorBeforeNext;
        this.tokenIndex = state.tokenIndex;
      }
    },
    createILLEGAL: {
      value: function createILLEGAL() {
        this.startIndex = this.index;
        this.startLine = this.line;
        this.startLineStart = this.lineStart;
        return this.index < this.source.length ? this.createError(ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, this.source.charAt(this.index)) : this.createError(ErrorMessages.UNEXPECTED_EOS);
      }
    },
    createUnexpected: {
      value: function createUnexpected(token) {
        switch (token.type.klass) {
          case TokenClass.Eof:
            return this.createError(ErrorMessages.UNEXPECTED_EOS);
          case TokenClass.NumericLiteral:
            return this.createError(ErrorMessages.UNEXPECTED_NUMBER);
          case TokenClass.StringLiteral:
            return this.createError(ErrorMessages.UNEXPECTED_STRING);
          case TokenClass.Ident:
            return this.createError(ErrorMessages.UNEXPECTED_IDENTIFIER);
          case TokenClass.Keyword:
            return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.slice.text);
          case TokenClass.Punctuator:
            return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
        }
      }
    },
    createError: {
      value: function createError(message) {
        var _arguments = arguments;

        /* istanbul ignore next */
        var msg = message.replace(/{(\d+)}/g, function (_, n) {
          return JSON.stringify(_arguments[+n + 1]);
        });
        return new JsError(this.startIndex, this.startLine + 1, this.startIndex - this.startLineStart + 1, msg);
      }
    },
    createErrorWithLocation: {
      value: function createErrorWithLocation(location, message) {
        var _arguments = arguments;

        /* istanbul ignore next */
        var msg = message.replace(/{(\d+)}/g, function (_, n) {
          return JSON.stringify(_arguments[+n + 2]);
        });
        if (location.slice && location.slice.startLocation) {
          location = location.slice.startLocation;
        }
        return new JsError(location.offset, location.line, location.column + 1, msg);
      }
    },
    skipSingleLineComment: {
      value: function skipSingleLineComment(offset) {
        this.index += offset;
        while (this.index < this.source.length) {
          /**
           * @type {Number}
           */
          var chCode = this.source.charCodeAt(this.index);
          this.index++;
          if (isLineTerminator(chCode)) {
            this.hasLineTerminatorBeforeNext = true;
            if (chCode === 13 /* "\r" */ && this.source.charCodeAt(this.index) === 10 /*"\n" */) {
              this.index++;
            }
            this.lineStart = this.index;
            this.line++;
            return;
          }
        }
      }
    },
    skipMultiLineComment: {
      value: function skipMultiLineComment() {
        this.index += 2;
        var length = this.source.length;
        var isLineStart = false;
        while (this.index < length) {
          var chCode = this.source.charCodeAt(this.index);
          if (chCode < 128) {
            switch (chCode) {
              case 42:
                // "*"
                // Block comment ends with "*/".
                if (this.source.charAt(this.index + 1) === "/") {
                  this.index = this.index + 2;
                  return isLineStart;
                }
                this.index++;
                break;
              case 10:
                // "\n"
                isLineStart = true;
                this.hasLineTerminatorBeforeNext = true;
                this.index++;
                this.lineStart = this.index;
                this.line++;
                break;
              case 13:
                // "\r":
                isLineStart = true;
                this.hasLineTerminatorBeforeNext = true;
                if (this.source.charAt(this.index + 1) === "\n") {
                  this.index++;
                }
                this.index++;
                this.lineStart = this.index;
                this.line++;
                break;
              default:
                this.index++;
            }
          } else if (chCode === 8232 || chCode === 8233) {
            isLineStart = true;
            this.hasLineTerminatorBeforeNext = true;
            this.index++;
            this.lineStart = this.index;
            this.line++;
          } else {
            this.index++;
          }
        }
        throw this.createILLEGAL();
      }
    },
    skipComment: {
      value: function skipComment() {
        this.hasLineTerminatorBeforeNext = false;

        var isLineStart = this.index === 0;
        var length = this.source.length;

        while (this.index < length) {
          var chCode = this.source.charCodeAt(this.index);
          if (isWhiteSpace(chCode)) {
            this.index++;
          } else if (isLineTerminator(chCode)) {
            this.hasLineTerminatorBeforeNext = true;
            this.index++;
            if (chCode === 13 /* "\r" */ && this.source.charAt(this.index) === "\n") {
              this.index++;
            }
            this.lineStart = this.index;
            this.line++;
            isLineStart = true;
          } else if (chCode === 47 /* "/" */) {
            if (this.index + 1 >= length) {
              break;
            }
            chCode = this.source.charCodeAt(this.index + 1);
            if (chCode === 47 /* "/" */) {
              this.skipSingleLineComment(2);
              isLineStart = true;
            } else if (chCode === 42 /* "*" */) {
              isLineStart = this.skipMultiLineComment() || isLineStart;
            } else {
              break;
            }
          } else if (!this.module && isLineStart && chCode === 45 /* "-" */) {
            if (this.index + 2 >= length) {
              break;
            }
            // U+003E is ">"
            if (this.source.charAt(this.index + 1) === "-" && this.source.charAt(this.index + 2) === ">") {
              // "-->" is a single-line comment
              this.skipSingleLineComment(3);
            } else {
              break;
            }
          } else if (!this.module && chCode === 60 /* "<" */) {
            if (this.source.slice(this.index + 1, this.index + 4) === "!--") {
              this.skipSingleLineComment(4);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
    },
    scanHexEscape2: {
      value: function scanHexEscape2() {
        if (this.index + 2 > this.source.length) {
          return -1;
        }
        var r1 = getHexValue(this.source.charAt(this.index));
        if (r1 === -1) {
          return -1;
        }
        var r2 = getHexValue(this.source.charAt(this.index + 1));
        if (r2 === -1) {
          return -1;
        }
        this.index += 2;
        return r1 << 4 | r2;
      }
    },
    scanUnicode: {
      value: function scanUnicode() {
        if (this.source.charAt(this.index) === "{") {
          //\u{HexDigits}
          var i = this.index + 1;
          var hexDigits = 0,
              ch = undefined;
          while (i < this.source.length) {
            ch = this.source.charAt(i);
            var hex = getHexValue(ch);
            if (hex === -1) {
              break;
            }
            hexDigits = hexDigits << 4 | hex;
            if (hexDigits > 1114111) {
              throw this.createILLEGAL();
            }
            i++;
          }
          if (ch !== "}") {
            throw this.createILLEGAL();
          }
          this.index = i + 1;
          return hexDigits;
        } else {
          //\uHex4Digits
          if (this.index + 4 > this.source.length) {
            return -1;
          }
          var r1 = getHexValue(this.source.charAt(this.index));
          if (r1 === -1) {
            return -1;
          }
          var r2 = getHexValue(this.source.charAt(this.index + 1));
          if (r2 === -1) {
            return -1;
          }
          var r3 = getHexValue(this.source.charAt(this.index + 2));
          if (r3 === -1) {
            return -1;
          }
          var r4 = getHexValue(this.source.charAt(this.index + 3));
          if (r4 === -1) {
            return -1;
          }
          this.index += 4;
          return r1 << 12 | r2 << 8 | r3 << 4 | r4;
        }
      }
    },
    getEscapedIdentifier: {
      value: function getEscapedIdentifier() {
        var id = "";
        var check = isIdentifierStart;

        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          var code = ch.charCodeAt(0);
          var start = this.index;
          ++this.index;
          if (ch === "\\") {
            if (this.index >= this.source.length) {
              throw this.createILLEGAL();
            }
            if (this.source.charAt(this.index) !== "u") {
              throw this.createILLEGAL();
            }
            ++this.index;
            code = this.scanUnicode();
            if (code < 0) {
              throw this.createILLEGAL();
            }
            if (55296 <= code && code <= 56319) {
              if (this.source.charAt(this.index) !== "\\") {
                throw this.createILLEGAL();
              }
              ++this.index;
              if (this.index >= this.source.length) {
                throw this.createILLEGAL();
              }
              if (this.source.charAt(this.index) !== "u") {
                throw this.createILLEGAL();
              }
              ++this.index;
              var lowSurrogateCode = this.scanUnicode();
              if (!(56320 <= lowSurrogateCode && lowSurrogateCode <= 57343)) {
                throw this.createILLEGAL();
              }
              code = decodeUtf16(code, lowSurrogateCode);
            }
            ch = fromCodePoint(code);
          } else if (55296 <= code && code <= 56319) {
            if (this.index >= this.source.length) {
              throw this.createILLEGAL();
            }
            var lowSurrogateCode = this.source.charCodeAt(this.index);
            ++this.index;
            if (!(56320 <= lowSurrogateCode && lowSurrogateCode <= 57343)) {
              throw this.createILLEGAL();
            }
            code = decodeUtf16(code, lowSurrogateCode);
            ch = fromCodePoint(code);
          }
          if (!check(code)) {
            if (id.length < 1) {
              throw this.createILLEGAL();
            }
            this.index = start;
            return id;
          }
          check = isIdentifierPart;
          id += ch;
        }
        return id;
      }
    },
    getIdentifier: {
      value: function getIdentifier() {
        var start = this.index;
        var l = this.source.length;
        var i = this.index;
        var check = isIdentifierStart;
        while (i < l) {
          var ch = this.source.charAt(i);
          var code = ch.charCodeAt(0);
          if (ch === "\\" || 55296 <= code && code <= 56319) {
            // Go back and try the hard one.
            this.index = start;
            return this.getEscapedIdentifier();
          }
          if (!check(code)) {
            this.index = i;
            return this.source.slice(start, i);
          }
          ++i;
          check = isIdentifierPart;
        }
        this.index = i;
        return this.source.slice(start, i);
      }
    },
    scanIdentifier: {
      value: function scanIdentifier() {
        var startLocation = this.getLocation();
        var start = this.index;

        // Backslash (U+005C) starts an escaped character.
        var id = this.source.charAt(this.index) === "\\" ? this.getEscapedIdentifier() : this.getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        var slice = this.getSlice(start, startLocation);
        slice.text = id;

        return { type: Tokenizer.getKeyword(id), value: id, slice: slice };
      }
    },
    getLocation: {
      value: function getLocation() {
        return {
          line: this.startLine + 1,
          column: this.startIndex - this.startLineStart,
          offset: this.startIndex
        };
      }
    },
    getSlice: {
      value: function getSlice(start, startLocation) {
        return { text: this.source.slice(start, this.index), start: start, startLocation: startLocation, end: this.index };
      }
    },
    scanPunctuatorHelper: {
      value: function scanPunctuatorHelper() {
        var ch1 = this.source.charAt(this.index);

        switch (ch1) {
          // Check for most common single-character punctuators.
          case ".":
            var ch2 = this.source.charAt(this.index + 1);
            if (ch2 !== ".") {
              return TokenType.PERIOD;
            }var ch3 = this.source.charAt(this.index + 2);
            if (ch3 !== ".") {
              return TokenType.PERIOD;
            }return TokenType.ELLIPSIS;
          case "(":
            return TokenType.LPAREN;
          case ")":
          case ";":
          case ",":
            return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
          case "{":
            return TokenType.LBRACE;
          case "}":
          case "[":
          case "]":
          case ":":
          case "?":
          case "~":
            return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
          default:
            // "=" (U+003D) marks an assignment or comparison operator.
            if (this.index + 1 < this.source.length && this.source.charAt(this.index + 1) === "=") {
              switch (ch1) {
                case "=":
                  if (this.index + 2 < this.source.length && this.source.charAt(this.index + 2) === "=") {
                    return TokenType.EQ_STRICT;
                  }
                  return TokenType.EQ;
                case "!":
                  if (this.index + 2 < this.source.length && this.source.charAt(this.index + 2) === "=") {
                    return TokenType.NE_STRICT;
                  }
                  return TokenType.NE;
                case "|":
                  return TokenType.ASSIGN_BIT_OR;
                case "+":
                  return TokenType.ASSIGN_ADD;
                case "-":
                  return TokenType.ASSIGN_SUB;
                case "*":
                  return TokenType.ASSIGN_MUL;
                case "<":
                  return TokenType.LTE;
                case ">":
                  return TokenType.GTE;
                case "/":
                  return TokenType.ASSIGN_DIV;
                case "%":
                  return TokenType.ASSIGN_MOD;
                case "^":
                  return TokenType.ASSIGN_BIT_XOR;
                case "&":
                  return TokenType.ASSIGN_BIT_AND;
                // istanbul ignore next
                default:
                  break; //failed
              }
            }
        }

        if (this.index + 1 < this.source.length) {
          var _ch2 = this.source.charAt(this.index + 1);
          if (ch1 === _ch2) {
            if (this.index + 2 < this.source.length) {
              var _ch3 = this.source.charAt(this.index + 2);
              if (ch1 === ">" && _ch3 === ">") {
                // 4-character punctuator: >>>=
                if (this.index + 3 < this.source.length && this.source.charAt(this.index + 3) === "=") {
                  return TokenType.ASSIGN_SHR_UNSIGNED;
                }
                return TokenType.SHR_UNSIGNED;
              }

              if (ch1 === "<" && _ch3 === "=") {
                return TokenType.ASSIGN_SHL;
              }

              if (ch1 === ">" && _ch3 === "=") {
                return TokenType.ASSIGN_SHR;
              }
            }
            // Other 2-character punctuators: ++ -- << >> && ||
            switch (ch1) {
              case "+":
                return TokenType.INC;
              case "-":
                return TokenType.DEC;
              case "<":
                return TokenType.SHL;
              case ">":
                return TokenType.SHR;
              case "&":
                return TokenType.AND;
              case "|":
                return TokenType.OR;
              // istanbul ignore next
              default:
                break; //failed
            }
          } else if (ch1 === "=" && _ch2 === ">") {
            return TokenType.ARROW;
          }
        }

        return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
      }
    },
    scanPunctuator: {

      // 7.7 Punctuators

      value: function scanPunctuator() {
        var startLocation = this.getLocation();
        var start = this.index;
        var subType = this.scanPunctuatorHelper();
        this.index += subType.name.length;
        return { type: subType, value: subType.name, slice: this.getSlice(start, startLocation) };
      }
    },
    scanHexLiteral: {
      value: function scanHexLiteral(start, startLocation) {
        var i = this.index;
        while (i < this.source.length) {
          var ch = this.source.charAt(i);
          var hex = getHexValue(ch);
          if (hex === -1) {
            break;
          }
          i++;
        }

        if (this.index === i) {
          throw this.createILLEGAL();
        }

        if (i < this.source.length && isIdentifierStart(this.source.charCodeAt(i))) {
          throw this.createILLEGAL();
        }

        this.index = i;

        var slice = this.getSlice(start, startLocation);
        return { type: TokenType.NUMBER, value: parseInt(slice.text.substr(2), 16), slice: slice };
      }
    },
    scanBinaryLiteral: {
      value: function scanBinaryLiteral(start, startLocation) {
        var offset = this.index - start;

        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (ch !== "0" && ch !== "1") {
            break;
          }
          this.index++;
        }

        if (this.index - start <= offset) {
          throw this.createILLEGAL();
        }

        if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index)) || isDecimalDigit(this.source.charCodeAt(this.index)))) {
          throw this.createILLEGAL();
        }

        return {
          type: TokenType.NUMBER,
          value: parseInt(this.getSlice(start, startLocation).text.substr(offset), 2),
          slice: this.getSlice(start, startLocation),
          octal: false
        };
      }
    },
    scanOctalLiteral: {
      value: function scanOctalLiteral(start, startLocation) {
        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if ("0" <= ch && ch <= "7") {
            this.index++;
          } else if (isIdentifierPart(ch.charCodeAt(0))) {
            throw this.createILLEGAL();
          } else {
            break;
          }
        }

        if (this.index - start === 2) {
          throw this.createILLEGAL();
        }

        return {
          type: TokenType.NUMBER,
          value: parseInt(this.getSlice(start, startLocation).text.substr(2), 8),
          slice: this.getSlice(start, startLocation),
          octal: false
        };
      }
    },
    scanLegacyOctalLiteral: {
      value: function scanLegacyOctalLiteral(start, startLocation) {
        var isOctal = true;

        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if ("0" <= ch && ch <= "7") {
            this.index++;
          } else if (ch === "8" || ch === "9") {
            isOctal = false;
            this.index++;
          } else if (isIdentifierPart(ch.charCodeAt(0))) {
            throw this.createILLEGAL();
          } else {
            break;
          }
        }

        return {
          type: TokenType.NUMBER,
          slice: this.getSlice(start, startLocation),
          value: parseInt(this.getSlice(start, startLocation).text.substr(1), isOctal ? 8 : 10),
          octal: true
        };
      }
    },
    scanNumericLiteral: {
      value: function scanNumericLiteral() {
        var ch = this.source.charAt(this.index);
        // assert(ch === "." || "0" <= ch && ch <= "9")
        var startLocation = this.getLocation();
        var start = this.index;

        if (ch === "0") {
          this.index++;
          if (this.index < this.source.length) {
            ch = this.source.charAt(this.index);
            if (ch === "x" || ch === "X") {
              this.index++;
              return this.scanHexLiteral(start, startLocation);
            } else if (ch === "b" || ch === "B") {
              this.index++;
              return this.scanBinaryLiteral(start, startLocation);
            } else if (ch === "o" || ch === "O") {
              this.index++;
              return this.scanOctalLiteral(start, startLocation);
            } else if ("0" <= ch && ch <= "9") {
              return this.scanLegacyOctalLiteral(start, startLocation);
            }
          } else {
            var slice = this.getSlice(start, startLocation);
            return {
              type: TokenType.NUMBER,
              value: +slice.text,
              slice: slice,
              octal: false
            };
          }
        } else if (ch !== ".") {
          // Must be "1".."9"
          ch = this.source.charAt(this.index);
          while ("0" <= ch && ch <= "9") {
            this.index++;
            if (this.index === this.source.length) {
              var slice = this.getSlice(start, startLocation);
              return {
                type: TokenType.NUMBER,
                value: +slice.text,
                slice: slice,
                octal: false
              };
            }
            ch = this.source.charAt(this.index);
          }
        }

        var e = 0;
        if (ch === ".") {
          this.index++;
          if (this.index === this.source.length) {
            var slice = this.getSlice(start, startLocation);
            return {
              type: TokenType.NUMBER,
              value: +slice.text,
              slice: slice,
              octal: false
            };
          }

          ch = this.source.charAt(this.index);
          while ("0" <= ch && ch <= "9") {
            e++;
            this.index++;
            if (this.index === this.source.length) {
              var slice = this.getSlice(start, startLocation);
              return {
                type: TokenType.NUMBER,
                value: +slice.text,
                slice: slice,
                octal: false
              };
            }
            ch = this.source.charAt(this.index);
          }
        }

        // EOF not reached here
        if (ch === "e" || ch === "E") {
          this.index++;
          if (this.index === this.source.length) {
            throw this.createILLEGAL();
          }

          ch = this.source.charAt(this.index);
          var neg = false;
          if (ch === "+" || ch === "-") {
            neg = ch === "-";
            this.index++;
            if (this.index === this.source.length) {
              throw this.createILLEGAL();
            }
            ch = this.source.charAt(this.index);
          }

          var f = 0;
          if ("0" <= ch && ch <= "9") {
            while ("0" <= ch && ch <= "9") {
              f *= 10;
              f += +ch;
              this.index++;
              if (this.index === this.source.length) {
                break;
              }
              ch = this.source.charAt(this.index);
            }
          } else {
            throw this.createILLEGAL();
          }
          e += neg ? f : -f;
        }

        if (isIdentifierStart(ch.charCodeAt(0))) {
          throw this.createILLEGAL();
        }

        {
          var slice = this.getSlice(start, startLocation);
          return {
            type: TokenType.NUMBER,
            value: +slice.text,
            slice: slice,
            octal: false
          };
        }
      }
    },
    scanStringEscape: {
      value: function scanStringEscape(str, octal) {
        this.index++;
        if (this.index === this.source.length) {
          throw this.createILLEGAL();
        }
        var ch = this.source.charAt(this.index);
        if (!isLineTerminator(ch.charCodeAt(0))) {
          switch (ch) {
            case "n":
              str += "\n";
              this.index++;
              break;
            case "r":
              str += "\r";
              this.index++;
              break;
            case "t":
              str += "\t";
              this.index++;
              break;
            case "u":
            case "x":
              var restore = this.index;
              var unescaped = undefined;
              this.index++;
              if (this.index >= this.source.length) {
                throw this.createILLEGAL();
              }
              unescaped = ch === "u" ? this.scanUnicode() : this.scanHexEscape2();
              if (unescaped < 0) {
                throw this.createILLEGAL();
              }
              str += fromCodePoint(unescaped);
              break;
            case "b":
              str += "\b";
              this.index++;
              break;
            case "f":
              str += "\f";
              this.index++;
              break;
            case "v":
              str += "\u000b";
              this.index++;
              break;
            default:
              if ("0" <= ch && ch <= "7") {
                var octLen = 1;
                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ("0" <= ch && ch <= "3") {
                  octLen = 0;
                }
                var code = 0;
                while (octLen < 3 && "0" <= ch && ch <= "7") {
                  if (octLen > 0 || ch !== "0") {
                    octal = true;
                  }
                  code *= 8;
                  octLen++;
                  code += ch - "0";
                  this.index++;
                  if (this.index === this.source.length) {
                    throw this.createILLEGAL();
                  }
                  ch = this.source.charAt(this.index);
                }
                str += String.fromCharCode(code);
              } else if (ch === "8" || ch === "9") {
                throw this.createILLEGAL();
              } else {
                str += ch;
                this.index++;
              }
          }
        } else {
          this.index++;
          if (ch === "\r" && this.source.charAt(this.index) === "\n") {
            this.index++;
          }
          this.lineStart = this.index;
          this.line++;
        }
        return [str, octal];
      }
    },
    scanStringLiteral: {
      // 7.8.4 String Literals

      value: function scanStringLiteral() {
        var str = "";

        var quote = this.source.charAt(this.index);
        //  assert((quote === "\"" || quote === """), "String literal must starts with a quote")

        var startLocation = this.getLocation();
        var start = this.index;
        this.index++;

        var octal = false;
        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (ch === quote) {
            this.index++;
            return { type: TokenType.STRING, slice: this.getSlice(start, startLocation), str: str, octal: octal };
          } else if (ch === "\\") {
            var _ref = this.scanStringEscape(str, octal);

            var _ref2 = _slicedToArray(_ref, 2);

            str = _ref2[0];
            octal = _ref2[1];
          } else if (isLineTerminator(ch.charCodeAt(0))) {
            throw this.createILLEGAL();
          } else {
            str += ch;
            this.index++;
          }
        }

        throw this.createILLEGAL();
      }
    },
    scanTemplateElement: {
      value: function scanTemplateElement() {
        var startLocation = this.getLocation();
        var start = this.index;
        this.index++;
        while (this.index < this.source.length) {
          var ch = this.source.charCodeAt(this.index);
          switch (ch) {
            case 96:
              // `
              this.index++;
              return { type: TokenType.TEMPLATE, tail: true, slice: this.getSlice(start, startLocation) };
            case 36:
              // $
              if (this.source.charCodeAt(this.index + 1) === 123) {
                // {
                this.index += 2;
                return { type: TokenType.TEMPLATE, tail: false, slice: this.getSlice(start, startLocation) };
              }
              this.index++;
              break;
            case 92:
              // \\
              {
                var _location = this.getLocation();
                var octal = this.scanStringEscape("", false)[1];
                if (octal) {
                  throw this.createILLEGAL();
                }
                break;
              }
            default:
              this.index++;
          }
        }

        throw this.createILLEGAL();
      }
    },
    scanRegExp: {
      value: function scanRegExp(str) {
        var startLocation = this.getLocation();
        var start = this.index;

        var terminated = false;
        var classMarker = false;
        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (ch === "\\") {
            str += ch;
            this.index++;
            ch = this.source.charAt(this.index);
            // ECMA-262 7.8.5
            if (isLineTerminator(ch.charCodeAt(0))) {
              throw this.createError(ErrorMessages.UNTERMINATED_REGEXP);
            }
            str += ch;
            this.index++;
          } else if (isLineTerminator(ch.charCodeAt(0))) {
            throw this.createError(ErrorMessages.UNTERMINATED_REGEXP);
          } else {
            if (classMarker) {
              if (ch === "]") {
                classMarker = false;
              }
            } else {
              if (ch === "/") {
                terminated = true;
                str += ch;
                this.index++;
                break;
              } else if (ch === "[") {
                classMarker = true;
              }
            }
            str += ch;
            this.index++;
          }
        }

        if (!terminated) {
          throw this.createError(ErrorMessages.UNTERMINATED_REGEXP);
        }

        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (ch === "\\") {
            throw this.createError(ErrorMessages.INVALID_REGEXP_FLAGS);
          }
          if (!isIdentifierPart(ch.charCodeAt(0))) {
            break;
          }
          this.index++;
          str += ch;
        }
        return { type: TokenType.REGEXP, value: str, slice: this.getSlice(start, startLocation) };
      }
    },
    advance: {
      value: function advance() {
        var startLocation = this.getLocation();

        this.lastIndex = this.index;
        this.lastLine = this.line;
        this.lastLineStart = this.lineStart;

        this.skipComment();

        this.startIndex = this.index;
        this.startLine = this.line;
        this.startLineStart = this.lineStart;

        if (this.lastIndex == 0) {
          this.lastIndex = this.index;
          this.lastLine = this.line;
          this.lastLineStart = this.lineStart;
        }

        if (this.index >= this.source.length) {
          return { type: TokenType.EOS, slice: this.getSlice(this.index, startLocation) };
        }

        var charCode = this.source.charCodeAt(this.index);

        if (charCode < 128) {
          if (PUNCTUATOR_START[charCode]) {
            return this.scanPunctuator();
          }

          if (isIdentifierStart(charCode) || charCode === 92 /* backslash (\) */) {
            return this.scanIdentifier();
          }

          // Dot (.) U+002E can also start a floating-polet number, hence the need
          // to check the next character.
          if (charCode === 46) {
            if (this.index + 1 < this.source.length && isDecimalDigit(this.source.charCodeAt(this.index + 1))) {
              return this.scanNumericLiteral();
            }
            return this.scanPunctuator();
          }

          // String literal starts with single quote (U+0027) or double quote (U+0022).
          if (charCode === 39 || charCode === 34) {
            return this.scanStringLiteral();
          }

          // Template literal starts with back quote (U+0060)
          if (charCode === 96) {
            return this.scanTemplateElement();
          }

          if (48 /* "0" */ <= charCode && charCode <= 57 /* "9" */) {
            return this.scanNumericLiteral();
          }

          // Slash (/) U+002F can also start a regex.
          throw this.createILLEGAL();
        } else {
          if (isIdentifierStart(charCode) || 55296 <= charCode && charCode <= 56319) {
            return this.scanIdentifier();
          }

          throw this.createILLEGAL();
        }
      }
    },
    eof: {
      value: function eof() {
        return this.lookahead.type === TokenType.EOS;
      }
    },
    lex: {
      value: function lex() {
        var prevToken = this.lookahead;
        this.lookahead = this.advance();
        this.tokenIndex++;
        return prevToken;
      }
    }
  }, {
    cse2: {
      value: function cse2(id, ch1, ch2) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2;
      }
    },
    cse3: {
      value: function cse3(id, ch1, ch2, ch3) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3;
      }
    },
    cse4: {
      value: function cse4(id, ch1, ch2, ch3, ch4) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4;
      }
    },
    cse5: {
      value: function cse5(id, ch1, ch2, ch3, ch4, ch5) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5;
      }
    },
    cse6: {
      value: function cse6(id, ch1, ch2, ch3, ch4, ch5, ch6) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6;
      }
    },
    cse7: {
      value: function cse7(id, ch1, ch2, ch3, ch4, ch5, ch6, ch7) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6 && id.charAt(7) === ch7;
      }
    },
    getKeyword: {
      value: function getKeyword(id) {
        if (id.length === 1 || id.length > 10) {
          return TokenType.IDENTIFIER;
        }

        /* istanbul ignore next */
        switch (id.length) {
          case 2:
            switch (id.charAt(0)) {
              case "i":
                switch (id.charAt(1)) {
                  case "f":
                    return TokenType.IF;
                  case "n":
                    return TokenType.IN;
                  default:
                    break;
                }
                break;
              case "d":
                if (id.charAt(1) === "o") {
                  return TokenType.DO;
                }
                break;
            }
            break;
          case 3:
            switch (id.charAt(0)) {
              case "v":
                if (Tokenizer.cse2(id, "a", "r")) {
                  return TokenType.VAR;
                }
                break;
              case "f":
                if (Tokenizer.cse2(id, "o", "r")) {
                  return TokenType.FOR;
                }
                break;
              case "n":
                if (Tokenizer.cse2(id, "e", "w")) {
                  return TokenType.NEW;
                }
                break;
              case "t":
                if (Tokenizer.cse2(id, "r", "y")) {
                  return TokenType.TRY;
                }
                break;
              case "l":
                if (Tokenizer.cse2(id, "e", "t")) {
                  return TokenType.LET;
                }
                break;
            }
            break;
          case 4:
            switch (id.charAt(0)) {
              case "t":
                if (Tokenizer.cse3(id, "h", "i", "s")) {
                  return TokenType.THIS;
                } else if (Tokenizer.cse3(id, "r", "u", "e")) {
                  return TokenType.TRUE;
                }
                break;
              case "n":
                if (Tokenizer.cse3(id, "u", "l", "l")) {
                  return TokenType.NULL;
                }
                break;
              case "e":
                if (Tokenizer.cse3(id, "l", "s", "e")) {
                  return TokenType.ELSE;
                }
                break;
              case "c":
                if (Tokenizer.cse3(id, "a", "s", "e")) {
                  return TokenType.CASE;
                }
                break;
              case "v":
                if (Tokenizer.cse3(id, "o", "i", "d")) {
                  return TokenType.VOID;
                }
                break;
              case "w":
                if (Tokenizer.cse3(id, "i", "t", "h")) {
                  return TokenType.WITH;
                }
                break;
            }
            break;
          case 5:
            switch (id.charAt(0)) {
              case "w":
                if (Tokenizer.cse4(id, "h", "i", "l", "e")) {
                  return TokenType.WHILE;
                }
                break;
              case "b":
                if (Tokenizer.cse4(id, "r", "e", "a", "k")) {
                  return TokenType.BREAK;
                }
                break;
              case "f":
                if (Tokenizer.cse4(id, "a", "l", "s", "e")) {
                  return TokenType.FALSE;
                }
                break;
              case "c":
                if (Tokenizer.cse4(id, "a", "t", "c", "h")) {
                  return TokenType.CATCH;
                } else if (Tokenizer.cse4(id, "o", "n", "s", "t")) {
                  return TokenType.CONST;
                } else if (Tokenizer.cse4(id, "l", "a", "s", "s")) {
                  return TokenType.CLASS;
                }
                break;
              case "t":
                if (Tokenizer.cse4(id, "h", "r", "o", "w")) {
                  return TokenType.THROW;
                }
                break;
              case "y":
                if (Tokenizer.cse4(id, "i", "e", "l", "d")) {
                  return TokenType.YIELD;
                }
                break;
              case "s":
                if (Tokenizer.cse4(id, "u", "p", "e", "r")) {
                  return TokenType.SUPER;
                }
                break;
            }
            break;
          case 6:
            switch (id.charAt(0)) {
              case "r":
                if (Tokenizer.cse5(id, "e", "t", "u", "r", "n")) {
                  return TokenType.RETURN;
                }
                break;
              case "t":
                if (Tokenizer.cse5(id, "y", "p", "e", "o", "f")) {
                  return TokenType.TYPEOF;
                }
                break;
              case "d":
                if (Tokenizer.cse5(id, "e", "l", "e", "t", "e")) {
                  return TokenType.DELETE;
                }
                break;
              case "s":
                if (Tokenizer.cse5(id, "w", "i", "t", "c", "h")) {
                  return TokenType.SWITCH;
                }
                break;
              case "e":
                if (Tokenizer.cse5(id, "x", "p", "o", "r", "t")) {
                  return TokenType.EXPORT;
                }
                break;
              case "i":
                if (Tokenizer.cse5(id, "m", "p", "o", "r", "t")) {
                  return TokenType.IMPORT;
                }
                break;
            }
            break;
          case 7:
            switch (id.charAt(0)) {
              case "d":
                if (Tokenizer.cse6(id, "e", "f", "a", "u", "l", "t")) {
                  return TokenType.DEFAULT;
                }
                break;
              case "f":
                if (Tokenizer.cse6(id, "i", "n", "a", "l", "l", "y")) {
                  return TokenType.FINALLY;
                }
                break;
              case "e":
                if (Tokenizer.cse6(id, "x", "t", "e", "n", "d", "s")) {
                  return TokenType.EXTENDS;
                }
                break;
            }
            break;
          case 8:
            switch (id.charAt(0)) {
              case "f":
                if (Tokenizer.cse7(id, "u", "n", "c", "t", "i", "o", "n")) {
                  return TokenType.FUNCTION;
                }
                break;
              case "c":
                if (Tokenizer.cse7(id, "o", "n", "t", "i", "n", "u", "e")) {
                  return TokenType.CONTINUE;
                }
                break;
              case "d":
                if (Tokenizer.cse7(id, "e", "b", "u", "g", "g", "e", "r")) {
                  return TokenType.DEBUGGER;
                }
                break;
            }
            break;
          case 10:
            if (id === "instanceof") {
              return TokenType.INSTANCEOF;
            }
            break;
        }
        return TokenType.IDENTIFIER;
      }
    }
  });

  return Tokenizer;
})();

exports["default"] = Tokenizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQWlCK0csU0FBUzs7SUFBaEgsV0FBVyxVQUFYLFdBQVc7SUFBRSxnQkFBZ0IsVUFBaEIsZ0JBQWdCO0lBQUUsWUFBWSxVQUFaLFlBQVk7SUFBRSxpQkFBaUIsVUFBakIsaUJBQWlCO0lBQUUsZ0JBQWdCLFVBQWhCLGdCQUFnQjtJQUFFLGNBQWMsVUFBZCxjQUFjOztJQUNoRyxhQUFhLFdBQU8sVUFBVSxFQUE5QixhQUFhOztBQUVkLElBQU0sVUFBVSxHQUFHO0FBQ3hCLEtBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDcEIsT0FBSyxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUM7QUFDbkQsU0FBTyxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUM7QUFDbEQsZ0JBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDakMsaUJBQWUsRUFBRSxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDbkMsWUFBVSxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUNoQyxlQUFhLEVBQUUsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQy9CLG1CQUFpQixFQUFFLEVBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFDO0FBQzlDLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsY0FBWSxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUM3QixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0NBQzNCLENBQUM7O1FBWlcsVUFBVSxHQUFWLFVBQVU7QUFjaEIsSUFBTSxTQUFTLEdBQUc7QUFDdkIsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN6QyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2hELFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDcEQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3JELE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDakQsYUFBVyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUN0RCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxlQUFhLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3pELGdCQUFjLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzFELGdCQUFjLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzFELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdkQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxxQkFBbUIsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDakUsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDaEQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxjQUFZLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3pELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsV0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN0RCxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3RELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDN0MsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM3QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBQztBQUMzRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsVUFBUSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBQztBQUN2RCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ3JELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDckQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FB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QUMsRUFBRSxDQUFDLEVBQ2xILEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDckgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDcEgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdEYsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENB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SUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztPQUM3SDs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDNUMsZUFBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztPQUNySjs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQ2pELGVBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFH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QVMsQ0FBQyxVQUFVLENBQUM7T0FDN0I7Ozs7U0F4VWtCLFNBQVM7OztxQkFBVCxTQUFTIiwiZmlsZSI6InNyYy90b2tlbml6ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG5pbXBvcnQge2dldEhleFZhbHVlLCBpc0xpbmVUZXJtaW5hdG9yLCBpc1doaXRlU3BhY2UsIGlzSWRlbnRpZmllclN0YXJ0LCBpc0lkZW50aWZpZXJQYXJ0LCBpc0RlY2ltYWxEaWdpdH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7RXJyb3JNZXNzYWdlc30gZnJvbSBcIi4vZXJyb3JzXCI7XG5cbmV4cG9ydCBjb25zdCBUb2tlbkNsYXNzID0ge1xuICBFb2Y6IHtuYW1lOiBcIjxFbmQ+XCJ9LFxuICBJZGVudDoge25hbWU6IFwiSWRlbnRpZmllclwiLCBpc0lkZW50aWZpZXJOYW1lOiB0cnVlfSxcbiAgS2V5d29yZDoge25hbWU6IFwiS2V5d29yZFwiLCBpc0lkZW50aWZpZXJOYW1lOiB0cnVlfSxcbiAgTnVtZXJpY0xpdGVyYWw6IHtuYW1lOiBcIk51bWVyaWNcIn0sXG4gIFRlbXBsYXRlRWxlbWVudDoge25hbWU6IFwiVGVtcGxhdGVcIn0sXG4gIFB1bmN0dWF0b3I6IHtuYW1lOiBcIlB1bmN0dWF0b3JcIn0sXG4gIFN0cmluZ0xpdGVyYWw6IHtuYW1lOiBcIlN0cmluZ1wifSxcbiAgUmVndWxhckV4cHJlc3Npb246IHtuYW1lOiBcIlJlZ3VsYXJFeHByZXNzaW9uXCJ9LFxuICBMaW5lQ29tbWVudDoge25hbWU6IFwiTGluZVwifSxcbiAgQmxvY2tDb21tZW50OiB7bmFtZTogXCJCbG9ja1wifSxcbiAgSWxsZWdhbDoge25hbWU6IFwiSWxsZWdhbFwifVxufTtcblxuZXhwb3J0IGNvbnN0IFRva2VuVHlwZSA9IHtcbiAgRU9TOiB7a2xhc3M6IFRva2VuQ2xhc3MuRW9mLCBuYW1lOiBcIkVPU1wifSxcbiAgTFBBUkVOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIoXCJ9LFxuICBSUEFSRU46IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIilcIn0sXG4gIExCUkFDSzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiW1wifSxcbiAgUkJSQUNLOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJdXCJ9LFxuICBMQlJBQ0U6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIntcIn0sXG4gIFJCUkFDRToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifVwifSxcbiAgQ09MT046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjpcIn0sXG4gIFNFTUlDT0xPTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiO1wifSxcbiAgUEVSSU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIuXCJ9LFxuICBFTExJUFNJUzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLi4uXCJ9LFxuICBBUlJPVzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPT5cIn0sXG4gIENPTkRJVElPTkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI/XCJ9LFxuICBJTkM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIisrXCJ9LFxuICBERUM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi0tXCJ9LFxuICBBU1NJR046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj1cIn0sXG4gIEFTU0lHTl9CSVRfT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInw9XCJ9LFxuICBBU1NJR05fQklUX1hPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXj1cIn0sXG4gIEFTU0lHTl9CSVRfQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImPVwifSxcbiAgQVNTSUdOX1NITDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPDw9XCJ9LFxuICBBU1NJR05fU0hSOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj1cIn0sXG4gIEFTU0lHTl9TSFJfVU5TSUdORUQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+Pj1cIn0sXG4gIEFTU0lHTl9BREQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIis9XCJ9LFxuICBBU1NJR05fU1VCOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItPVwifSxcbiAgQVNTSUdOX01VTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKj1cIn0sXG4gIEFTU0lHTl9ESVY6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi89XCJ9LFxuICBBU1NJR05fTU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIlPVwifSxcbiAgQ09NTUE6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIixcIn0sXG4gIE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8fFwifSxcbiAgQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImJlwifSxcbiAgQklUX09SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8XCJ9LFxuICBCSVRfWE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJeXCJ9LFxuICBCSVRfQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImXCJ9LFxuICBTSEw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw8XCJ9LFxuICBTSFI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+XCJ9LFxuICBTSFJfVU5TSUdORUQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+PlwifSxcbiAgQUREOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrXCJ9LFxuICBTVUI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi1cIn0sXG4gIE1VTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKlwifSxcbiAgRElWOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIvXCJ9LFxuICBNT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiVcIn0sXG4gIEVROiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9PVwifSxcbiAgTkU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiE9XCJ9LFxuICBFUV9TVFJJQ1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj09PVwifSxcbiAgTkVfU1RSSUNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIhPT1cIn0sXG4gIExUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8XCJ9LFxuICBHVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPlwifSxcbiAgTFRFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PVwifSxcbiAgR1RFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+PVwifSxcbiAgSU5TVEFOQ0VPRjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaW5zdGFuY2VvZlwifSxcbiAgSU46IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImluXCJ9LFxuICBOT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiFcIn0sXG4gIEJJVF9OT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn5cIn0sXG4gIERFTEVURToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVsZXRlXCJ9LFxuICBUWVBFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInR5cGVvZlwifSxcbiAgVk9JRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidm9pZFwifSxcbiAgQlJFQUs6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImJyZWFrXCJ9LFxuICBDQVNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXNlXCJ9LFxuICBDQVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2F0Y2hcIn0sXG4gIENMQVNTOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjbGFzc1wifSxcbiAgQ09OVElOVUU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNvbnRpbnVlXCJ9LFxuICBERUJVR0dFUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVidWdnZXJcIn0sXG4gIERFRkFVTFQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlZmF1bHRcIn0sXG4gIERPOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkb1wifSxcbiAgRUxTRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZWxzZVwifSxcbiAgRVhQT1JUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJleHBvcnRcIn0sXG4gIEVYVEVORFM6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImV4dGVuZHNcIn0sXG4gIEZJTkFMTFk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZpbmFsbHlcIn0sXG4gIEZPUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZm9yXCJ9LFxuICBGVU5DVElPTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZnVuY3Rpb25cIn0sXG4gIElGOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpZlwifSxcbiAgSU1QT1JUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpbXBvcnRcIn0sXG4gIExFVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwibGV0XCJ9LFxuICBORVc6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm5ld1wifSxcbiAgUkVUVVJOOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJyZXR1cm5cIn0sXG4gIFNVUEVSOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJzdXBlclwifSxcbiAgU1dJVENIOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJzd2l0Y2hcIn0sXG4gIFRISVM6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRoaXNcIn0sXG4gIFRIUk9XOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0aHJvd1wifSxcbiAgVFJZOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0cnlcIn0sXG4gIFZBUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidmFyXCJ9LFxuICBXSElMRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwid2hpbGVcIn0sXG4gIFdJVEg6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIndpdGhcIn0sXG4gIE5VTEw6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm51bGxcIn0sXG4gIFRSVUU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRydWVcIn0sXG4gIEZBTFNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJmYWxzZVwifSxcbiAgWUlFTEQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInlpZWxkXCJ9LFxuICBOVU1CRVI6IHtrbGFzczogVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFNUUklORzoge2tsYXNzOiBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWwsIG5hbWU6IFwiXCJ9LFxuICBSRUdFWFA6IHtrbGFzczogVG9rZW5DbGFzcy5SZWd1bGFyRXhwcmVzc2lvbiwgbmFtZTogXCJcIn0sXG4gIElERU5USUZJRVI6IHtrbGFzczogVG9rZW5DbGFzcy5JZGVudCwgbmFtZTogXCJcIn0sXG4gIENPTlNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb25zdFwifSxcbiAgVEVNUExBVEU6IHtrbGFzczogVG9rZW5DbGFzcy5UZW1wbGF0ZUVsZW1lbnQsIG5hbWU6IFwiXCJ9LFxuICBJTExFR0FMOiB7a2xhc3M6IFRva2VuQ2xhc3MuSWxsZWdhbCwgbmFtZTogXCJcIn1cbn07XG5cbmNvbnN0IFRUID0gVG9rZW5UeXBlO1xuY29uc3QgSSA9IFRULklMTEVHQUw7XG5jb25zdCBGID0gZmFsc2U7XG5jb25zdCBUID0gdHJ1ZTtcblxuY29uc3QgT05FX0NIQVJfUFVOQ1RVQVRPUiA9IFtcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTk9ULCBJLCBJLCBJLFxuICBUVC5NT0QsIFRULkJJVF9BTkQsIEksIFRULkxQQVJFTiwgVFQuUlBBUkVOLCBUVC5NVUwsIFRULkFERCwgVFQuQ09NTUEsIFRULlNVQiwgVFQuUEVSSU9ELCBUVC5ESVYsIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIFRULkNPTE9OLCBUVC5TRU1JQ09MT04sIFRULkxULCBUVC5BU1NJR04sIFRULkdULCBUVC5DT05ESVRJT05BTCwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNLLCBJLCBUVC5SQlJBQ0ssIFRULkJJVF9YT1IsIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIFRULkxCUkFDRSwgVFQuQklUX09SLCBUVC5SQlJBQ0UsIFRULkJJVF9OT1RdO1xuXG5jb25zdCBQVU5DVFVBVE9SX1NUQVJUID0gW1xuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBGLCBGLCBULCBULFxuICBGLCBULCBULCBULCBULCBULCBULCBGLCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBGXTtcblxuZXhwb3J0IGNsYXNzIEpzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGluZGV4LCBsaW5lLCBjb2x1bW4sIG1zZykge1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLmxpbmUgPSBsaW5lO1xuICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICAgIHRoaXMuZGVzY3JpcHRpb24gPSBtc2c7XG4gICAgdGhpcy5tZXNzYWdlID0gYFske2xpbmV9OiR7Y29sdW1ufV06ICR7bXNnfWA7XG4gIH1cbn1cblxuZnVuY3Rpb24gZnJvbUNvZGVQb2ludChjcCkge1xuICBpZiAoY3AgPD0gMHhGRkZGKSByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShjcCk7XG4gIGxldCBjdTEgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKE1hdGguZmxvb3IoKGNwIC0gMHgxMDAwMCkgLyAweDQwMCkgKyAweEQ4MDApO1xuICBsZXQgY3UyID0gU3RyaW5nLmZyb21DaGFyQ29kZSgoKGNwIC0gMHgxMDAwMCkgJSAweDQwMCkgKyAweERDMDApO1xuICByZXR1cm4gY3UxICsgY3UyO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGYxNihsZWFkLCB0cmFpbCkge1xuICByZXR1cm4gKGxlYWQgLSAweEQ4MDApICogMHg0MDAgKyAodHJhaWwgLSAweERDMDApICsgMHgxMDAwMDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVG9rZW5pemVyIHtcbiAgY29uc3RydWN0b3Ioc291cmNlKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgdGhpcy5pbmRleCA9IDA7XG4gICAgdGhpcy5saW5lID0gMDtcbiAgICB0aGlzLmxpbmVTdGFydCA9IDA7XG4gICAgdGhpcy5zdGFydEluZGV4ID0gMDtcbiAgICB0aGlzLnN0YXJ0TGluZSA9IDA7XG4gICAgdGhpcy5zdGFydExpbmVTdGFydCA9IDA7XG4gICAgdGhpcy5sYXN0SW5kZXggPSAwO1xuICAgIHRoaXMubGFzdExpbmUgPSAwO1xuICAgIHRoaXMubGFzdExpbmVTdGFydCA9IDA7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLnRva2VuSW5kZXggPSAwO1xuICB9XG5cbiAgc2F2ZUxleGVyU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNvdXJjZTogdGhpcy5zb3VyY2UsXG4gICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgIGxpbmU6IHRoaXMubGluZSxcbiAgICAgIGxpbmVTdGFydDogdGhpcy5saW5lU3RhcnQsXG4gICAgICBzdGFydEluZGV4OiB0aGlzLnN0YXJ0SW5kZXgsXG4gICAgICBzdGFydExpbmU6IHRoaXMuc3RhcnRMaW5lLFxuICAgICAgc3RhcnRMaW5lU3RhcnQ6IHRoaXMuc3RhcnRMaW5lU3RhcnQsXG4gICAgICBsYXN0SW5kZXg6IHRoaXMubGFzdEluZGV4LFxuICAgICAgbGFzdExpbmU6IHRoaXMubGFzdExpbmUsXG4gICAgICBsYXN0TGluZVN0YXJ0OiB0aGlzLmxhc3RMaW5lU3RhcnQsXG4gICAgICBsb29rYWhlYWQ6IHRoaXMubG9va2FoZWFkLFxuICAgICAgaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0OiB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCxcbiAgICAgIHRva2VuSW5kZXg6IHRoaXMudG9rZW5JbmRleFxuICAgIH07XG4gIH1cblxuICByZXN0b3JlTGV4ZXJTdGF0ZShzdGF0ZSkge1xuICAgIHRoaXMuc291cmNlID0gc3RhdGUuc291cmNlO1xuICAgIHRoaXMuaW5kZXggPSBzdGF0ZS5pbmRleDtcbiAgICB0aGlzLmxpbmUgPSBzdGF0ZS5saW5lO1xuICAgIHRoaXMubGluZVN0YXJ0ID0gc3RhdGUubGluZVN0YXJ0O1xuICAgIHRoaXMuc3RhcnRJbmRleCA9IHN0YXRlLnN0YXJ0SW5kZXg7XG4gICAgdGhpcy5zdGFydExpbmUgPSBzdGF0ZS5zdGFydExpbmU7XG4gICAgdGhpcy5zdGFydExpbmVTdGFydCA9IHN0YXRlLnN0YXJ0TGluZVN0YXJ0O1xuICAgIHRoaXMubGFzdEluZGV4ID0gc3RhdGUubGFzdEluZGV4O1xuICAgIHRoaXMubGFzdExpbmUgPSBzdGF0ZS5sYXN0TGluZTtcbiAgICB0aGlzLmxhc3RMaW5lU3RhcnQgPSBzdGF0ZS5sYXN0TGluZVN0YXJ0O1xuICAgIHRoaXMubG9va2FoZWFkID0gc3RhdGUubG9va2FoZWFkO1xuICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gc3RhdGUuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0O1xuICAgIHRoaXMudG9rZW5JbmRleCA9IHN0YXRlLnRva2VuSW5kZXg7XG4gIH1cblxuICBjcmVhdGVJTExFR0FMKCkge1xuICAgIHRoaXMuc3RhcnRJbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5zdGFydExpbmUgPSB0aGlzLmxpbmU7XG4gICAgdGhpcy5zdGFydExpbmVTdGFydCA9IHRoaXMubGluZVN0YXJ0O1xuICAgIHJldHVybiB0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoXG4gICAgICA/IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lMTEVHQUxfVE9LRU4sIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSlcbiAgICAgIDogdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfRU9TKTtcbiAgfVxuXG4gIGNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pIHtcbiAgICBzd2l0Y2ggKHRva2VuLnR5cGUua2xhc3MpIHtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5Fb2Y6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9FT1MpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLk51bWVyaWNMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTlVNQkVSKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5TdHJpbmdMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1RSSU5HKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5JZGVudDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lERU5USUZJRVIpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLktleXdvcmQ6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4uc2xpY2UudGV4dCk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuUHVuY3R1YXRvcjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi50eXBlLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUVycm9yKG1lc3NhZ2UpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csIChfLCBuKSA9PiBKU09OLnN0cmluZ2lmeShhcmd1bWVudHNbK24gKyAxXSkpO1xuICAgIHJldHVybiBuZXcgSnNFcnJvcih0aGlzLnN0YXJ0SW5kZXgsIHRoaXMuc3RhcnRMaW5lICsgMSwgdGhpcy5zdGFydEluZGV4IC0gdGhpcy5zdGFydExpbmVTdGFydCArIDEsIG1zZyk7XG4gIH1cblxuICBjcmVhdGVFcnJvcldpdGhMb2NhdGlvbihsb2NhdGlvbiwgbWVzc2FnZSkge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgbGV0IG1zZyA9IG1lc3NhZ2UucmVwbGFjZSgveyhcXGQrKX0vZywgKF8sIG4pID0+IEpTT04uc3RyaW5naWZ5KGFyZ3VtZW50c1srbiArIDJdKSk7XG4gICAgaWYgKGxvY2F0aW9uLnNsaWNlICYmIGxvY2F0aW9uLnNsaWNlLnN0YXJ0TG9jYXRpb24pIHtcbiAgICAgIGxvY2F0aW9uID0gbG9jYXRpb24uc2xpY2Uuc3RhcnRMb2NhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKGxvY2F0aW9uLm9mZnNldCwgbG9jYXRpb24ubGluZSwgbG9jYXRpb24uY29sdW1uICsgMSwgbXNnKTtcbiAgfVxuXG4gIHN0YXRpYyBjc2UyKGlkLCBjaDEsIGNoMikge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMjtcbiAgfVxuXG4gIHN0YXRpYyBjc2UzKGlkLCBjaDEsIGNoMiwgY2gzKSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzO1xuICB9XG5cbiAgc3RhdGljIGNzZTQoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCkge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNDtcbiAgfVxuXG4gIHN0YXRpYyBjc2U1KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSkge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSkgPT09IGNoNTtcbiAgfVxuXG4gIHN0YXRpYyBjc2U2KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSwgY2g2KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0ICYmIGlkLmNoYXJBdCg1KSA9PT0gY2g1ICYmIGlkLmNoYXJBdCg2KSA9PT0gY2g2O1xuICB9XG5cbiAgc3RhdGljIGNzZTcoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCwgY2g1LCBjaDYsIGNoNykge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSkgPT09IGNoNSAmJiBpZC5jaGFyQXQoNikgPT09IGNoNiAmJiBpZC5jaGFyQXQoNykgPT09IGNoNztcbiAgfVxuXG4gIHN0YXRpYyBnZXRLZXl3b3JkKGlkKSB7XG4gICAgaWYgKGlkLmxlbmd0aCA9PT0gMSB8fCBpZC5sZW5ndGggPiAxMCkge1xuICAgICAgcmV0dXJuIFRva2VuVHlwZS5JREVOVElGSUVSO1xuICAgIH1cblxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgc3dpdGNoIChpZC5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMSkpIHtcbiAgICAgICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklGO1xuICAgICAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU47XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKGlkLmNoYXJBdCgxKSA9PT0gXCJvXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ETztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiYVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5WQVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcIm9cIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRk9SO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJlXCIsIFwid1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5FVztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiclwiLCBcInlcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UUlk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwibFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImVcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTEVUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJoXCIsIFwiaVwiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5USElTO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJyXCIsIFwidVwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UUlVFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJ1XCIsIFwibFwiLCBcImxcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5OVUxMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJsXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FTFNFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJhXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DQVNFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJvXCIsIFwiaVwiLCBcImRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5WT0lEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIndcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJpXCIsIFwidFwiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5XSVRIO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcIndcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiaVwiLCBcImxcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuV0hJTEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiYlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcInJcIiwgXCJlXCIsIFwiYVwiLCBcImtcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5CUkVBSztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiYVwiLCBcImxcIiwgXCJzXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZBTFNFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJhXCIsIFwidFwiLCBcImNcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0FUQ0g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcIm9cIiwgXCJuXCIsIFwic1wiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DT05TVDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwibFwiLCBcImFcIiwgXCJzXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNMQVNTO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiclwiLCBcIm9cIiwgXCJ3XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVEhST1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwieVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImlcIiwgXCJlXCIsIFwibFwiLCBcImRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ZSUVMRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwidVwiLCBcInBcIiwgXCJlXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNVUEVSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDY6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJlXCIsIFwidFwiLCBcInVcIiwgXCJyXCIsIFwiblwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlJFVFVSTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwieVwiLCBcInBcIiwgXCJlXCIsIFwib1wiLCBcImZcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UWVBFT0Y7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcImVcIiwgXCJsXCIsIFwiZVwiLCBcInRcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVMRVRFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJ3XCIsIFwiaVwiLCBcInRcIiwgXCJjXCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNXSVRDSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwieFwiLCBcInBcIiwgXCJvXCIsIFwiclwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FWFBPUlQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIm1cIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU1QT1JUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJlXCIsIFwiZlwiLCBcImFcIiwgXCJ1XCIsIFwibFwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUZBVUxUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJpXCIsIFwiblwiLCBcImFcIiwgXCJsXCIsIFwibFwiLCBcInlcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GSU5BTExZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJ4XCIsIFwidFwiLCBcImVcIiwgXCJuXCIsIFwiZFwiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FWFRFTkRTO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJ1XCIsIFwiblwiLCBcImNcIiwgXCJ0XCIsIFwiaVwiLCBcIm9cIiwgXCJuXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVOQ1RJT047XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcIm9cIiwgXCJuXCIsIFwidFwiLCBcImlcIiwgXCJuXCIsIFwidVwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DT05USU5VRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwiZVwiLCBcImJcIiwgXCJ1XCIsIFwiZ1wiLCBcImdcIiwgXCJlXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFQlVHR0VSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEwOlxuICAgICAgICBpZiAoaWQgPT09IFwiaW5zdGFuY2VvZlwiKSB7XG4gICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTlNUQU5DRU9GO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gVG9rZW5UeXBlLklERU5USUZJRVI7XG4gIH1cblxuICBza2lwU2luZ2xlTGluZUNvbW1lbnQob2Zmc2V0KSB7XG4gICAgdGhpcy5pbmRleCArPSBvZmZzZXQ7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAqL1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gMHhEIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KSA9PT0gMHhBIC8qXCJcXG5cIiAqLykge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2tpcE11bHRpTGluZUNvbW1lbnQoKSB7XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgICBsZXQgaXNMaW5lU3RhcnQgPSBmYWxzZTtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2hDb2RlIDwgMHg4MCkge1xuICAgICAgICBzd2l0Y2ggKGNoQ29kZSkge1xuICAgICAgICAgIGNhc2UgNDI6ICAvLyBcIipcIlxuICAgICAgICAgICAgLy8gQmxvY2sgY29tbWVudCBlbmRzIHdpdGggXCIqL1wiLlxuICAgICAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXggPSB0aGlzLmluZGV4ICsgMjtcbiAgICAgICAgICAgICAgcmV0dXJuIGlzTGluZVN0YXJ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMDogIC8vIFwiXFxuXCJcbiAgICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMzogLy8gXCJcXHJcIjpcbiAgICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDB4MjAyOCB8fCBjaENvZGUgPT09IDB4MjAyOSkge1xuICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgfVxuXG5cbiAgc2tpcENvbW1lbnQoKSB7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcblxuICAgIGxldCBpc0xpbmVTdGFydCA9IHRoaXMuaW5kZXggPT09IDA7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGlzV2hpdGVTcGFjZShjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAoY2hDb2RlID09PSAxMyAvKiBcIlxcclwiICovICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNDcgLyogXCIvXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgICBpZiAoY2hDb2RlID09PSA0NyAvKiBcIi9cIiAqLykge1xuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDIpO1xuICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDQyIC8qIFwiKlwiICovKSB7XG4gICAgICAgICAgaXNMaW5lU3RhcnQgPSB0aGlzLnNraXBNdWx0aUxpbmVDb21tZW50KCkgfHwgaXNMaW5lU3RhcnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMubW9kdWxlICYmIGlzTGluZVN0YXJ0ICYmIGNoQ29kZSA9PT0gNDUgLyogXCItXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFUrMDAzRSBpcyBcIj5cIlxuICAgICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCItXCIgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAvLyBcIi0tPlwiIGlzIGEgc2luZ2xlLWxpbmUgY29tbWVudFxuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCF0aGlzLm1vZHVsZSAmJiBjaENvZGUgPT09IDYwIC8qIFwiPFwiICovKSB7XG4gICAgICAgIGlmICh0aGlzLnNvdXJjZS5zbGljZSh0aGlzLmluZGV4ICsgMSwgdGhpcy5pbmRleCArIDQpID09PSBcIiEtLVwiKSB7XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoNCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNjYW5IZXhFc2NhcGUyKCkge1xuICAgIGlmICh0aGlzLmluZGV4ICsgMiA+IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjEgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpO1xuICAgIGlmIChyMSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIyID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSk7XG4gICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICB0aGlzLmluZGV4ICs9IDI7XG4gICAgcmV0dXJuIHIxIDw8IDQgfCByMjtcbiAgfVxuXG4gIHNjYW5Vbmljb2RlKCkge1xuICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwie1wiKSB7XG4gICAgICAvL1xcdXtIZXhEaWdpdHN9XG4gICAgICBsZXQgaSA9IHRoaXMuaW5kZXggKyAxO1xuICAgICAgbGV0IGhleERpZ2l0cyA9IDAsIGNoO1xuICAgICAgd2hpbGUgKGkgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICAgIGxldCBoZXggPSBnZXRIZXhWYWx1ZShjaCk7XG4gICAgICAgIGlmIChoZXggPT09IC0xKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaGV4RGlnaXRzID0gKGhleERpZ2l0cyA8PCA0KSB8IGhleDtcbiAgICAgICAgaWYgKGhleERpZ2l0cyA+IDB4MTBGRkZGKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgICAgaWYgKGNoICE9PSBcIn1cIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggPSBpICsgMTtcbiAgICAgIHJldHVybiBoZXhEaWdpdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vXFx1SGV4NERpZ2l0c1xuICAgICAgaWYgKHRoaXMuaW5kZXggKyA0ID4gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGxldCByMSA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSk7XG4gICAgICBpZiAocjEgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGxldCByMiA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpO1xuICAgICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBsZXQgcjMgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpKTtcbiAgICAgIGlmIChyMyA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgbGV0IHI0ID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSk7XG4gICAgICBpZiAocjQgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggKz0gNDtcbiAgICAgIHJldHVybiByMSA8PCAxMiB8IHIyIDw8IDggfCByMyA8PCA0IHwgcjQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0RXNjYXBlZElkZW50aWZpZXIoKSB7XG4gICAgbGV0IGlkID0gXCJcIjtcbiAgICBsZXQgY2hlY2sgPSBpc0lkZW50aWZpZXJTdGFydDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBsZXQgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgICAgKyt0aGlzLmluZGV4O1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpICE9PSBcInVcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgICsrdGhpcy5pbmRleDtcbiAgICAgICAgY29kZSA9IHRoaXMuc2NhblVuaWNvZGUoKTtcbiAgICAgICAgaWYgKGNvZGUgPCAwKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKDB4RDgwMCA8PSBjb2RlICYmIGNvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK3RoaXMuaW5kZXg7XG4gICAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJ1XCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK3RoaXMuaW5kZXg7XG4gICAgICAgICAgbGV0IGxvd1N1cnJvZ2F0ZUNvZGUgPSB0aGlzLnNjYW5Vbmljb2RlKCk7XG4gICAgICAgICAgaWYgKCEoMHhEQzAwIDw9IGxvd1N1cnJvZ2F0ZUNvZGUgJiYgbG93U3Vycm9nYXRlQ29kZSA8PSAweERGRkYpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29kZSA9IGRlY29kZVV0ZjE2KGNvZGUsIGxvd1N1cnJvZ2F0ZUNvZGUpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoMHhEODAwIDw9IGNvZGUgJiYgY29kZSA8PSAweERCRkYpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvd1N1cnJvZ2F0ZUNvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgICArK3RoaXMuaW5kZXg7XG4gICAgICAgIGlmICghKDB4REMwMCA8PSBsb3dTdXJyb2dhdGVDb2RlICYmIGxvd1N1cnJvZ2F0ZUNvZGUgPD0gMHhERkZGKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvZGUgPSBkZWNvZGVVdGYxNihjb2RlLCBsb3dTdXJyb2dhdGVDb2RlKTtcbiAgICAgICAgY2ggPSBmcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfVxuICAgICAgaWYgKCFjaGVjayhjb2RlKSkge1xuICAgICAgICBpZiAoaWQubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5kZXggPSBzdGFydDtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgfVxuICAgICAgY2hlY2sgPSBpc0lkZW50aWZpZXJQYXJ0O1xuICAgICAgaWQgKz0gY2g7XG4gICAgfVxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIGdldElkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICBsZXQgbCA9IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IGNoZWNrID0gaXNJZGVudGlmaWVyU3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBsKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBsZXQgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiIHx8IDB4RDgwMCA8PSBjb2RlICYmIGNvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAgIC8vIEdvIGJhY2sgYW5kIHRyeSB0aGUgaGFyZCBvbmUuXG4gICAgICAgIHRoaXMuaW5kZXggPSBzdGFydDtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RXNjYXBlZElkZW50aWZpZXIoKTtcbiAgICAgIH1cbiAgICAgIGlmICghY2hlY2soY29kZSkpIHtcbiAgICAgICAgdGhpcy5pbmRleCA9IGk7XG4gICAgICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgaSk7XG4gICAgICB9XG4gICAgICArK2k7XG4gICAgICBjaGVjayA9IGlzSWRlbnRpZmllclBhcnQ7XG4gICAgfVxuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgaSk7XG4gIH1cblxuICBzY2FuSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgLy8gQmFja3NsYXNoIChVKzAwNUMpIHN0YXJ0cyBhbiBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICBsZXQgaWQgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxcXFwiID8gdGhpcy5nZXRFc2NhcGVkSWRlbnRpZmllcigpIDogdGhpcy5nZXRJZGVudGlmaWVyKCk7XG5cbiAgICAvLyBUaGVyZSBpcyBubyBrZXl3b3JkIG9yIGxpdGVyYWwgd2l0aCBvbmx5IG9uZSBjaGFyYWN0ZXIuXG4gICAgLy8gVGh1cywgaXQgbXVzdCBiZSBhbiBpZGVudGlmaWVyLlxuICAgIGxldCBzbGljZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgIHNsaWNlLnRleHQgPSBpZDtcblxuICAgIHJldHVybiB7IHR5cGU6IFRva2VuaXplci5nZXRLZXl3b3JkKGlkKSwgdmFsdWU6IGlkLCBzbGljZTogc2xpY2UgfTtcbiAgfVxuXG4gIGdldExvY2F0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBsaW5lOiB0aGlzLnN0YXJ0TGluZSArIDEsXG4gICAgICBjb2x1bW46IHRoaXMuc3RhcnRJbmRleCAtIHRoaXMuc3RhcnRMaW5lU3RhcnQsXG4gICAgICBvZmZzZXQ6IHRoaXMuc3RhcnRJbmRleFxuICAgIH07XG4gIH1cblxuICBnZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiB7dGV4dDogdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIHRoaXMuaW5kZXgpLCBzdGFydCwgc3RhcnRMb2NhdGlvbiwgZW5kOiB0aGlzLmluZGV4fTtcbiAgfVxuXG4gIHNjYW5QdW5jdHVhdG9ySGVscGVyKCkge1xuICAgIGxldCBjaDEgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG5cbiAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgLy8gQ2hlY2sgZm9yIG1vc3QgY29tbW9uIHNpbmdsZS1jaGFyYWN0ZXIgcHVuY3R1YXRvcnMuXG4gICAgICBjYXNlIFwiLlwiOlxuICAgICAgICBsZXQgY2gyID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgICAgaWYgKGNoMiAhPT0gXCIuXCIpIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgICBsZXQgY2gzID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKTtcbiAgICAgICAgaWYgKGNoMyAhPT0gXCIuXCIpIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVMTElQU0lTO1xuICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MUEFSRU47XG4gICAgICBjYXNlIFwiKVwiOlxuICAgICAgY2FzZSBcIjtcIjpcbiAgICAgIGNhc2UgXCIsXCI6XG4gICAgICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuTEJSQUNFO1xuICAgICAgY2FzZSBcIn1cIjpcbiAgICAgIGNhc2UgXCJbXCI6XG4gICAgICBjYXNlIFwiXVwiOlxuICAgICAgY2FzZSBcIjpcIjpcbiAgICAgIGNhc2UgXCI/XCI6XG4gICAgICBjYXNlIFwiflwiOlxuICAgICAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBcIj1cIiAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIj1cIikge1xuICAgICAgICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAgICAgICBjYXNlIFwiPVwiOlxuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRX1NUUklDVDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRO1xuICAgICAgICAgICAgY2FzZSBcIiFcIjpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORV9TVFJJQ1Q7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORTtcbiAgICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9PUjtcbiAgICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0FERDtcbiAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NVQjtcbiAgICAgICAgICAgIGNhc2UgXCIqXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX01VTDtcbiAgICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTFRFO1xuICAgICAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5HVEU7XG4gICAgICAgICAgICBjYXNlIFwiL1wiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9ESVY7XG4gICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9NT0Q7XG4gICAgICAgICAgICBjYXNlIFwiXlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfWE9SO1xuICAgICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDtcbiAgICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBicmVhazsgLy9mYWlsZWRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaDIgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgaWYgKGNoMSA9PT0gY2gyKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIGxldCBjaDMgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpO1xuICAgICAgICAgIGlmIChjaDEgPT09IFwiPlwiICYmIGNoMyA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAgIC8vIDQtY2hhcmFjdGVyIHB1bmN0dWF0b3I6ID4+Pj1cbiAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMyA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSFJfVU5TSUdORUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNIUl9VTlNJR05FRDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2gxID09PSBcIjxcIiAmJiBjaDMgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSEw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI+XCIgJiYgY2gzID09PSBcIj1cIikge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hSO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBPdGhlciAyLWNoYXJhY3RlciBwdW5jdHVhdG9yczogKysgLS0gPDwgPj4gJiYgfHxcbiAgICAgICAgc3dpdGNoIChjaDEpIHtcbiAgICAgICAgICBjYXNlIFwiK1wiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTkM7XG4gICAgICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVDO1xuICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNITDtcbiAgICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSFI7XG4gICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQU5EO1xuICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk9SO1xuICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrOyAvL2ZhaWxlZFxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoMSA9PT0gXCI9XCIgJiYgY2gyID09PSBcIj5cIikge1xuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFSUk9XO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgfVxuXG4gIC8vIDcuNyBQdW5jdHVhdG9yc1xuICBzY2FuUHVuY3R1YXRvcigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIGxldCBzdWJUeXBlID0gdGhpcy5zY2FuUHVuY3R1YXRvckhlbHBlcigpO1xuICAgIHRoaXMuaW5kZXggKz0gc3ViVHlwZS5uYW1lLmxlbmd0aDtcbiAgICByZXR1cm4geyB0eXBlOiBzdWJUeXBlLCB2YWx1ZTogc3ViVHlwZS5uYW1lLCBzbGljZTogdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikgfTtcbiAgfVxuXG4gIHNjYW5IZXhMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBsZXQgaGV4ID0gZ2V0SGV4VmFsdWUoY2gpO1xuICAgICAgaWYgKGhleCA9PT0gLTEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPT09IGkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZGV4ID0gaTtcblxuICAgIGxldCBzbGljZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgIHJldHVybiB7IHR5cGU6IFRva2VuVHlwZS5OVU1CRVIsIHZhbHVlOiBwYXJzZUludChzbGljZS50ZXh0LnN1YnN0cigyKSwgMTYpLCBzbGljZSB9O1xuICB9XG5cbiAgc2NhbkJpbmFyeUxpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICBsZXQgb2Zmc2V0ID0gdGhpcy5pbmRleCAtIHN0YXJ0O1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChjaCAhPT0gXCIwXCIgJiYgY2ggIT09IFwiMVwiKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IC0gc3RhcnQgPD0gb2Zmc2V0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiAoaXNJZGVudGlmaWVyU3RhcnQodGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KSlcbiAgICAgICAgfHwgaXNEZWNpbWFsRGlnaXQodGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogVG9rZW5UeXBlLk5VTUJFUixcbiAgICAgIHZhbHVlOiBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKS50ZXh0LnN1YnN0cihvZmZzZXQpLCAyKSxcbiAgICAgIHNsaWNlOiB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSxcbiAgICAgIG9jdGFsOiBmYWxzZVxuICAgIH07XG4gIH1cblxuICBzY2FuT2N0YWxMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCAtIHN0YXJ0ID09PSAyKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogVG9rZW5UeXBlLk5VTUJFUixcbiAgICAgIHZhbHVlOiBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKS50ZXh0LnN1YnN0cigyKSwgOCksXG4gICAgICBzbGljZTogdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBvY3RhbDogZmFsc2VcbiAgICB9O1xuICB9XG5cbiAgc2NhbkxlZ2FjeU9jdGFsTGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBpc09jdGFsID0gdHJ1ZTtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCI4XCIgfHwgY2ggPT09IFwiOVwiKSB7XG4gICAgICAgIGlzT2N0YWwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFRva2VuVHlwZS5OVU1CRVIsXG4gICAgICBzbGljZTogdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbiksXG4gICAgICB2YWx1ZTogcGFyc2VJbnQodGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikudGV4dC5zdWJzdHIoMSksIGlzT2N0YWwgPyA4IDogMTApLFxuICAgICAgb2N0YWw6IHRydWVcbiAgICB9O1xuICB9XG5cbiAgc2Nhbk51bWVyaWNMaXRlcmFsKCkge1xuICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAvLyBhc3NlcnQoY2ggPT09IFwiLlwiIHx8IFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKVxuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICBpZiAoY2ggPT09IFwiMFwiKSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgaWYgKGNoID09PSBcInhcIiB8fCBjaCA9PT0gXCJYXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbkhleExpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcImJcIiB8fCBjaCA9PT0gXCJCXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbkJpbmFyeUxpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIm9cIiB8fCBjaCA9PT0gXCJPXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuTGVnYWN5T2N0YWxMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHNsaWNlID0gdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogVG9rZW5UeXBlLk5VTUJFUixcbiAgICAgICAgICB2YWx1ZTogK3NsaWNlLnRleHQsXG4gICAgICAgICAgc2xpY2UsXG4gICAgICAgICAgb2N0YWw6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaCAhPT0gXCIuXCIpIHtcbiAgICAgIC8vIE11c3QgYmUgXCIxXCIuLlwiOVwiXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLk5VTUJFUixcbiAgICAgICAgICAgIHZhbHVlOiArc2xpY2UudGV4dCxcbiAgICAgICAgICAgIHNsaWNlLFxuICAgICAgICAgICAgb2N0YWw6IGZhbHNlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgZSA9IDA7XG4gICAgaWYgKGNoID09PSBcIi5cIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuTlVNQkVSLFxuICAgICAgICAgIHZhbHVlOiArc2xpY2UudGV4dCxcbiAgICAgICAgICBzbGljZSxcbiAgICAgICAgICBvY3RhbDogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgZSsrO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLk5VTUJFUixcbiAgICAgICAgICAgIHZhbHVlOiArc2xpY2UudGV4dCxcbiAgICAgICAgICAgIHNsaWNlLFxuICAgICAgICAgICAgb2N0YWw6IGZhbHNlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFT0Ygbm90IHJlYWNoZWQgaGVyZVxuICAgIGlmIChjaCA9PT0gXCJlXCIgfHwgY2ggPT09IFwiRVwiKSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGxldCBuZWcgPSBmYWxzZTtcbiAgICAgIGlmIChjaCA9PT0gXCIrXCIgfHwgY2ggPT09IFwiLVwiKSB7XG4gICAgICAgIG5lZyA9IGNoID09PSBcIi1cIjtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGxldCBmID0gMDtcbiAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICBmICo9IDEwO1xuICAgICAgICAgIGYgKz0gK2NoO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgZSArPSBuZWcgPyBmIDogLWY7XG4gICAgfVxuXG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICB7XG4gICAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IFRva2VuVHlwZS5OVU1CRVIsXG4gICAgICAgIHZhbHVlOiArc2xpY2UudGV4dCxcbiAgICAgICAgc2xpY2UsXG4gICAgICAgIG9jdGFsOiBmYWxzZVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBzY2FuU3RyaW5nRXNjYXBlKHN0ciwgb2N0YWwpIHtcbiAgICB0aGlzLmluZGV4Kys7XG4gICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICBpZiAoIWlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICBzdHIgKz0gXCJcXG5cIjtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgc3RyICs9IFwiXFxyXCI7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgIHN0ciArPSBcIlxcdFwiO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVcIjpcbiAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICBsZXQgcmVzdG9yZSA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgbGV0IHVuZXNjYXBlZDtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdW5lc2NhcGVkID0gY2ggPT09IFwidVwiID8gdGhpcy5zY2FuVW5pY29kZSgpIDogdGhpcy5zY2FuSGV4RXNjYXBlMigpO1xuICAgICAgICAgIGlmICh1bmVzY2FwZWQgPCAwKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RyICs9IGZyb21Db2RlUG9pbnQodW5lc2NhcGVkKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICBzdHIgKz0gXCJcXGJcIjtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgc3RyICs9IFwiXFxmXCI7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgIHN0ciArPSBcIlxcdTAwMEJcIjtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICBsZXQgb2N0TGVuID0gMTtcbiAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAvLyB3aXRoIDAsIDEsIDIsIDNcbiAgICAgICAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjNcIikge1xuICAgICAgICAgICAgICBvY3RMZW4gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGNvZGUgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKG9jdExlbiA8IDMgJiYgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgICAgICAgaWYgKG9jdExlbiA+IDAgfHwgY2ggIT09IFwiMFwiKSB7XG4gICAgICAgICAgICAgICAgb2N0YWwgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvZGUgKj0gODtcbiAgICAgICAgICAgICAgb2N0TGVuKys7XG4gICAgICAgICAgICAgIGNvZGUgKz0gY2ggLSBcIjBcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIjhcIiB8fCBjaCA9PT0gXCI5XCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoY2ggPT09IFwiXFxyXCIgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcblwiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgIHRoaXMubGluZSsrO1xuICAgIH1cbiAgICByZXR1cm4gW3N0ciwgb2N0YWxdO1xuICB9XG4gIC8vIDcuOC40IFN0cmluZyBMaXRlcmFsc1xuICBzY2FuU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcblxuICAgIGxldCBxdW90ZSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAvLyAgYXNzZXJ0KChxdW90ZSA9PT0gXCJcXFwiXCIgfHwgcXVvdGUgPT09IFwiXCJcIiksIFwiU3RyaW5nIGxpdGVyYWwgbXVzdCBzdGFydHMgd2l0aCBhIHF1b3RlXCIpXG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXgrKztcblxuICAgIGxldCBvY3RhbCA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IHF1b3RlKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogVG9rZW5UeXBlLlNUUklORywgc2xpY2U6IHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLCBzdHIsIG9jdGFsIH07XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICBbc3RyLCBvY3RhbF0gPSB0aGlzLnNjYW5TdHJpbmdFc2NhcGUoc3RyLCBvY3RhbCk7XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgfVxuXG4gIHNjYW5UZW1wbGF0ZUVsZW1lbnQoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4Kys7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgIGNhc2UgMHg2MDogIC8vIGBcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgcmV0dXJuIHsgdHlwZTogVG9rZW5UeXBlLlRFTVBMQVRFLCB0YWlsOiB0cnVlLCBzbGljZTogdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikgfTtcbiAgICAgICAgY2FzZSAweDI0OiAgLy8gJFxuICAgICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXggKyAxKSA9PT0gMHg3QikgeyAgLy8ge1xuICAgICAgICAgICAgdGhpcy5pbmRleCArPSAyO1xuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogVG9rZW5UeXBlLlRFTVBMQVRFLCB0YWlsOiBmYWxzZSwgc2xpY2U6IHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAweDVDOiAgLy8gXFxcXFxuICAgICAgICB7XG4gICAgICAgICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgICAgIGxldCBvY3RhbCA9IHRoaXMuc2NhblN0cmluZ0VzY2FwZShcIlwiLCBmYWxzZSlbMV07XG4gICAgICAgICAgaWYgKG9jdGFsKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gIH1cblxuICBzY2FuUmVnRXhwKHN0cikge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICBsZXQgdGVybWluYXRlZCA9IGZhbHNlO1xuICAgIGxldCBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR0VYUCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdFWFApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNsYXNzTWFya2VyKSB7XG4gICAgICAgICAgaWYgKGNoID09PSBcIl1cIikge1xuICAgICAgICAgICAgY2xhc3NNYXJrZXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGNoID09PSBcIi9cIikge1xuICAgICAgICAgICAgdGVybWluYXRlZCA9IHRydWU7XG4gICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIltcIikge1xuICAgICAgICAgICAgY2xhc3NNYXJrZXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRlcm1pbmF0ZWQpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHRVhQKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9SRUdFWFBfRkxBR1MpO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgc3RyICs9IGNoO1xuICAgIH1cbiAgICByZXR1cm4geyB0eXBlOiBUb2tlblR5cGUuUkVHRVhQLCB2YWx1ZTogc3RyLCBzbGljZTogdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikgfTtcbiAgfVxuXG4gIGFkdmFuY2UoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmxhc3RJbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5sYXN0TGluZSA9IHRoaXMubGluZTtcbiAgICB0aGlzLmxhc3RMaW5lU3RhcnQgPSB0aGlzLmxpbmVTdGFydDtcblxuICAgIHRoaXMuc2tpcENvbW1lbnQoKTtcblxuICAgIHRoaXMuc3RhcnRJbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5zdGFydExpbmUgPSB0aGlzLmxpbmU7XG4gICAgdGhpcy5zdGFydExpbmVTdGFydCA9IHRoaXMubGluZVN0YXJ0O1xuXG4gICAgaWYgKHRoaXMubGFzdEluZGV4ID09IDApIHtcbiAgICAgIHRoaXMubGFzdEluZGV4ID0gdGhpcy5pbmRleDtcbiAgICAgIHRoaXMubGFzdExpbmUgPSB0aGlzLmxpbmU7XG4gICAgICB0aGlzLmxhc3RMaW5lU3RhcnQgPSB0aGlzLmxpbmVTdGFydDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFRva2VuVHlwZS5FT1MsIHNsaWNlOiB0aGlzLmdldFNsaWNlKHRoaXMuaW5kZXgsIHN0YXJ0TG9jYXRpb24pIH07XG4gICAgfVxuXG4gICAgbGV0IGNoYXJDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcblxuICAgIGlmIChjaGFyQ29kZSA8IDB4ODApIHtcbiAgICAgIGlmIChQVU5DVFVBVE9SX1NUQVJUW2NoYXJDb2RlXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2hhckNvZGUpIHx8IGNoYXJDb2RlID09PSAweDVDIC8qIGJhY2tzbGFzaCAoXFwpICovKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9sZXQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDJFKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXggKyAxKSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdHJpbmcgbGl0ZXJhbCBzdGFydHMgd2l0aCBzaW5nbGUgcXVvdGUgKFUrMDAyNykgb3IgZG91YmxlIHF1b3RlIChVKzAwMjIpLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDI3IHx8IGNoYXJDb2RlID09PSAweDIyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5TdHJpbmdMaXRlcmFsKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRlbXBsYXRlIGxpdGVyYWwgc3RhcnRzIHdpdGggYmFjayBxdW90ZSAoVSswMDYwKVxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDYwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5UZW1wbGF0ZUVsZW1lbnQoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKDB4MzAgLyogXCIwXCIgKi8gPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHgzOSAvKiBcIjlcIiAqLykge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2xhc2ggKC8pIFUrMDAyRiBjYW4gYWxzbyBzdGFydCBhIHJlZ2V4LlxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaGFyQ29kZSkgfHwgMHhEODAwIDw9IGNoYXJDb2RlICYmIGNoYXJDb2RlIDw9IDB4REJGRikge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuSWRlbnRpZmllcigpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG4gIH1cblxuICBlb2YoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5FT1M7XG4gIH1cblxuICBsZXgoKSB7XG4gICAgbGV0IHByZXZUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG4gICAgdGhpcy50b2tlbkluZGV4Kys7XG4gICAgcmV0dXJuIHByZXZUb2tlbjtcbiAgfVxufVxuIl19