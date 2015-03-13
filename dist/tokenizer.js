"use strict";

// istanbul ignore next
var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

// istanbul ignore next
var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

// istanbul ignore next
var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

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
var Shift = require("shift-ast");

var TokenClass = exports.TokenClass = {
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

var TokenType = exports.TokenType = {
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
  OF: { klass: TokenClass.Keyword, name: "of" },
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
  FUTURE_RESERVED_WORD: { klass: TokenClass.Keyword, name: "" },
  FUTURE_STRICT_RESERVED_WORD: { klass: TokenClass.Keyword, name: "" },
  CONST: { klass: TokenClass.Keyword, name: "const" },
  TEMPLATE: { klass: TokenClass.TemplateElement, name: "" },
  ILLEGAL: { klass: TokenClass.Illegal, name: "" }
};

var TT = TokenType;
var I = TT.ILLEGAL;
var F = false;
var T = true;

var ONE_CHAR_PUNCTUATOR = [I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.NOT, I, I, I, TT.MOD, TT.BIT_AND, I, TT.LPAREN, TT.RPAREN, TT.MUL, TT.ADD, TT.COMMA, TT.SUB, TT.PERIOD, TT.DIV, I, I, I, I, I, I, I, I, I, I, TT.COLON, TT.SEMICOLON, TT.LT, TT.ASSIGN, TT.GT, TT.CONDITIONAL, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACK, I, TT.RBRACK, TT.BIT_XOR, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACE, TT.BIT_OR, TT.RBRACE, TT.BIT_NOT];

var PUNCTUATOR_START = [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, T, T, F, T, T, T, T, T, T, F, T, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, T, T, T, F];

var Token = exports.Token = function Token(type, slice, octal) {
  _classCallCheck(this, Token);

  this.type = type;
  this.slice = slice;
  this.octal = octal;
};

var IdentifierLikeToken = exports.IdentifierLikeToken = (function (Token) {
  function IdentifierLikeToken(type, slice) {
    _classCallCheck(this, IdentifierLikeToken);

    _get(Object.getPrototypeOf(IdentifierLikeToken.prototype), "constructor", this).call(this, type, slice, false);
  }

  _inherits(IdentifierLikeToken, Token);

  _prototypeProperties(IdentifierLikeToken, null, {
    value: {
      get: function () {
        return this.slice.text;
      },
      configurable: true
    }
  });

  return IdentifierLikeToken;
})(Token);
var IdentifierToken = exports.IdentifierToken = (function (IdentifierLikeToken) {
  function IdentifierToken(slice) {
    _classCallCheck(this, IdentifierToken);

    _get(Object.getPrototypeOf(IdentifierToken.prototype), "constructor", this).call(this, TokenType.IDENTIFIER, slice);
  }

  _inherits(IdentifierToken, IdentifierLikeToken);

  return IdentifierToken;
})(IdentifierLikeToken);
var KeywordToken = exports.KeywordToken = (function (IdentifierLikeToken) {
  function KeywordToken(type, slice) {
    _classCallCheck(this, KeywordToken);

    _get(Object.getPrototypeOf(KeywordToken.prototype), "constructor", this).call(this, type, slice);
  }

  _inherits(KeywordToken, IdentifierLikeToken);

  return KeywordToken;
})(IdentifierLikeToken);
var PunctuatorToken = exports.PunctuatorToken = (function (Token) {
  function PunctuatorToken(type, slice) {
    _classCallCheck(this, PunctuatorToken);

    _get(Object.getPrototypeOf(PunctuatorToken.prototype), "constructor", this).call(this, type, slice, false);
  }

  _inherits(PunctuatorToken, Token);

  _prototypeProperties(PunctuatorToken, null, {
    value: {
      get: function () {
        return this.type.name;
      },
      configurable: true
    }
  });

  return PunctuatorToken;
})(Token);
var RegularExpressionLiteralToken = exports.RegularExpressionLiteralToken = (function (Token) {
  function RegularExpressionLiteralToken(slice, value) {
    _classCallCheck(this, RegularExpressionLiteralToken);

    _get(Object.getPrototypeOf(RegularExpressionLiteralToken.prototype), "constructor", this).call(this, TokenType.REGEXP, slice, false);
    this._value = value;
  }

  _inherits(RegularExpressionLiteralToken, Token);

  _prototypeProperties(RegularExpressionLiteralToken, null, {
    value: {
      get: function () {
        return this._value;
      },
      configurable: true
    }
  });

  return RegularExpressionLiteralToken;
})(Token);
var NumericLiteralToken = exports.NumericLiteralToken = (function (Token) {
  function NumericLiteralToken(slice) {
    var _this = this;
    var value = arguments[1] === undefined ? +slice.text : arguments[1];
    var legacyOctal = arguments[2] === undefined ? false : arguments[2];
    return (function () {
      _classCallCheck(_this, NumericLiteralToken);

      _get(Object.getPrototypeOf(NumericLiteralToken.prototype), "constructor", _this).call(_this, TokenType.NUMBER, slice, legacyOctal);
      _this._value = value;
    })();
  }

  _inherits(NumericLiteralToken, Token);

  return NumericLiteralToken;
})(Token);
var StringLiteralToken = exports.StringLiteralToken = (function (Token) {
  function StringLiteralToken(slice, value, octal) {
    _classCallCheck(this, StringLiteralToken);

    _get(Object.getPrototypeOf(StringLiteralToken.prototype), "constructor", this).call(this, TokenType.STRING, slice, octal);
    this._value = value;
  }

  _inherits(StringLiteralToken, Token);

  return StringLiteralToken;
})(Token);
var TemplateToken = exports.TemplateToken = (function (Token) {
  function TemplateToken(tail, slice) {
    _classCallCheck(this, TemplateToken);

    _get(Object.getPrototypeOf(TemplateToken.prototype), "constructor", this).call(this, TokenType.TEMPLATE, slice);
    this.tail = tail;
    this.value = slice.text;
  }

  _inherits(TemplateToken, Token);

  return TemplateToken;
})(Token);
var EOFToken = exports.EOFToken = (function (Token) {
  function EOFToken(slice) {
    _classCallCheck(this, EOFToken);

    _get(Object.getPrototypeOf(EOFToken.prototype), "constructor", this).call(this, TokenType.EOS, slice, false);
  }

  _inherits(EOFToken, Token);

  return EOFToken;
})(Token);
var JsError = exports.JsError = (function (Error) {
  function JsError(index, line, column, msg) {
    _classCallCheck(this, JsError);

    this.index = index;
    this.line = line;
    this.column = column;
    this.description = msg;
    this.message = "[" + line + ":" + column + "]: " + msg;
  }

  _inherits(JsError, Error);

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
    this.strict = false;
    this.hasLineTerminatorBeforeNext = false;
    this.tokenIndex = 0;
  }

  _prototypeProperties(Tokenizer, {
    cse2: {
      value: function cse2(id, ch1, ch2) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2;
      },
      writable: true,
      configurable: true
    },
    cse3: {
      value: function cse3(id, ch1, ch2, ch3) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3;
      },
      writable: true,
      configurable: true
    },
    cse4: {
      value: function cse4(id, ch1, ch2, ch3, ch4) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4;
      },
      writable: true,
      configurable: true
    },
    cse5: {
      value: function cse5(id, ch1, ch2, ch3, ch4, ch5) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5;
      },
      writable: true,
      configurable: true
    },
    cse6: {
      value: function cse6(id, ch1, ch2, ch3, ch4, ch5, ch6) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6;
      },
      writable: true,
      configurable: true
    },
    cse7: {
      value: function cse7(id, ch1, ch2, ch3, ch4, ch5, ch6, ch7) {
        return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6 && id.charAt(7) === ch7;
      },
      writable: true,
      configurable: true
    },
    getKeyword: {
      value: function getKeyword(id, strict) {
        // "const" is specialized as Keyword in V8.
        // "yield" and "let" are for compatibility with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        if (id.length === 1 || id.length > 10) {
          return TokenType.ILLEGAL;
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
              case "o":
                if (id.charAt(1) === "f") {
                  return TokenType.OF;
                }
                break;
              default:
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
                if (strict && Tokenizer.cse2(id, "e", "t")) {
                  return TokenType.LET;
                }
                break;
              default:
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
                } else if (Tokenizer.cse3(id, "n", "u", "m")) {
                  return TokenType.FUTURE_RESERVED_WORD;
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
              default:
                break;
            }
            break;
          case 5:
            switch (id.charAt(0)) {
              case "w":
                // WHILE
                if (Tokenizer.cse4(id, "h", "i", "l", "e")) {
                  return TokenType.WHILE;
                }
                break;
              case "b":
                // BREAK
                if (Tokenizer.cse4(id, "r", "e", "a", "k")) {
                  return TokenType.BREAK;
                }
                break;
              case "f":
                // FALSE
                if (Tokenizer.cse4(id, "a", "l", "s", "e")) {
                  return TokenType.FALSE;
                }
                break;
              case "c":
                // CATCH
                if (Tokenizer.cse4(id, "a", "t", "c", "h")) {
                  return TokenType.CATCH;
                } else if (Tokenizer.cse4(id, "o", "n", "s", "t")) {
                  return TokenType.CONST;
                } else if (Tokenizer.cse4(id, "l", "a", "s", "s")) {
                  return TokenType.CLASS;
                }
                break;
              case "t":
                // THROW
                if (Tokenizer.cse4(id, "h", "r", "o", "w")) {
                  return TokenType.THROW;
                }
                break;
              case "y":
                // YIELD
                if (Tokenizer.cse4(id, "i", "e", "l", "d")) {
                  return TokenType.YIELD;
                }
                break;
              case "s":
                // SUPER
                if (Tokenizer.cse4(id, "u", "p", "e", "r")) {
                  return TokenType.SUPER;
                }
                break;
              default:
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
                } else if (Tokenizer.cse5(id, "t", "a", "t", "i", "c")) {
                  return strict ? TokenType.FUTURE_STRICT_RESERVED_WORD : TokenType.IDENTIFIER;
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
              case "p":
                if (strict && Tokenizer.cse5(id, "u", "b", "l", "i", "c")) {
                  return TokenType.FUTURE_STRICT_RESERVED_WORD;
                }
                break;
              default:
                break;
            }
            break;
          case 7:
            switch (id.charAt(0)) {
              case "d":
                // default
                if (Tokenizer.cse6(id, "e", "f", "a", "u", "l", "t")) {
                  return TokenType.DEFAULT;
                }
                break;
              case "f":
                // finally
                if (Tokenizer.cse6(id, "i", "n", "a", "l", "l", "y")) {
                  return TokenType.FINALLY;
                }
                break;
              case "e":
                // extends
                if (Tokenizer.cse6(id, "x", "t", "e", "n", "d", "s")) {
                  return TokenType.EXTENDS;
                }
                break;
              case "p":
                if (strict) {
                  var s = id;
                  if (s === "private" || s === "package") {
                    return TokenType.FUTURE_STRICT_RESERVED_WORD;
                  }
                }
                break;
              default:
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
              default:
                break;
            }
            break;
          case 9:
            if (strict && (id.charAt(0) === "p" || id.charAt(0) === "i")) {
              var s = id;
              if (s === "protected" || s === "interface") {
                return TokenType.FUTURE_STRICT_RESERVED_WORD;
              }
            }
            break;
          case 10:
            {
              var s = id;
              if (s === "instanceof") {
                return TokenType.INSTANCEOF;
              } else if (strict && s === "implements") {
                return TokenType.FUTURE_STRICT_RESERVED_WORD;
              }
            }
            break;
          default:
            break;
        }
        return TokenType.ILLEGAL;
      },
      writable: true,
      configurable: true
    }
  }, {
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
          strict: this.strict,
          hasLineTerminatorBeforeNext: this.hasLineTerminatorBeforeNext,
          tokenIndex: this.tokenIndex
        };
      },
      writable: true,
      configurable: true
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
        this.strict = state.strict;
        this.hasLineTerminatorBeforeNext = state.hasLineTerminatorBeforeNext;
        this.tokenIndex = state.tokenIndex;
      },
      writable: true,
      configurable: true
    },
    createILLEGAL: {
      value: function createILLEGAL() {
        this.startIndex = this.index;
        this.startLine = this.line;
        this.startLineStart = this.lineStart;
        return this.createError(ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN);
      },
      writable: true,
      configurable: true
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
            if (token.type === TokenType.FUTURE_RESERVED_WORD) {
              return this.createError(ErrorMessages.UNEXPECTED_RESERVED_WORD);
            }
            if (token.type === TokenType.FUTURE_STRICT_RESERVED_WORD) {
              return this.createError(ErrorMessages.STRICT_RESERVED_WORD);
            }
            return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.slice.text);
          case TokenClass.Punctuator:
            return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
        }
      },
      writable: true,
      configurable: true
    },
    createError: {
      value: function createError(message, arg) {
        var msg = message.replace(/{(\d+)}/g, function () {
          return arg;
        });
        return new JsError(this.startIndex, this.startLine + 1, this.startIndex - this.startLineStart + 1, msg);
      },
      writable: true,
      configurable: true
    },
    createErrorWithLocation: {
      value: function createErrorWithLocation(location, message, arg) {
        var msg = message.replace(/{(\d+)}/g, function () {
          return arg;
        });
        if (location instanceof Token) {
          location = location.slice.startLocation;
        }
        return new JsError(location.offset, location.line, location.column + 1, msg);
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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

        if (id.length === 1) {
          return new IdentifierToken(slice);
        }

        var subType = Tokenizer.getKeyword(id, this.strict);
        if (subType !== TokenType.ILLEGAL) {
          return new KeywordToken(subType, slice);
        }

        return new IdentifierToken(slice);
      },
      writable: true,
      configurable: true
    },
    getLocation: {
      value: function getLocation() {
        return new Shift.SourceLocation(this.startIndex, this.startLine + 1, this.startIndex - this.startLineStart);
      },
      writable: true,
      configurable: true
    },
    getSlice: {
      value: function getSlice(start, startLocation) {
        return { text: this.source.slice(start, this.index), start: start, startLocation: startLocation, end: this.index };
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
    },
    scanPunctuator: {

      // 7.7 Punctuators
      value: function scanPunctuator() {
        var startLocation = this.getLocation();
        var start = this.index;
        var subType = this.scanPunctuatorHelper();
        this.index += subType.name.length;
        return new PunctuatorToken(subType, this.getSlice(start, startLocation));
      },
      writable: true,
      configurable: true
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
        return new NumericLiteralToken(slice, parseInt(slice.text.substr(2), 16));
      },
      writable: true,
      configurable: true
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

        return new NumericLiteralToken(this.getSlice(start, startLocation), parseInt(this.getSlice(start, startLocation).text.substr(offset), 2), false);
      },
      writable: true,
      configurable: true
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

        return new NumericLiteralToken(this.getSlice(start, startLocation), parseInt(this.getSlice(start, startLocation).text.substr(2), 8), false);
      },
      writable: true,
      configurable: true
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

        return new NumericLiteralToken(this.getSlice(start, startLocation), parseInt(this.getSlice(start, startLocation).text.substr(1), isOctal ? 8 : 10), true);
      },
      writable: true,
      configurable: true
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
              if (this.strict) {
                throw this.createErrorWithLocation(startLocation, ErrorMessages.STRICT_OCTAL_LITERAL);
              }
              return this.scanLegacyOctalLiteral(start, startLocation);
            }
          } else {
            return new NumericLiteralToken(this.getSlice(start, startLocation));
          }
        } else if (ch !== ".") {
          // Must be "1".."9"
          ch = this.source.charAt(this.index);
          while ("0" <= ch && ch <= "9") {
            this.index++;
            if (this.index === this.source.length) {
              return new NumericLiteralToken(this.getSlice(start, startLocation));
            }
            ch = this.source.charAt(this.index);
          }
        }

        var e = 0;
        if (ch === ".") {
          this.index++;
          if (this.index === this.source.length) {
            return new NumericLiteralToken(this.getSlice(start, startLocation));
          }

          ch = this.source.charAt(this.index);
          while ("0" <= ch && ch <= "9") {
            e++;
            this.index++;
            if (this.index === this.source.length) {
              return new NumericLiteralToken(this.getSlice(start, startLocation));
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

        return new NumericLiteralToken(this.getSlice(start, startLocation));
      },
      writable: true,
      configurable: true
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
      },
      writable: true,
      configurable: true
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
            return new StringLiteralToken(this.getSlice(start, startLocation), str, octal);
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
      },
      writable: true,
      configurable: true
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
              return new TemplateToken(true, this.getSlice(start, startLocation));
            case 36:
              // $
              if (this.source.charCodeAt(this.index + 1) === 123) {
                // {
                this.index += 2;
                return new TemplateToken(false, this.getSlice(start, startLocation));
              }
              this.index++;
              break;
            case 92:
              // \\
              {
                var _location = this.getLocation();
                var octal = this.scanStringEscape("", false)[1];
                if (octal) {
                  throw this.createErrorWithLocation(_location, ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN);
                }
                break;
              }
            default:
              this.index++;
          }
        }

        throw this.createILLEGAL();
      },
      writable: true,
      configurable: true
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
              throw this.createError(ErrorMessages.UNTERMINATED_REG_EXP);
            }
            str += ch;
            this.index++;
          } else if (isLineTerminator(ch.charCodeAt(0))) {
            throw this.createError(ErrorMessages.UNTERMINATED_REG_EXP);
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
          throw this.createError(ErrorMessages.UNTERMINATED_REG_EXP);
        }

        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (!isIdentifierPart(ch.charCodeAt(0)) && ch !== "\\") {
            break;
          }
          this.index++;
          str += ch;
        }
        return new RegularExpressionLiteralToken(this.getSlice(start, startLocation), str);
      },
      writable: true,
      configurable: true
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

        if (this.index >= this.source.length) {
          return new EOFToken(this.getSlice(this.index, startLocation));
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
      },
      writable: true,
      configurable: true
    },
    eof: {
      value: function eof() {
        return this.lookahead.type === TokenType.EOS;
      },
      writable: true,
      configurable: true
    },
    lex: {
      value: function lex() {
        var prevToken = this.lookahead;
        this.lookahead = this.advance();
        this.tokenIndex++;
        return prevToken;
      },
      writable: true,
      configurable: true
    }
  });

  return Tokenizer;
})();

exports["default"] = Tokenizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQkFpQitHLFNBQVM7O0lBQWhILFdBQVcsVUFBWCxXQUFXO0lBQUUsZ0JBQWdCLFVBQWhCLGdCQUFnQjtJQUFFLFlBQVksVUFBWixZQUFZO0lBQUUsaUJBQWlCLFVBQWpCLGlCQUFpQjtJQUFFLGdCQUFnQixVQUFoQixnQkFBZ0I7SUFBRSxjQUFjLFVBQWQsY0FBYztJQUNoRyxhQUFhLFdBQU8sVUFBVSxFQUE5QixhQUFhO0lBQ1QsS0FBSyxXQUFNLFdBQVc7O0FBRTNCLElBQU0sVUFBVSxXQUFWLFVBQVUsR0FBRztBQUN4QixLQUFHLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ3BCLE9BQUssRUFBRSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFDO0FBQ25ELFNBQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFDO0FBQ2xELGdCQUFjLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ2pDLGlCQUFlLEVBQUUsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ25DLFlBQVUsRUFBRSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUM7QUFDaEMsZUFBYSxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUMvQixtQkFBaUIsRUFBRSxFQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBQztBQUM5QyxhQUFXLEVBQUUsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQzNCLGNBQVksRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDN0IsU0FBTyxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQztDQUMzQixDQUFDOztBQUVLLElBQU0sU0FBUyxXQUFULFNBQVMsR0FBRztBQUN2QixLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3pDLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDaEQsV0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNwRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDckQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUNqRCxhQUFXLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3RELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELGVBQWEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDekQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3ZELHFCQUFtQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUNqRSxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLGNBQVksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3RELFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdEQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM3QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzdDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQzNELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ3JELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDckQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3ZELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDL0Msc0JBQW9CLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQzNELDZCQUEyQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztBQUNsRSxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztDQUMvQyxDQUFDOztBQUVGLElBQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQztBQUNyQixJQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQ3JCLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNoQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRWYsSUFBTSxtQkFBbUIsR0FBRyxDQUMxQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNsSCxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNySCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3BILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRXRGLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztJQUV0QixLQUFL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LEVBQUUsR0FBRyxFQUFFO0FBQ3ZDLGVBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7T0FDN0g7Ozs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDNUMsZUFBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztPQUNySjs7OztBQUVNLFFBQUk7YUFBQSxjQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDakQsZUFBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFB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QkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDNUIsTUFBTTtBQUNMLGNBQUksaUJBQWlCLENBQUMsUUFBUSxDQUFDLElBQUksS0FBTSxJQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksS0FBTSxFQUFFO0FBQzNFLG1CQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztXQUM5Qjs7QUFFRCxnQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDNUI7T0FDRjs7OztBQUVELE9BQUc7YUFBQSxlQUFHO0FBQ0osZUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxDQUFDO09BQzlDOzs7O0FBRUQsT0FBRzthQUFBLGVBQUc7QUFDSixZQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQy9CLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNsQixlQUFPLFNBQVMsQ0FBQztPQUNsQjs7Ozs7O1NBdHdDa0IsU0FBUzs7O3FCQUFULFNBQVMiLCJmaWxlIjoic3JjL3Rva2VuaXplci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cbmltcG9ydCB7Z2V0SGV4VmFsdWUsIGlzTGluZVRlcm1pbmF0b3IsIGlzV2hpdGVTcGFjZSwgaXNJZGVudGlmaWVyU3RhcnQsIGlzSWRlbnRpZmllclBhcnQsIGlzRGVjaW1hbERpZ2l0fSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCAqIGFzIFNoaWZ0IGZyb20gXCJzaGlmdC1hc3RcIjtcblxuZXhwb3J0IGNvbnN0IFRva2VuQ2xhc3MgPSB7XG4gIEVvZjoge25hbWU6IFwiPEVuZD5cIn0sXG4gIElkZW50OiB7bmFtZTogXCJJZGVudGlmaWVyXCIsIGlzSWRlbnRpZmllck5hbWU6IHRydWV9LFxuICBLZXl3b3JkOiB7bmFtZTogXCJLZXl3b3JkXCIsIGlzSWRlbnRpZmllck5hbWU6IHRydWV9LFxuICBOdW1lcmljTGl0ZXJhbDoge25hbWU6IFwiTnVtZXJpY1wifSxcbiAgVGVtcGxhdGVFbGVtZW50OiB7bmFtZTogXCJUZW1wbGF0ZVwifSxcbiAgUHVuY3R1YXRvcjoge25hbWU6IFwiUHVuY3R1YXRvclwifSxcbiAgU3RyaW5nTGl0ZXJhbDoge25hbWU6IFwiU3RyaW5nXCJ9LFxuICBSZWd1bGFyRXhwcmVzc2lvbjoge25hbWU6IFwiUmVndWxhckV4cHJlc3Npb25cIn0sXG4gIExpbmVDb21tZW50OiB7bmFtZTogXCJMaW5lXCJ9LFxuICBCbG9ja0NvbW1lbnQ6IHtuYW1lOiBcIkJsb2NrXCJ9LFxuICBJbGxlZ2FsOiB7bmFtZTogXCJJbGxlZ2FsXCJ9XG59O1xuXG5leHBvcnQgY29uc3QgVG9rZW5UeXBlID0ge1xuICBFT1M6IHtrbGFzczogVG9rZW5DbGFzcy5Fb2YsIG5hbWU6IFwiRU9TXCJ9LFxuICBMUEFSRU46IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIihcIn0sXG4gIFJQQVJFTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKVwifSxcbiAgTEJSQUNLOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJbXCJ9LFxuICBSQlJBQ0s6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl1cIn0sXG4gIExCUkFDRToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwie1wifSxcbiAgUkJSQUNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ9XCJ9LFxuICBDT0xPTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiOlwifSxcbiAgU0VNSUNPTE9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI7XCJ9LFxuICBQRVJJT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi5cIn0sXG4gIEVMTElQU0lTOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIuLi5cIn0sXG4gIEFSUk9XOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9PlwifSxcbiAgQ09ORElUSU9OQUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj9cIn0sXG4gIElOQzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKytcIn0sXG4gIERFQzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLS1cIn0sXG4gIEFTU0lHTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPVwifSxcbiAgQVNTSUdOX0JJVF9PUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifD1cIn0sXG4gIEFTU0lHTl9CSVRfWE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJePVwifSxcbiAgQVNTSUdOX0JJVF9BTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiY9XCJ9LFxuICBBU1NJR05fU0hMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PD1cIn0sXG4gIEFTU0lHTl9TSFI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+PVwifSxcbiAgQVNTSUdOX1NIUl9VTlNJR05FRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj4+PVwifSxcbiAgQVNTSUdOX0FERDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKz1cIn0sXG4gIEFTU0lHTl9TVUI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi09XCJ9LFxuICBBU1NJR05fTVVMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIqPVwifSxcbiAgQVNTSUdOX0RJVjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLz1cIn0sXG4gIEFTU0lHTl9NT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiU9XCJ9LFxuICBDT01NQToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLFwifSxcbiAgT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInx8XCJ9LFxuICBBTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiYmXCJ9LFxuICBCSVRfT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInxcIn0sXG4gIEJJVF9YT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl5cIn0sXG4gIEJJVF9BTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiZcIn0sXG4gIFNITDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPDxcIn0sXG4gIFNIUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj5cIn0sXG4gIFNIUl9VTlNJR05FRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj4+XCJ9LFxuICBBREQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIitcIn0sXG4gIFNVQjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLVwifSxcbiAgTVVMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIqXCJ9LFxuICBESVY6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi9cIn0sXG4gIE1PRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJVwifSxcbiAgRVE6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj09XCJ9LFxuICBORToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIT1cIn0sXG4gIEVRX1NUUklDVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPT09XCJ9LFxuICBORV9TVFJJQ1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiE9PVwifSxcbiAgTFQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjxcIn0sXG4gIEdUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+XCJ9LFxuICBMVEU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw9XCJ9LFxuICBHVEU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj49XCJ9LFxuICBJTlNUQU5DRU9GOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpbnN0YW5jZW9mXCJ9LFxuICBJTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaW5cIn0sXG4gIE9GOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJvZlwifSxcbiAgTk9UOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIhXCJ9LFxuICBCSVRfTk9UOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ+XCJ9LFxuICBERUxFVEU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlbGV0ZVwifSxcbiAgVFlQRU9GOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0eXBlb2ZcIn0sXG4gIFZPSUQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInZvaWRcIn0sXG4gIEJSRUFLOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJicmVha1wifSxcbiAgQ0FTRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2FzZVwifSxcbiAgQ0FUQ0g6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNhdGNoXCJ9LFxuICBDTEFTUzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2xhc3NcIn0sXG4gIENPTlRJTlVFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb250aW51ZVwifSxcbiAgREVCVUdHRVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlYnVnZ2VyXCJ9LFxuICBERUZBVUxUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkZWZhdWx0XCJ9LFxuICBETzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZG9cIn0sXG4gIEVMU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImVsc2VcIn0sXG4gIEVYUE9SVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZXhwb3J0XCJ9LFxuICBFWFRFTkRTOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJleHRlbmRzXCJ9LFxuICBGSU5BTExZOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJmaW5hbGx5XCJ9LFxuICBGT1I6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZvclwifSxcbiAgRlVOQ1RJT046IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZ1bmN0aW9uXCJ9LFxuICBJRjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaWZcIn0sXG4gIElNUE9SVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaW1wb3J0XCJ9LFxuICBMRVQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImxldFwifSxcbiAgTkVXOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJuZXdcIn0sXG4gIFJFVFVSTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwicmV0dXJuXCJ9LFxuICBTVVBFUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwic3VwZXJcIn0sXG4gIFNXSVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwic3dpdGNoXCJ9LFxuICBUSElTOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0aGlzXCJ9LFxuICBUSFJPVzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidGhyb3dcIn0sXG4gIFRSWToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidHJ5XCJ9LFxuICBWQVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInZhclwifSxcbiAgV0hJTEU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIndoaWxlXCJ9LFxuICBXSVRIOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ3aXRoXCJ9LFxuICBOVUxMOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJudWxsXCJ9LFxuICBUUlVFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0cnVlXCJ9LFxuICBGQUxTRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZmFsc2VcIn0sXG4gIFlJRUxEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ5aWVsZFwifSxcbiAgTlVNQkVSOiB7a2xhc3M6IFRva2VuQ2xhc3MuTnVtZXJpY0xpdGVyYWwsIG5hbWU6IFwiXCJ9LFxuICBTVFJJTkc6IHtrbGFzczogVG9rZW5DbGFzcy5TdHJpbmdMaXRlcmFsLCBuYW1lOiBcIlwifSxcbiAgUkVHRVhQOiB7a2xhc3M6IFRva2VuQ2xhc3MuUmVndWxhckV4cHJlc3Npb24sIG5hbWU6IFwiXCJ9LFxuICBJREVOVElGSUVSOiB7a2xhc3M6IFRva2VuQ2xhc3MuSWRlbnQsIG5hbWU6IFwiXCJ9LFxuICBGVVRVUkVfUkVTRVJWRURfV09SRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiXCJ9LFxuICBGVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIlwifSxcbiAgQ09OU1Q6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNvbnN0XCJ9LFxuICBURU1QTEFURToge2tsYXNzOiBUb2tlbkNsYXNzLlRlbXBsYXRlRWxlbWVudCwgbmFtZTogXCJcIn0sXG4gIElMTEVHQUw6IHtrbGFzczogVG9rZW5DbGFzcy5JbGxlZ2FsLCBuYW1lOiBcIlwifVxufTtcblxuY29uc3QgVFQgPSBUb2tlblR5cGU7XG5jb25zdCBJID0gVFQuSUxMRUdBTDtcbmNvbnN0IEYgPSBmYWxzZTtcbmNvbnN0IFQgPSB0cnVlO1xuXG5jb25zdCBPTkVfQ0hBUl9QVU5DVFVBVE9SID0gW1xuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5OT1QsIEksIEksIEksXG4gIFRULk1PRCwgVFQuQklUX0FORCwgSSwgVFQuTFBBUkVOLCBUVC5SUEFSRU4sIFRULk1VTCwgVFQuQURELCBUVC5DT01NQSwgVFQuU1VCLCBUVC5QRVJJT0QsIFRULkRJViwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgVFQuQ09MT04sIFRULlNFTUlDT0xPTiwgVFQuTFQsIFRULkFTU0lHTiwgVFQuR1QsIFRULkNPTkRJVElPTkFMLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLFxuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5MQlJBQ0ssIEksIFRULlJCUkFDSywgVFQuQklUX1hPUiwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNFLCBUVC5CSVRfT1IsIFRULlJCUkFDRSwgVFQuQklUX05PVF07XG5cbmNvbnN0IFBVTkNUVUFUT1JfU1RBUlQgPSBbXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIEYsIEYsIFQsIFQsXG4gIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIEZdO1xuXG5leHBvcnQgY2xhc3MgVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCBzbGljZSwgb2N0YWwpIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuc2xpY2UgPSBzbGljZTtcbiAgICB0aGlzLm9jdGFsID0gb2N0YWw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIElkZW50aWZpZXJMaWtlVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5zbGljZS50ZXh0O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJZGVudGlmaWVyVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuSURFTlRJRklFUiwgc2xpY2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBLZXl3b3JkVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFB1bmN0dWF0b3JUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGUubmFtZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5SRUdFWFAsIHNsaWNlLCBmYWxzZSk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bWVyaWNMaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSA9ICtzbGljZS50ZXh0LCBsZWdhY3lPY3RhbCA9IGZhbHNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLk5VTUJFUiwgc2xpY2UsIGxlZ2FjeU9jdGFsKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdMaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSwgb2N0YWwpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuU1RSSU5HLCBzbGljZSwgb2N0YWwpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHRhaWwsIHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLlRFTVBMQVRFLCBzbGljZSk7XG4gICAgdGhpcy50YWlsID0gdGFpbDtcbiAgICB0aGlzLnZhbHVlID0gc2xpY2UudGV4dDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRU9GVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkVPUywgc2xpY2UsIGZhbHNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSnNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoaW5kZXgsIGxpbmUsIGNvbHVtbiwgbXNnKSB7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IG1zZztcbiAgICB0aGlzLm1lc3NhZ2UgPSBgWyR7bGluZX06JHtjb2x1bW59XTogJHttc2d9YDtcbiAgfVxufVxuXG5mdW5jdGlvbiBmcm9tQ29kZVBvaW50KGNwKSB7XG4gIGlmIChjcCA8PSAweEZGRkYpIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGNwKTtcbiAgbGV0IGN1MSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoTWF0aC5mbG9vcigoY3AgLSAweDEwMDAwKSAvIDB4NDAwKSArIDB4RDgwMCk7XG4gIGxldCBjdTIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoY3AgLSAweDEwMDAwKSAlIDB4NDAwKSArIDB4REMwMCk7XG4gIHJldHVybiBjdTEgKyBjdTI7XG59XG5cbmZ1bmN0aW9uIGRlY29kZVV0ZjE2KGxlYWQsIHRyYWlsKSB7XG4gIHJldHVybiAobGVhZCAtIDB4RDgwMCkgKiAweDQwMCArICh0cmFpbCAtIDB4REMwMCkgKyAweDEwMDAwO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB0aGlzLmluZGV4ID0gMDtcbiAgICB0aGlzLmxpbmUgPSAwO1xuICAgIHRoaXMubGluZVN0YXJ0ID0gMDtcbiAgICB0aGlzLnN0YXJ0SW5kZXggPSAwO1xuICAgIHRoaXMuc3RhcnRMaW5lID0gMDtcbiAgICB0aGlzLnN0YXJ0TGluZVN0YXJ0ID0gMDtcbiAgICB0aGlzLmxhc3RJbmRleCA9IDA7XG4gICAgdGhpcy5sYXN0TGluZSA9IDA7XG4gICAgdGhpcy5sYXN0TGluZVN0YXJ0ID0gMDtcbiAgICB0aGlzLnN0cmljdCA9IGZhbHNlO1xuICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gZmFsc2U7XG4gICAgdGhpcy50b2tlbkluZGV4ID0gMDtcbiAgfVxuXG4gIHNhdmVMZXhlclN0YXRlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzb3VyY2U6IHRoaXMuc291cmNlLFxuICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICBsaW5lOiB0aGlzLmxpbmUsXG4gICAgICBsaW5lU3RhcnQ6IHRoaXMubGluZVN0YXJ0LFxuICAgICAgc3RhcnRJbmRleDogdGhpcy5zdGFydEluZGV4LFxuICAgICAgc3RhcnRMaW5lOiB0aGlzLnN0YXJ0TGluZSxcbiAgICAgIHN0YXJ0TGluZVN0YXJ0OiB0aGlzLnN0YXJ0TGluZVN0YXJ0LFxuICAgICAgbGFzdEluZGV4OiB0aGlzLmxhc3RJbmRleCxcbiAgICAgIGxhc3RMaW5lOiB0aGlzLmxhc3RMaW5lLFxuICAgICAgbGFzdExpbmVTdGFydDogdGhpcy5sYXN0TGluZVN0YXJ0LFxuICAgICAgbG9va2FoZWFkOiB0aGlzLmxvb2thaGVhZCxcbiAgICAgIHN0cmljdDogdGhpcy5zdHJpY3QsXG4gICAgICBoYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQ6IHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0LFxuICAgICAgdG9rZW5JbmRleDogdGhpcy50b2tlbkluZGV4XG4gICAgfTtcbiAgfVxuXG4gIHJlc3RvcmVMZXhlclN0YXRlKHN0YXRlKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBzdGF0ZS5zb3VyY2U7XG4gICAgdGhpcy5pbmRleCA9IHN0YXRlLmluZGV4O1xuICAgIHRoaXMubGluZSA9IHN0YXRlLmxpbmU7XG4gICAgdGhpcy5saW5lU3RhcnQgPSBzdGF0ZS5saW5lU3RhcnQ7XG4gICAgdGhpcy5zdGFydEluZGV4ID0gc3RhdGUuc3RhcnRJbmRleDtcbiAgICB0aGlzLnN0YXJ0TGluZSA9IHN0YXRlLnN0YXJ0TGluZTtcbiAgICB0aGlzLnN0YXJ0TGluZVN0YXJ0ID0gc3RhdGUuc3RhcnRMaW5lU3RhcnQ7XG4gICAgdGhpcy5sYXN0SW5kZXggPSBzdGF0ZS5sYXN0SW5kZXg7XG4gICAgdGhpcy5sYXN0TGluZSA9IHN0YXRlLmxhc3RMaW5lO1xuICAgIHRoaXMubGFzdExpbmVTdGFydCA9IHN0YXRlLmxhc3RMaW5lU3RhcnQ7XG4gICAgdGhpcy5sb29rYWhlYWQgPSBzdGF0ZS5sb29rYWhlYWQ7XG4gICAgdGhpcy5zdHJpY3QgPSBzdGF0ZS5zdHJpY3Q7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBzdGF0ZS5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQ7XG4gICAgdGhpcy50b2tlbkluZGV4ID0gc3RhdGUudG9rZW5JbmRleDtcbiAgfVxuXG4gIGNyZWF0ZUlMTEVHQUwoKSB7XG4gICAgdGhpcy5zdGFydEluZGV4ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLnN0YXJ0TGluZSA9IHRoaXMubGluZTtcbiAgICB0aGlzLnN0YXJ0TGluZVN0YXJ0ID0gdGhpcy5saW5lU3RhcnQ7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lMTEVHQUxfVE9LRU4pO1xuICB9XG5cbiAgY3JlYXRlVW5leHBlY3RlZCh0b2tlbikge1xuICAgIHN3aXRjaCAodG9rZW4udHlwZS5rbGFzcykge1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLkVvZjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0VPUyk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuTnVtZXJpY0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9OVU1CRVIpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9TVFJJTkcpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLklkZW50OlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfSURFTlRJRklFUik7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuS2V5d29yZDpcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4uc2xpY2UudGV4dCk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuUHVuY3R1YXRvcjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi50eXBlLm5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUVycm9yKG1lc3NhZ2UsIGFyZykge1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csICgpID0+IGFyZyk7XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKHRoaXMuc3RhcnRJbmRleCwgdGhpcy5zdGFydExpbmUgKyAxLCB0aGlzLnN0YXJ0SW5kZXggLSB0aGlzLnN0YXJ0TGluZVN0YXJ0ICsgMSwgbXNnKTtcbiAgfVxuXG4gIGNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGxvY2F0aW9uLCBtZXNzYWdlLCBhcmcpIHtcbiAgICBsZXQgbXNnID0gbWVzc2FnZS5yZXBsYWNlKC97KFxcZCspfS9nLCAoKSA9PiBhcmcpO1xuICAgIGlmIChsb2NhdGlvbiBpbnN0YW5jZW9mIFRva2VuKSB7XG4gICAgICBsb2NhdGlvbiA9IGxvY2F0aW9uLnNsaWNlLnN0YXJ0TG9jYXRpb247XG4gICAgfVxuICAgIHJldHVybiBuZXcgSnNFcnJvcihsb2NhdGlvbi5vZmZzZXQsIGxvY2F0aW9uLmxpbmUsIGxvY2F0aW9uLmNvbHVtbiArIDEsIG1zZyk7XG4gIH1cblxuICBzdGF0aWMgY3NlMihpZCwgY2gxLCBjaDIpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDI7XG4gIH1cblxuICBzdGF0aWMgY3NlMyhpZCwgY2gxLCBjaDIsIGNoMykge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMztcbiAgfVxuXG4gIHN0YXRpYyBjc2U0KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQ7XG4gIH1cblxuICBzdGF0aWMgY3NlNShpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpID09PSBjaDU7XG4gIH1cblxuICBzdGF0aWMgY3NlNihpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUsIGNoNikge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSkgPT09IGNoNSAmJiBpZC5jaGFyQXQoNikgPT09IGNoNjtcbiAgfVxuXG4gIHN0YXRpYyBjc2U3KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSwgY2g2LCBjaDcpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpID09PSBjaDUgJiYgaWQuY2hhckF0KDYpID09PSBjaDYgJiYgaWQuY2hhckF0KDcpID09PSBjaDc7XG4gIH1cblxuICBzdGF0aWMgZ2V0S2V5d29yZChpZCwgc3RyaWN0KSB7XG4gICAgLy8gXCJjb25zdFwiIGlzIHNwZWNpYWxpemVkIGFzIEtleXdvcmQgaW4gVjguXG4gICAgLy8gXCJ5aWVsZFwiIGFuZCBcImxldFwiIGFyZSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIFNwaWRlck1vbmtleSBhbmQgRVMubmV4dC5cbiAgICAvLyBTb21lIG90aGVycyBhcmUgZnJvbSBmdXR1cmUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSAxIHx8IGlkLmxlbmd0aCA+IDEwKSB7XG4gICAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gICAgfVxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBzd2l0Y2ggKGlkLmxlbmd0aCkge1xuICAgICAgY2FzZSAyOlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgxKSkge1xuICAgICAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSUY7XG4gICAgICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTjtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoaWQuY2hhckF0KDEpID09PSBcIm9cIikge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRPO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm9cIjpcbiAgICAgICAgICAgIGlmIChpZC5jaGFyQXQoMSkgPT09IFwiZlwiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuT0Y7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJhXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlZBUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwib1wiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GT1I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImVcIiwgXCJ3XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTkVXO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJyXCIsIFwieVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRSWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJsXCI6XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIFRva2VuaXplci5jc2UyKGlkLCBcImVcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTEVUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiaFwiLCBcImlcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVEhJUztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiclwiLCBcInVcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVFJVRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwidVwiLCBcImxcIiwgXCJsXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTlVMTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwibFwiLCBcInNcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRUxTRTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiblwiLCBcInVcIiwgXCJtXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImFcIiwgXCJzXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNBU0U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcIm9cIiwgXCJpXCIsIFwiZFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlZPSUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwid1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImlcIiwgXCJ0XCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLldJVEg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcIndcIjogLy8gV0hJTEVcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiaVwiLCBcImxcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuV0hJTEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiYlwiOiAvLyBCUkVBS1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcInJcIiwgXCJlXCIsIFwiYVwiLCBcImtcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5CUkVBSztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6IC8vIEZBTFNFXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiYVwiLCBcImxcIiwgXCJzXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZBTFNFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjogLy8gQ0FUQ0hcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJhXCIsIFwidFwiLCBcImNcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0FUQ0g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcIm9cIiwgXCJuXCIsIFwic1wiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DT05TVDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwibFwiLCBcImFcIiwgXCJzXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNMQVNTO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjogLy8gVEhST1dcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiclwiLCBcIm9cIiwgXCJ3XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVEhST1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwieVwiOiAvLyBZSUVMRFxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImlcIiwgXCJlXCIsIFwibFwiLCBcImRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ZSUVMRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzXCI6IC8vIFNVUEVSXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwidVwiLCBcInBcIiwgXCJlXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNVUEVSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwiZVwiLCBcInRcIiwgXCJ1XCIsIFwiclwiLCBcIm5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5SRVRVUk47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInlcIiwgXCJwXCIsIFwiZVwiLCBcIm9cIiwgXCJmXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVFlQRU9GO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJlXCIsIFwibFwiLCBcImVcIiwgXCJ0XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFTEVURTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwid1wiLCBcImlcIiwgXCJ0XCIsIFwiY1wiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TV0lUQ0g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInRcIiwgXCJhXCIsIFwidFwiLCBcImlcIiwgXCJjXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEIDogVG9rZW5UeXBlLklERU5USUZJRVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInhcIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRVhQT1JUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImlcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJtXCIsIFwicFwiLCBcIm9cIiwgXCJyXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklNUE9SVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwXCI6XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIFRva2VuaXplci5jc2U1KGlkLCBcInVcIiwgXCJiXCIsIFwibFwiLCBcImlcIiwgXCJjXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJkXCI6IC8vIGRlZmF1bHRcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJlXCIsIFwiZlwiLCBcImFcIiwgXCJ1XCIsIFwibFwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUZBVUxUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjogLy8gZmluYWxseVxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcImlcIiwgXCJuXCIsIFwiYVwiLCBcImxcIiwgXCJsXCIsIFwieVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZJTkFMTFk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOiAvLyBleHRlbmRzXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwieFwiLCBcInRcIiwgXCJlXCIsIFwiblwiLCBcImRcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRVhURU5EUztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwXCI6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgICAgICAgIGlmIChzID09PSBcInByaXZhdGVcIiB8fCBzID09PSBcInBhY2thZ2VcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJ1XCIsIFwiblwiLCBcImNcIiwgXCJ0XCIsIFwiaVwiLCBcIm9cIiwgXCJuXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVOQ1RJT047XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcIm9cIiwgXCJuXCIsIFwidFwiLCBcImlcIiwgXCJuXCIsIFwidVwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DT05USU5VRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwiZVwiLCBcImJcIiwgXCJ1XCIsIFwiZ1wiLCBcImdcIiwgXCJlXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFQlVHR0VSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA5OlxuICAgICAgICBpZiAoc3RyaWN0ICYmIChpZC5jaGFyQXQoMCkgPT09IFwicFwiIHx8IGlkLmNoYXJBdCgwKSA9PT0gXCJpXCIpKSB7XG4gICAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgICBpZiAocyA9PT0gXCJwcm90ZWN0ZWRcIiB8fCBzID09PSBcImludGVyZmFjZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEwOlxuICAgICAge1xuICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICBpZiAocyA9PT0gXCJpbnN0YW5jZW9mXCIpIHtcbiAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOU1RBTkNFT0Y7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIHMgPT09IFwiaW1wbGVtZW50c1wiKSB7XG4gICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIFRva2VuVHlwZS5JTExFR0FMO1xuICB9XG5cbiAgc2tpcFNpbmdsZUxpbmVDb21tZW50KG9mZnNldCkge1xuICAgIHRoaXMuaW5kZXggKz0gb2Zmc2V0O1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgKi9cbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2hDb2RlKSkge1xuICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgIGlmIChjaENvZGUgPT09IDB4RCAvKiBcIlxcclwiICovICYmIHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCkgPT09IDB4QSAvKlwiXFxuXCIgKi8pIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLmluZGV4O1xuICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNraXBNdWx0aUxpbmVDb21tZW50KCkge1xuICAgIHRoaXMuaW5kZXggKz0gMjtcbiAgICBjb25zdCBsZW5ndGggPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG4gICAgbGV0IGlzTGluZVN0YXJ0ID0gZmFsc2U7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoQ29kZSA8IDB4ODApIHtcbiAgICAgICAgc3dpdGNoIChjaENvZGUpIHtcbiAgICAgICAgICBjYXNlIDQyOiAgLy8gXCIqXCJcbiAgICAgICAgICAgIC8vIEJsb2NrIGNvbW1lbnQgZW5kcyB3aXRoIFwiKi9cIi5cbiAgICAgICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIi9cIikge1xuICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gdGhpcy5pbmRleCArIDI7XG4gICAgICAgICAgICAgIHJldHVybiBpc0xpbmVTdGFydDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTA6ICAvLyBcIlxcblwiXG4gICAgICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTM6IC8vIFwiXFxyXCI6XG4gICAgICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSAweDIwMjggfHwgY2hDb2RlID09PSAweDIwMjkpIHtcbiAgICAgICAgaXNMaW5lU3RhcnQgPSB0cnVlO1xuICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLmluZGV4O1xuICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gIH1cblxuXG4gIHNraXBDb21tZW50KCkge1xuICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gZmFsc2U7XG5cbiAgICBsZXQgaXNMaW5lU3RhcnQgPSB0aGlzLmluZGV4ID09PSAwO1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuc291cmNlLmxlbmd0aDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBsZXQgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChpc1doaXRlU3BhY2UoY2hDb2RlKSkge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2hDb2RlKSkge1xuICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gMTMgLyogXCJcXHJcIiAqLyAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLmluZGV4O1xuICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgICAgaXNMaW5lU3RhcnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDQ3IC8qIFwiL1wiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA+PSBsZW5ndGgpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gNDcgLyogXCIvXCIgKi8pIHtcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCgyKTtcbiAgICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSA0MiAvKiBcIipcIiAqLykge1xuICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdGhpcy5za2lwTXVsdGlMaW5lQ29tbWVudCgpIHx8IGlzTGluZVN0YXJ0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCF0aGlzLm1vZHVsZSAmJiBpc0xpbmVTdGFydCAmJiBjaENvZGUgPT09IDQ1IC8qIFwiLVwiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA+PSBsZW5ndGgpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyBVKzAwM0UgaXMgXCI+XCJcbiAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiLVwiICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPlwiKSB7XG4gICAgICAgICAgLy8gXCItLT5cIiBpcyBhIHNpbmdsZS1saW5lIGNvbW1lbnRcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCgzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghdGhpcy5tb2R1bGUgJiYgY2hDb2RlID09PSA2MCAvKiBcIjxcIiAqLykge1xuICAgICAgICBpZiAodGhpcy5zb3VyY2Uuc2xpY2UodGhpcy5pbmRleCArIDEsIHRoaXMuaW5kZXggKyA0KSA9PT0gXCIhLS1cIikge1xuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzY2FuSGV4RXNjYXBlMigpIHtcbiAgICBpZiAodGhpcy5pbmRleCArIDIgPiB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIxID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKTtcbiAgICBpZiAocjEgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMiA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpO1xuICAgIGlmIChyMiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIHJldHVybiByMSA8PCA0IHwgcjI7XG4gIH1cblxuICBzY2FuVW5pY29kZSgpIHtcbiAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIntcIikge1xuICAgICAgLy9cXHV7SGV4RGlnaXRzfVxuICAgICAgbGV0IGkgPSB0aGlzLmluZGV4ICsgMTtcbiAgICAgIGxldCBoZXhEaWdpdHMgPSAwLCBjaDtcbiAgICAgIHdoaWxlIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KGkpO1xuICAgICAgICBsZXQgaGV4ID0gZ2V0SGV4VmFsdWUoY2gpO1xuICAgICAgICBpZiAoaGV4ID09PSAtMSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGhleERpZ2l0cyA9IChoZXhEaWdpdHMgPDwgNCkgfCBoZXg7XG4gICAgICAgIGlmIChoZXhEaWdpdHMgPiAweDEwRkZGRikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICAgIGlmIChjaCAhPT0gXCJ9XCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4ID0gaSArIDE7XG4gICAgICByZXR1cm4gaGV4RGlnaXRzO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL1xcdUhleDREaWdpdHNcbiAgICAgIGlmICh0aGlzLmluZGV4ICsgNCA+IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBsZXQgcjEgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpO1xuICAgICAgaWYgKHIxID09PSAtMSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBsZXQgcjIgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpKTtcbiAgICAgIGlmIChyMiA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgbGV0IHIzID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSk7XG4gICAgICBpZiAocjMgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGxldCByNCA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykpO1xuICAgICAgaWYgKHI0ID09PSAtMSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4ICs9IDQ7XG4gICAgICByZXR1cm4gcjEgPDwgMTIgfCByMiA8PCA4IHwgcjMgPDwgNCB8IHI0O1xuICAgIH1cbiAgfVxuXG4gIGdldEVzY2FwZWRJZGVudGlmaWVyKCkge1xuICAgIGxldCBpZCA9IFwiXCI7XG4gICAgbGV0IGNoZWNrID0gaXNJZGVudGlmaWVyU3RhcnQ7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgbGV0IGNvZGUgPSBjaC5jaGFyQ29kZUF0KDApO1xuICAgICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgICsrdGhpcy5pbmRleDtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJ1XCIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICArK3RoaXMuaW5kZXg7XG4gICAgICAgIGNvZGUgPSB0aGlzLnNjYW5Vbmljb2RlKCk7XG4gICAgICAgIGlmIChjb2RlIDwgMCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgweEQ4MDAgPD0gY29kZSAmJiBjb2RlIDw9IDB4REJGRikge1xuICAgICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgKyt0aGlzLmluZGV4O1xuICAgICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwidVwiKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgKyt0aGlzLmluZGV4O1xuICAgICAgICAgIGxldCBsb3dTdXJyb2dhdGVDb2RlID0gdGhpcy5zY2FuVW5pY29kZSgpO1xuICAgICAgICAgIGlmICghKDB4REMwMCA8PSBsb3dTdXJyb2dhdGVDb2RlICYmIGxvd1N1cnJvZ2F0ZUNvZGUgPD0gMHhERkZGKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvZGUgPSBkZWNvZGVVdGYxNihjb2RlLCBsb3dTdXJyb2dhdGVDb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IGZyb21Db2RlUG9pbnQoY29kZSk7XG4gICAgICB9IGVsc2UgaWYgKDB4RDgwMCA8PSBjb2RlICYmIGNvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsb3dTdXJyb2dhdGVDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgKyt0aGlzLmluZGV4O1xuICAgICAgICBpZiAoISgweERDMDAgPD0gbG93U3Vycm9nYXRlQ29kZSAmJiBsb3dTdXJyb2dhdGVDb2RlIDw9IDB4REZGRikpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBjb2RlID0gZGVjb2RlVXRmMTYoY29kZSwgbG93U3Vycm9nYXRlQ29kZSk7XG4gICAgICAgIGNoID0gZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICAgIH1cbiAgICAgIGlmICghY2hlY2soY29kZSkpIHtcbiAgICAgICAgaWYgKGlkLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ID0gc3RhcnQ7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICAgIH1cbiAgICAgIGNoZWNrID0gaXNJZGVudGlmaWVyUGFydDtcbiAgICAgIGlkICs9IGNoO1xuICAgIH1cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBnZXRJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IGwgPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIGxldCBjaGVjayA9IGlzSWRlbnRpZmllclN0YXJ0O1xuICAgIHdoaWxlIChpIDwgbCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KGkpO1xuICAgICAgbGV0IGNvZGUgPSBjaC5jaGFyQ29kZUF0KDApO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIiB8fCAweEQ4MDAgPD0gY29kZSAmJiBjb2RlIDw9IDB4REJGRikge1xuICAgICAgICAvLyBHbyBiYWNrIGFuZCB0cnkgdGhlIGhhcmQgb25lLlxuICAgICAgICB0aGlzLmluZGV4ID0gc3RhcnQ7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEVzY2FwZWRJZGVudGlmaWVyKCk7XG4gICAgICB9XG4gICAgICBpZiAoIWNoZWNrKGNvZGUpKSB7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpO1xuICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIGkpO1xuICAgICAgfVxuICAgICAgKytpO1xuICAgICAgY2hlY2sgPSBpc0lkZW50aWZpZXJQYXJ0O1xuICAgIH1cbiAgICB0aGlzLmluZGV4ID0gaTtcbiAgICByZXR1cm4gdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIGkpO1xuICB9XG5cbiAgc2NhbklkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIC8vIEJhY2tzbGFzaCAoVSswMDVDKSBzdGFydHMgYW4gZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgbGV0IGlkID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcXFxcIiA/IHRoaXMuZ2V0RXNjYXBlZElkZW50aWZpZXIoKSA6IHRoaXMuZ2V0SWRlbnRpZmllcigpO1xuXG4gICAgLy8gVGhlcmUgaXMgbm8ga2V5d29yZCBvciBsaXRlcmFsIHdpdGggb25seSBvbmUgY2hhcmFjdGVyLlxuICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICBzbGljZS50ZXh0ID0gaWQ7XG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gbmV3IElkZW50aWZpZXJUb2tlbihzbGljZSk7XG4gICAgfVxuXG4gICAgbGV0IHN1YlR5cGUgPSBUb2tlbml6ZXIuZ2V0S2V5d29yZChpZCwgdGhpcy5zdHJpY3QpO1xuICAgIGlmIChzdWJUeXBlICE9PSBUb2tlblR5cGUuSUxMRUdBTCkge1xuICAgICAgcmV0dXJuIG5ldyBLZXl3b3JkVG9rZW4oc3ViVHlwZSwgc2xpY2UpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgSWRlbnRpZmllclRva2VuKHNsaWNlKTtcbiAgfVxuXG4gIGdldExvY2F0aW9uKCkge1xuICAgIHJldHVybiBuZXcgU2hpZnQuU291cmNlTG9jYXRpb24odGhpcy5zdGFydEluZGV4LCB0aGlzLnN0YXJ0TGluZSArIDEsIHRoaXMuc3RhcnRJbmRleCAtIHRoaXMuc3RhcnRMaW5lU3RhcnQpO1xuICB9XG5cbiAgZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICByZXR1cm4ge3RleHQ6IHRoaXMuc291cmNlLnNsaWNlKHN0YXJ0LCB0aGlzLmluZGV4KSwgc3RhcnQsIHN0YXJ0TG9jYXRpb24sIGVuZDogdGhpcy5pbmRleH07XG4gIH1cblxuICBzY2FuUHVuY3R1YXRvckhlbHBlcigpIHtcbiAgICBsZXQgY2gxID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuXG4gICAgc3dpdGNoIChjaDEpIHtcbiAgICAgIC8vIENoZWNrIGZvciBtb3N0IGNvbW1vbiBzaW5nbGUtY2hhcmFjdGVyIHB1bmN0dWF0b3JzLlxuICAgICAgY2FzZSBcIi5cIjpcbiAgICAgICAgbGV0IGNoMiA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSk7XG4gICAgICAgIGlmIChjaDIgIT09IFwiLlwiKSByZXR1cm4gVG9rZW5UeXBlLlBFUklPRDtcbiAgICAgICAgbGV0IGNoMyA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMik7XG4gICAgICAgIGlmIChjaDMgIT09IFwiLlwiKSByZXR1cm4gVG9rZW5UeXBlLlBFUklPRDtcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FTExJUFNJUztcbiAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuTFBBUkVOO1xuICAgICAgY2FzZSBcIilcIjpcbiAgICAgIGNhc2UgXCI7XCI6XG4gICAgICBjYXNlIFwiLFwiOlxuICAgICAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gICAgICBjYXNlIFwie1wiOlxuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkxCUkFDRTtcbiAgICAgIGNhc2UgXCJ9XCI6XG4gICAgICBjYXNlIFwiW1wiOlxuICAgICAgY2FzZSBcIl1cIjpcbiAgICAgIGNhc2UgXCI6XCI6XG4gICAgICBjYXNlIFwiP1wiOlxuICAgICAgY2FzZSBcIn5cIjpcbiAgICAgICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gXCI9XCIgKFUrMDAzRCkgbWFya3MgYW4gYXNzaWdubWVudCBvciBjb21wYXJpc29uIG9wZXJhdG9yLlxuICAgICAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgICAgICAgY2FzZSBcIj1cIjpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FUV9TVFJJQ1Q7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FUTtcbiAgICAgICAgICAgIGNhc2UgXCIhXCI6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTkVfU1RSSUNUO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTkU7XG4gICAgICAgICAgICBjYXNlIFwifFwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I7XG4gICAgICAgICAgICBjYXNlIFwiK1wiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9BREQ7XG4gICAgICAgICAgICBjYXNlIFwiLVwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TVUI7XG4gICAgICAgICAgICBjYXNlIFwiKlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9NVUw7XG4gICAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkxURTtcbiAgICAgICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuR1RFO1xuICAgICAgICAgICAgY2FzZSBcIi9cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fRElWO1xuICAgICAgICAgICAgY2FzZSBcIiVcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fTU9EO1xuICAgICAgICAgICAgY2FzZSBcIl5cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjtcbiAgICAgICAgICAgIGNhc2UgXCImXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9BTkQ7XG4gICAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgYnJlYWs7IC8vZmFpbGVkXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggKyAxIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2gyID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgIGlmIChjaDEgPT09IGNoMikge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICBsZXQgY2gzID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKTtcbiAgICAgICAgICBpZiAoY2gxID09PSBcIj5cIiAmJiBjaDMgPT09IFwiPlwiKSB7XG4gICAgICAgICAgICAvLyA0LWNoYXJhY3RlciBwdW5jdHVhdG9yOiA+Pj49XG4gICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDMgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSFJfVU5TSUdORUQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI8XCIgJiYgY2gzID09PSBcIj1cIikge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hMO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjaDEgPT09IFwiPlwiICYmIGNoMyA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NIUjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3RoZXIgMi1jaGFyYWN0ZXIgcHVuY3R1YXRvcnM6ICsrIC0tIDw8ID4+ICYmIHx8XG4gICAgICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAgICAgY2FzZSBcIitcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU5DO1xuICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFQztcbiAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSEw7XG4gICAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hSO1xuICAgICAgICAgIGNhc2UgXCImXCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFORDtcbiAgICAgICAgICBjYXNlIFwifFwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5PUjtcbiAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhazsgLy9mYWlsZWRcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaDEgPT09IFwiPVwiICYmIGNoMiA9PT0gXCI+XCIpIHtcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BUlJPVztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gIH1cblxuICAvLyA3LjcgUHVuY3R1YXRvcnNcbiAgc2NhblB1bmN0dWF0b3IoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICBsZXQgc3ViVHlwZSA9IHRoaXMuc2NhblB1bmN0dWF0b3JIZWxwZXIoKTtcbiAgICB0aGlzLmluZGV4ICs9IHN1YlR5cGUubmFtZS5sZW5ndGg7XG4gICAgcmV0dXJuIG5ldyBQdW5jdHVhdG9yVG9rZW4oc3ViVHlwZSwgdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICB9XG5cbiAgc2NhbkhleExpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICBsZXQgaSA9IHRoaXMuaW5kZXg7XG4gICAgd2hpbGUgKGkgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdChpKTtcbiAgICAgIGxldCBoZXggPSBnZXRIZXhWYWx1ZShjaCk7XG4gICAgICBpZiAoaGV4ID09PSAtMSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCA9PT0gaSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgaWYgKGkgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgaXNJZGVudGlmaWVyU3RhcnQodGhpcy5zb3VyY2UuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHRoaXMuaW5kZXggPSBpO1xuXG4gICAgbGV0IHNsaWNlID0gdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHNsaWNlLCBwYXJzZUludChzbGljZS50ZXh0LnN1YnN0cigyKSwgMTYpKTtcbiAgfVxuXG4gIHNjYW5CaW5hcnlMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgbGV0IG9mZnNldCA9IHRoaXMuaW5kZXggLSBzdGFydDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggIT09IFwiMFwiICYmIGNoICE9PSBcIjFcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCAtIHN0YXJ0IDw9IG9mZnNldCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgKGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCkpXG4gICAgICAgIHx8IGlzRGVjaW1hbERpZ2l0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCkpKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLCBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKS50ZXh0LnN1YnN0cihvZmZzZXQpLCAyKSwgZmFsc2UpO1xuICB9XG5cbiAgc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbikge1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggLSBzdGFydCA9PT0gMikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLCBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKS50ZXh0LnN1YnN0cigyKSwgOCksIGZhbHNlKTtcbiAgfVxuXG4gIHNjYW5MZWdhY3lPY3RhbExpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICBsZXQgaXNPY3RhbCA9IHRydWU7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiOFwiIHx8IGNoID09PSBcIjlcIikge1xuICAgICAgICBpc09jdGFsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSwgcGFyc2VJbnQodGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikudGV4dC5zdWJzdHIoMSksIGlzT2N0YWwgPyA4IDogMTApLCB0cnVlKTtcbiAgfVxuXG4gIHNjYW5OdW1lcmljTGl0ZXJhbCgpIHtcbiAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgLy8gYXNzZXJ0KGNoID09PSBcIi5cIiB8fCBcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIilcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgaWYgKGNoID09PSBcIjBcIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIGlmIChjaCA9PT0gXCJ4XCIgfHwgY2ggPT09IFwiWFwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5IZXhMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJiXCIgfHwgY2ggPT09IFwiQlwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5CaW5hcnlMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJvXCIgfHwgY2ggPT09IFwiT1wiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5PY3RhbExpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuTGVnYWN5T2N0YWxMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoICE9PSBcIi5cIikge1xuICAgICAgLy8gTXVzdCBiZSBcIjFcIi4uXCI5XCJcbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGUgPSAwO1xuICAgIGlmIChjaCA9PT0gXCIuXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIH1cblxuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgZSsrO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVPRiBub3QgcmVhY2hlZCBoZXJlXG4gICAgaWYgKGNoID09PSBcImVcIiB8fCBjaCA9PT0gXCJFXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG5cbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgbGV0IG5lZyA9IGZhbHNlO1xuICAgICAgaWYgKGNoID09PSBcIitcIiB8fCBjaCA9PT0gXCItXCIpIHtcbiAgICAgICAgbmVnID0gY2ggPT09IFwiLVwiO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cblxuICAgICAgbGV0IGYgPSAwO1xuICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIGYgKj0gMTA7XG4gICAgICAgICAgZiArPSArY2g7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICBlICs9IG5lZyA/IGYgOiAtZjtcbiAgICB9XG5cbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSk7XG4gIH1cblxuICBzY2FuU3RyaW5nRXNjYXBlKHN0ciwgb2N0YWwpIHtcbiAgICB0aGlzLmluZGV4Kys7XG4gICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICBpZiAoIWlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICBzdHIgKz0gXCJcXG5cIjtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgc3RyICs9IFwiXFxyXCI7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgIHN0ciArPSBcIlxcdFwiO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVcIjpcbiAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICBsZXQgcmVzdG9yZSA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgbGV0IHVuZXNjYXBlZDtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdW5lc2NhcGVkID0gY2ggPT09IFwidVwiID8gdGhpcy5zY2FuVW5pY29kZSgpIDogdGhpcy5zY2FuSGV4RXNjYXBlMigpO1xuICAgICAgICAgIGlmICh1bmVzY2FwZWQgPCAwKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RyICs9IGZyb21Db2RlUG9pbnQodW5lc2NhcGVkKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICBzdHIgKz0gXCJcXGJcIjtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgc3RyICs9IFwiXFxmXCI7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgIHN0ciArPSBcIlxcdTAwMEJcIjtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICBsZXQgb2N0TGVuID0gMTtcbiAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAvLyB3aXRoIDAsIDEsIDIsIDNcbiAgICAgICAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjNcIikge1xuICAgICAgICAgICAgICBvY3RMZW4gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGNvZGUgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKG9jdExlbiA8IDMgJiYgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgICAgICAgaWYgKG9jdExlbiA+IDAgfHwgY2ggIT09IFwiMFwiKSB7XG4gICAgICAgICAgICAgICAgb2N0YWwgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvZGUgKj0gODtcbiAgICAgICAgICAgICAgb2N0TGVuKys7XG4gICAgICAgICAgICAgIGNvZGUgKz0gY2ggLSBcIjBcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIjhcIiB8fCBjaCA9PT0gXCI5XCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoY2ggPT09IFwiXFxyXCIgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcblwiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgIHRoaXMubGluZSsrO1xuICAgIH1cbiAgICByZXR1cm4gW3N0ciwgb2N0YWxdO1xuICB9XG4gIC8vIDcuOC40IFN0cmluZyBMaXRlcmFsc1xuICBzY2FuU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcblxuICAgIGxldCBxdW90ZSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAvLyAgYXNzZXJ0KChxdW90ZSA9PT0gXCJcXFwiXCIgfHwgcXVvdGUgPT09IFwiXCJcIiksIFwiU3RyaW5nIGxpdGVyYWwgbXVzdCBzdGFydHMgd2l0aCBhIHF1b3RlXCIpXG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXgrKztcblxuICAgIGxldCBvY3RhbCA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IHF1b3RlKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbiksIHN0ciwgb2N0YWwpO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgW3N0ciwgb2N0YWxdID0gdGhpcy5zY2FuU3RyaW5nRXNjYXBlKHN0ciwgb2N0YWwpO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gIH1cblxuICBzY2FuVGVtcGxhdGVFbGVtZW50KCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgICBjYXNlIDB4NjA6ICAvLyBgXG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiBuZXcgVGVtcGxhdGVUb2tlbih0cnVlLCB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICAgIGNhc2UgMHgyNDogIC8vICRcbiAgICAgICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4ICsgMSkgPT09IDB4N0IpIHsgIC8vIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXggKz0gMjtcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGVtcGxhdGVUb2tlbihmYWxzZSwgdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMHg1QzogIC8vIFxcXFxcbiAgICAgICAge1xuICAgICAgICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgICBsZXQgb2N0YWwgPSB0aGlzLnNjYW5TdHJpbmdFc2NhcGUoXCJcIiwgZmFsc2UpWzFdO1xuICAgICAgICAgIGlmIChvY3RhbCkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihsb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lMTEVHQUxfVE9LRU4pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgfVxuXG4gIHNjYW5SZWdFeHAoc3RyKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIGxldCB0ZXJtaW5hdGVkID0gZmFsc2U7XG4gICAgbGV0IGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICAvLyBFQ01BLTI2MiA3LjguNVxuICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjbGFzc01hcmtlcikge1xuICAgICAgICAgIGlmIChjaCA9PT0gXCJdXCIpIHtcbiAgICAgICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChjaCA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgIHRlcm1pbmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJbXCIpIHtcbiAgICAgICAgICAgIGNsYXNzTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0ZXJtaW5hdGVkKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkgJiYgY2ggIT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgc3RyICs9IGNoO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLCBzdHIpO1xuICB9XG5cbiAgYWR2YW5jZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMubGFzdEluZGV4ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmxhc3RMaW5lID0gdGhpcy5saW5lO1xuICAgIHRoaXMubGFzdExpbmVTdGFydCA9IHRoaXMubGluZVN0YXJ0O1xuXG4gICAgdGhpcy5za2lwQ29tbWVudCgpO1xuXG4gICAgdGhpcy5zdGFydEluZGV4ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLnN0YXJ0TGluZSA9IHRoaXMubGluZTtcbiAgICB0aGlzLnN0YXJ0TGluZVN0YXJ0ID0gdGhpcy5saW5lU3RhcnQ7XG5cbiAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBuZXcgRU9GVG9rZW4odGhpcy5nZXRTbGljZSh0aGlzLmluZGV4LCBzdGFydExvY2F0aW9uKSk7XG4gICAgfVxuXG4gICAgbGV0IGNoYXJDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcblxuICAgIGlmIChjaGFyQ29kZSA8IDB4ODApIHtcbiAgICAgIGlmIChQVU5DVFVBVE9SX1NUQVJUW2NoYXJDb2RlXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2hhckNvZGUpIHx8IGNoYXJDb2RlID09PSAweDVDIC8qIGJhY2tzbGFzaCAoXFwpICovKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9sZXQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDJFKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXggKyAxKSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdHJpbmcgbGl0ZXJhbCBzdGFydHMgd2l0aCBzaW5nbGUgcXVvdGUgKFUrMDAyNykgb3IgZG91YmxlIHF1b3RlIChVKzAwMjIpLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDI3IHx8IGNoYXJDb2RlID09PSAweDIyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5TdHJpbmdMaXRlcmFsKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRlbXBsYXRlIGxpdGVyYWwgc3RhcnRzIHdpdGggYmFjayBxdW90ZSAoVSswMDYwKVxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDYwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5UZW1wbGF0ZUVsZW1lbnQoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKDB4MzAgLyogXCIwXCIgKi8gPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHgzOSAvKiBcIjlcIiAqLykge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2xhc2ggKC8pIFUrMDAyRiBjYW4gYWxzbyBzdGFydCBhIHJlZ2V4LlxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaGFyQ29kZSkgfHwgMHhEODAwIDw9IGNoYXJDb2RlICYmIGNoYXJDb2RlIDw9IDB4REJGRikge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuSWRlbnRpZmllcigpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG4gIH1cblxuICBlb2YoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5FT1M7XG4gIH1cblxuICBsZXgoKSB7XG4gICAgbGV0IHByZXZUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG4gICAgdGhpcy50b2tlbkluZGV4Kys7XG4gICAgcmV0dXJuIHByZXZUb2tlbjtcbiAgfVxufVxuIl19