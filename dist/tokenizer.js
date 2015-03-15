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
        return {
          line: this.startLine + 1,
          column: this.startIndex - this.startLineStart,
          offset: this.startIndex
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQkFpQitHLFNBQVM7O0lBQWhILFdBQVcsVUFBWCxXQUFXO0lBQUUsZ0JBQWdCLFVBQWhCLGdCQUFnQjtJQUFFLFlBQVksVUFBWixZQUFZO0lBQUUsaUJBQWlCLFVBQWpCLGlCQUFpQjtJQUFFLGdCQUFnQixVQUFoQixnQkFBZ0I7SUFBRSxjQUFjLFVBQWQsY0FBYztJQUNoRyxhQUFhLFdBQU8sVUFBVSxFQUE5QixhQUFhO0lBQ1QsS0FBSyxXQUFNLFdBQVc7O0FBRTNCLElBQU0sVUFBVSxXQUFWLFVBQVUsR0FBRztBQUN4QixLQUFHLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ3BCLE9BQUssRUFBRSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFDO0FBQ25ELFNBQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFDO0FBQ2xELGdCQUFjLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ2pDLGlCQUFlLEVBQUUsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ25DLFlBQVUsRUFBRSxFQUFDLElBQUksRUFBRSxZQUFZLEVBQUM7QUFDaEMsZUFBYSxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUMvQixtQkFBaUIsRUFBRSxFQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBQztBQUM5QyxhQUFXLEVBQUUsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQzNCLGNBQVksRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDN0IsU0FBTyxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQztDQUMzQixDQUFDOztBQUVLLElBQU0sU0FBUyxXQUFULFNBQVMsR0FBRztBQUN2QixLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3pDLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDaEQsV0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNwRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDckQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUNqRCxhQUFXLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3RELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELGVBQWEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDekQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3ZELHFCQUFtQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUNqRSxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLGNBQVksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3RELFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdEQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM3QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzdDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQzNELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ3JELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDckQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3ZELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDL0Msc0JBQW9CLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQzNELDZCQUEyQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztBQUNsRSxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztDQUMvQyxDQUFDOztBQUVGLElBQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQztBQUNyQixJQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQ3JCLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNoQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRWYsSUFBTSxtQkFBbUIsR0FBRyxDQUMxQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNsSCxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNySCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3BILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRXRGLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztJQUV0QixLQUFL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LEVBQUUsR0FBRyxFQUFFO0FBQ3ZDLGVBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7T0FDN0g7Ozs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDNUMsZUFBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztPQUNySjs7OztBQUVNLFFBQUk7YUFBQSxjQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDakQsZUFBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztPQUM3Szs7OztBQUVNLGNBQVU7YUFBQSxvQkFBQyxFQUFFLEVBQUUsTUFBTSxFQUFFOzs7OztBQUs1QixZQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsRUFBRSxFQUFFO0FBQ3JDLGlCQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUM7U0FDMUI7OztBQUdELGdCQUFRLEVBQUUsQ0FBQyxNQUFNO0FBQ2YsZUFBSyxDQUFDO0FBQ0osb0JBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbEIsbUJBQUssR0FBRztBQUNOLHdCQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLHVCQUFLLEdBQUc7QUFDTiwyQkFBTyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQUEsQUFDdEIsdUJBQUssR0FBRztBQUNOLDJCQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFBQSxBQUN0QjtBQUNFLDBCQUFNO0FBQUEsaUJBQ1Q7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRztBQUNOLG9CQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3hCLHlCQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUM7aUJBQ3JCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUN4Qix5QkFBTyxTQUFTLENBQUMsRUFBRSxDQUFDO2lCQUNyQjtBQUNELHNCQUFNO0FBQUEsQUFDUjtBQUNFLHNCQUFNO0FBQUEsYUFDVDtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLENBQUM7QUFDSixvQkFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNsQixtQkFBSyxHQUFHO0FBQ04sb0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLHlCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7aUJBQ3RCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDaEMseUJBQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQztpQkFDdEI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNoQyx5QkFBTyxTQUFTLENBQUMsR0FBRyxDQUFDO2lCQUN0QjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxHQUFHO0FBQ04sb0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLHlCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7aUJBQ3RCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxNQUFNLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzFDLHlCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7aUJBQ3RCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSO0FBQ0Usc0JBQU07QUFBQSxhQUNUO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssQ0FBQztBQUNKLG9CQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3JDLHlCQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7aUJBQ3ZCLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzVDLHlCQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7aUJBQ3ZCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3JDLHlCQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7aUJBQ3ZCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3JDLHlCQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7aUJBQ3ZCLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzVDLHlCQUFPLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQztpQkFDdkM7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDckMseUJBQU8sU0FBUyxDQUFDLElBQUksQ0FBQztpQkFDdkI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDckMseUJBQU8sU0FBUyxDQUFDLElBQUksQ0FBQztpQkFDdkI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDckMseUJBQU8sU0FBUyxDQUFDLElBQUksQ0FBQztpQkFDdkI7QUFDRCxzQkFBTTtBQUFBLEFBQ1I7QUFDRSxzQkFBTTtBQUFBLGFBQ1Q7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxDQUFDO0FBQ0osb0JBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbEIsbUJBQUssR0FBRzs7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMxQyx5QkFBTyxTQUFTLENBQUMsS0FBSyxDQUFDO2lCQUN4QjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxHQUFHOztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzFDLHlCQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUM7aUJBQ3hCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7O0FBQ04sb0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDMUMseUJBQU8sU0FBUyxDQUFDLEtBQUssQ0FBQztpQkFDeEI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRzs7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMxQyx5QkFBTyxTQUFTLENBQUMsS0FBSyxDQUFDO2lCQUN4QixNQUFNLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDakQseUJBQU8sU0FBUyxDQUFDLEtBQUssQ0FBQztpQkFDeEIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2pELHlCQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUM7aUJBQ3hCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7O0FBQ04sb0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDMUMseUJBQU8sU0FBUyxDQUFDLEtBQUssQ0FBQztpQkFDeEI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRzs7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMxQyx5QkFBTyxTQUFTLENBQUMsS0FBSyxDQUFDO2lCQUN4QjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxHQUFHOztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzFDLHlCQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUM7aUJBQ3hCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSO0FBQ0Usc0JBQU07QUFBQSxhQUNUO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssQ0FBQztBQUNKLG9CQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MseUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQztpQkFDekI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMvQyx5QkFBTyxTQUFTLENBQUMsTUFBTSxDQUFDO2lCQUN6QjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxHQUFHO0FBQ04sb0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQy9DLHlCQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7aUJBQ3pCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MseUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQztpQkFDekIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUN0RCx5QkFBTyxNQUFNLEdBQUcsU0FBUyxDQUFDLDJCQUEyQixHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUM7aUJBQzlFO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MseUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQztpQkFDekI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMvQyx5QkFBTyxTQUFTLENBQUMsTUFBTSxDQUFDO2lCQUN6QjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxHQUFHO0FBQ04sb0JBQUksTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUN6RCx5QkFBTyxTQUFTLENBQUMsMkJBQTJCLENBQUM7aUJBQzlDO0FBQ0Qsc0JBQU07QUFBQSxBQUNSO0FBQ0Usc0JBQU07QUFBQSxhQUNUO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssQ0FBQztBQUNKLG9CQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLG1CQUFLLEdBQUc7O0FBQ04sb0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNwRCx5QkFBTyxTQUFTLENBQUMsT0FBTyxDQUFDO2lCQUMxQjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxHQUFHOztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDcEQseUJBQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztpQkFDMUI7QUFDRCxzQkFBTTtBQUFBLEFBQ1IsbUJBQUssR0FBRzs7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3BELHlCQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUM7aUJBQzFCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxNQUFNLEVBQUU7QUFDVixzQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsc0JBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFO0FBQ3RDLDJCQUFPLFNBQVMsQ0FBQywyQkFBMkIsQ0FBQzttQkFDOUM7aUJBQ0Y7QUFDRCxzQkFBTTtBQUFBLEFBQ1I7QUFDRSxzQkFBTTtBQUFBLGFBQ1Q7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxDQUFDO0FBQ0osb0JBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbEIsbUJBQUssR0FBRztBQUNOLG9CQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3pELHlCQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUM7aUJBQzNCO0FBQ0Qsc0JBQU07QUFBQSxBQUNSLG1CQUFLLEdBQUc7QUFDTixvQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUN6RCx5QkFBTyxTQUFTLENBQUMsUUFBUSxDQUFDO2lCQUMzQjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxHQUFHO0FBQ04sb0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDekQseUJBQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQztpQkFDM0I7QUFDRCxzQkFBTTtBQUFBLEFBQ1I7QUFDRSxzQkFBTTtBQUFBLGFBQ1Q7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxDQUFDO0FBQ0osZ0JBQUksTUFBTSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFBLEFBQUMsRUFBRTtBQUM1RCxrQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsa0JBQUksQ0FBQyxLQUFLLFdBQVcsSUFBSSxDQUFDLEtBQUssV0FBVyxFQUFFO0FBQzFDLHVCQUFPLFNBQVMsQ0FBQywyQkFBMkIsQ0FBQztlQUM5QzthQUNGO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssRUFBRTtBQUNQO0FBQ0Usa0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGtCQUFJLENBQUMsS0FBSyxZQUFZLEVBQUU7QUFDdEIsdUJBQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztlQUM3QixNQUFNLElBQUksTUFBTSxJQUFJLENBQUMsS0FBSyxZQUFZLEVBQUU7QUFDdkMsdUJBQU8sU0FBUyxDQUFDLDJCQUEyQixDQUFDO2VBQzlDO2FBQ0Y7QUFDQyxrQkFBTTtBQUFBLEFBQ1I7QUFDRSxrQkFBTTtBQUFBLFNBQ1Q7QUFDRCxlQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUM7T0FDMUI7Ozs7O0FBblhELGtCQUFjO2FBQUEsMEJBQUc7QUFDZixlQUFPO0FBQ0wsZ0JBQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtBQUNuQixlQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7QUFDakIsY0FBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0FBQ2YsbUJBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztBQUN6QixvQkFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO0FBQzNCLG1CQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7QUFDekIsd0JBQWMsRUFBRSxJQUFJLENBQUMsY0FBYztBQUNuQyxtQkFBUyxFQUFFLElBQUksQ0FBQyxTQUFTO0FBQ3pCLGtCQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7QUFDdkIsdUJBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtBQUNqQyxtQkFBUyxFQUFFLElBQUksQ0FBQyxTQUFTO0FBQ3pCLGdCQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07QUFDbkIscUNBQTJCLEVBQUUsSUFBSSxDQUFDLDJCQUEyQjtBQUM3RCxvQkFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQzVCLENBQUM7T0FDSDs7OztBQUVELHFCQUFpQjthQUFBLDJCQUFDLEtBQUssRUFBRTtBQUN2QixZQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDM0IsWUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUN2QixZQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7QUFDakMsWUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQ25DLFlBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUNqQyxZQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7QUFDM0MsWUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUMvQixZQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7QUFDekMsWUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUMzQixZQUFJLENBQUMsMkJBQTJCLEdBQUcsS0FBSyxDQUFDLDJCQUEyQixDQUFDO0FBQ3JFLFlBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztPQUNwQzs7OztBQUVELGlCQUFhO2FBQUEseUJBQUc7QUFDZCxZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDN0IsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQzNCLFlBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUNyQyxlQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLENBQUM7T0FDakU7Ozs7QUFFRCxvQkFBZ0I7YUFBQSwwQkFBQyxLQUFLLEVBQUU7QUFDdEIsZ0JBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLO0FBQ3RCLGVBQUssVUFBVSxDQUFDLEdBQUc7QUFDakIsbUJBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7QUFBQSxBQUN4RCxlQUFLLFVBQVUsQ0FBQyxjQUFjO0FBQzVCLG1CQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFBQSxBQUMzRCxlQUFLLFVBQVUsQ0FBQyxhQUFhO0FBQzNCLG1CQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFBQSxBQUMzRCxlQUFLLFVBQVUsQ0FBQyxLQUFLO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFBQSxBQUMvRCxlQUFLLFVBQVUsQ0FBQyxPQUFPO0FBQ3JCLGdCQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLG9CQUFvQixFQUFFO0FBQ2pELHFCQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLENBQUM7YUFDakU7QUFDRCxnQkFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQywyQkFBMkIsRUFBRTtBQUN4RCxxQkFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQzdEO0FBQ0QsbUJBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUFBLEFBQzVFLGVBQUssVUFBVSxDQUFDLFVBQVU7QUFDeEIsbUJBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUFBLFNBQzVFO09BQ0Y7Ozs7QUFFRCxlQUFXO2FBQUEscUJBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtBQUN4QixZQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtpQkFBTSxHQUFHO1NBQUEsQ0FBQyxDQUFDO0FBQ2pELGVBQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQ3pHOzs7O0FBRUQsMkJBQXVCO2FBQUEsaUNBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUU7QUFDOUMsWUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7aUJBQU0sR0FBRztTQUFBLENBQUMsQ0FBQztBQUNqRCxZQUFJLFFBQVEsWUFBWSxLQUFLLEVBQUU7QUFDN0Isa0JBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQztTQUN6QztBQUNELGVBQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQzlFOzs7O0FBd1NELHlCQUFxQjthQUFBLCtCQUFDLE1BQU0sRUFBRTtBQUM1QixZQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQztBQUNyQixlQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Ozs7QUFJdEMsY0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hELGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGNBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDNUIsZ0JBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7QUFDeEMsZ0JBQUksTUFBTSxLQUFLLEVBQUcsV0FBQSxJQUFlLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFHLFVBQUEsRUFBWTtBQUNyRixrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2Q7QUFDRCxnQkFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzVCLGdCQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDWixtQkFBTztXQUNSO1NBQ0Y7T0FDRjs7OztBQUVELHdCQUFvQjthQUFBLGdDQUFHO0FBQ3JCLFlBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO0FBQ2hCLFlBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2xDLFlBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztBQUN4QixlQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFFO0FBQzFCLGNBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoRCxjQUFJLE1BQU0sR0FBRyxHQUFJLEVBQUU7QUFDakIsb0JBQVEsTUFBTTtBQUNaLG1CQUFLLEVBQUU7OztBQUVMLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQzlDLHNCQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzVCLHlCQUFPLFdBQVcsQ0FBQztpQkFDcEI7QUFDRCxvQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isc0JBQU07QUFBQSxBQUNSLG1CQUFLLEVBQUU7O0FBQ0wsMkJBQVcsR0FBRyxJQUFJLENBQUM7QUFDbkIsb0JBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7QUFDeEMsb0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLG9CQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDNUIsb0JBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNaLHNCQUFNO0FBQUEsQUFDUixtQkFBSyxFQUFFOztBQUNMLDJCQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ25CLG9CQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDO0FBQ3hDLG9CQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQy9DLHNCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQ2Q7QUFDRCxvQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isb0JBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUM1QixvQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ1osc0JBQU07QUFBQSxBQUNSO0FBQ0Usb0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUFBLGFBQ2hCO1dBQ0YsTUFBTSxJQUFJLE1BQU0sS0FBSyxJQUFNLElBQUksTUFBTSxLQUFLLElBQU0sRUFBRTtBQUNqRCx1QkFBVyxHQUFHLElBQUksQ0FBQztBQUNuQixnQkFBSSxDQUFDLDJCQUEyQixHQUFHLElBQUksQ0FBQztBQUN4QyxnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsZ0JBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUM1QixnQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1dBQ2IsTUFBTTtBQUNMLGdCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7V0FDZDtTQUNGO0FBQ0QsY0FBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7T0FDNUI7Ozs7QUFHRCxlQUFXO2FBQUEsdUJBQUc7QUFDWixZQUFJLENBQUMsMkJBQTJCLEdBQUcsS0FBSyxDQUFDOztBQUV6QyxZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztBQUNuQyxZQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQzs7QUFFbEMsZUFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRTtBQUMxQixjQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEQsY0FBSSxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDeEIsZ0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztXQUNkLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNuQyxnQkFBSSxDQUFDLDJCQUEyQixHQUFHLElBQUksQ0FBQztBQUN4QyxnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsZ0JBQUksTUFBTSxLQUFLLEVBQUUsV0FBQSxJQUFlLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDdkUsa0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNkO0FBQ0QsZ0JBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUM1QixnQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ1osdUJBQVcsR0FBRyxJQUFJLENBQUM7V0FDcEIsTUFBTSxJQUFJLE1BQU0sS0FBSyxFQUFFLFVBQUEsRUFBWTtBQUNsQyxnQkFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxNQUFNLEVBQUU7QUFDNUIsb0JBQU07YUFDUDtBQUNELGtCQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNoRCxnQkFBSSxNQUFNLEtBQUssRUFBRSxVQUFBLEVBQVk7QUFDM0Isa0JBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5Qix5QkFBVyxHQUFHLElBQUksQ0FBQzthQUNwQixNQUFNLElBQUksTUFBTSxLQUFLLEVBQUUsVUFBQSxFQUFZO0FBQ2xDLHlCQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksV0FBVyxDQUFDO2FBQzFELE1BQU07QUFDTCxvQkFBTTthQUNQO1dBQ0YsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxXQUFXLElBQUksTUFBTSxLQUFLLEVBQUUsVUFBQSxFQUFZO0FBQ2pFLGdCQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLE1BQU0sRUFBRTtBQUM1QixvQkFBTTthQUNQOztBQUVELGdCQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFOztBQUU1RixrQkFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQy9CLE1BQU07QUFDTCxvQkFBTTthQUNQO1dBQ0YsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLEtBQUssRUFBRSxVQUFBLEVBQVk7QUFDbEQsZ0JBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUU7QUFDL0Qsa0JBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMvQixNQUFNO0FBQ0wsb0JBQU07YUFDUDtXQUNGLE1BQU07QUFDTCxrQkFBTTtXQUNQO1NBQ0Y7T0FDRjs7OztBQUVELGtCQUFjO2FBQUEsMEJBQUc7QUFDZixZQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3ZDLGlCQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ1g7QUFDRCxZQUFJLEVBQUUsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDckQsWUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDYixpQkFBTyxDQUFDLENBQUMsQ0FBQztTQUNYO0FBQ0QsWUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxZQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNiLGlCQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ1g7QUFDRCxZQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztBQUNoQixlQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO09BQ3JCOzs7O0FBRUQsZUFBVzthQUFBLHVCQUFHO0FBQ1osWUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFOztBQUUxQyxjQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUN2QixjQUFJLFNBQVMsR0FBRyxDQUFDO2NBQUUsRUFBRSxZQUFBLENBQUM7QUFDdEIsaUJBQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQzdCLGNBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixnQkFBSSxHQUFHLEdBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFCLGdCQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNkLG9CQUFNO2FBQ1A7QUFDRCxxQkFBUyxHQUFHLEFBQUMsU0FBUyxJQUFJLENBQUMsR0FBSSxHQUFHLENBQUM7QUFDbkMsZ0JBQUksU0FBUyxHQUFHLE9BQVEsRUFBRTtBQUN4QixvQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDNUI7QUFDRCxhQUFDLEVBQUUsQ0FBQztXQUNMO0FBQ0QsY0FBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ2Qsa0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1dBQzVCO0FBQ0QsY0FBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLGlCQUFPLFNBQVMsQ0FBQztTQUNsQixNQUFNOztBQUVMLGNBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdkMsbUJBQU8sQ0FBQyxDQUFDLENBQUM7V0FDWDtBQUNELGNBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNyRCxjQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNiLG1CQUFPLENBQUMsQ0FBQyxDQUFDO1dBQ1g7QUFDRCxjQUFJLEVBQUUsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELGNBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2IsbUJBQU8sQ0FBQyxDQUFDLENBQUM7V0FDWDtBQUNELGNBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsY0FBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDYixtQkFBTyxDQUFDLENBQUMsQ0FBQztXQUNYO0FBQ0QsY0FBSSxFQUFFLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxjQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNiLG1CQUFPLENBQUMsQ0FBQyxDQUFDO1dBQ1g7QUFDRCxjQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztBQUNoQixpQkFBTyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDMUM7T0FDRjs7OztBQUVELHdCQUFvQjthQUFBLGdDQUFHO0FBQ3JCLFlBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUNaLFlBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDOztBQUU5QixlQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdEMsY0FBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLGNBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsY0FBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN2QixZQUFFLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDYixjQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDZixnQkFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3BDLG9CQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUM1QjtBQUNELGdCQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDMUMsb0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzVCO0FBQ0QsY0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ2IsZ0JBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDMUIsZ0JBQUksSUFBSSxHQUFHLENBQUMsRUFBRTtBQUNaLG9CQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzthQUM1QjtBQUNELGdCQUFJLEtBQU0sSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEtBQU0sRUFBRTtBQUNwQyxrQkFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQzNDLHNCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztlQUM1QjtBQUNELGdCQUFFLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDYixrQkFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3BDLHNCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztlQUM1QjtBQUNELGtCQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDMUMsc0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2VBQzVCO0FBQ0QsZ0JBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNiLGtCQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMxQyxrQkFBSSxFQUFFLEtBQU0sSUFBSSxnQkFBZ0IsSUFBSSxnQkFBZ0IsSUFBSSxLQUFNLENBQUEsQUFBQyxFQUFFO0FBQy9ELHNCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztlQUM1QjtBQUNELGtCQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2FBQzVDO0FBQ0QsY0FBRSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUMxQixNQUFNLElBQUksS0FBTSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBTSxFQUFFO0FBQzNDLGdCQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDcEMsb0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzVCO0FBQ0QsZ0JBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFELGNBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNiLGdCQUFJLEVBQUUsS0FBTSxJQUFJLGdCQUFnQixJQUFJLGdCQUFnQixJQUFJLEtBQU0sQ0FBQSxBQUFDLEVBQUU7QUFDL0Qsb0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzVCO0FBQ0QsZ0JBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDM0MsY0FBRSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUMxQjtBQUNELGNBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEIsZ0JBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDakIsb0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzVCO0FBQ0QsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ25CLG1CQUFPLEVBQUUsQ0FBQztXQUNYO0FBQ0QsZUFBSyxHQUFHLGdCQUFnQixDQUFDO0FBQ3pCLFlBQUUsSUFBSSxFQUFFLENBQUM7U0FDVjtBQUNELGVBQU8sRUFBRSxDQUFDO09BQ1g7Ozs7QUFFRCxpQkFBYTthQUFBLHlCQUFHO0FBQ2QsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN2QixZQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMzQixZQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ25CLFlBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDO0FBQzlCLGVBQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNaLGNBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLGNBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsY0FBSSxFQUFFLEtBQUssSUFBSSxJQUFJLEtBQU0sSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEtBQU0sRUFBRTs7QUFFbkQsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1dBQ3BDO0FBQ0QsY0FBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNoQixnQkFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixtQkFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7V0FDcEM7QUFDRCxZQUFFLENBQUMsQ0FBQztBQUNKLGVBQUssR0FBRyxnQkFBZ0IsQ0FBQztTQUMxQjtBQUNELFlBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsZUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7T0FDcEM7Ozs7QUFFRCxrQkFBYzthQUFBLDBCQUFHO0FBQ2YsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7OztBQUd2QixZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzs7OztBQUl0RyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNoRCxhQUFLLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQzs7QUFFaEIsWUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNuQixpQkFBTyxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNuQzs7QUFFRCxZQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDcEQsWUFBSSxPQUFPLEtBQUssU0FBUyxDQUFDLE9BQU8sRUFBRTtBQUNqQyxpQkFBTyxJQUFJLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekM7O0FBRUQsZUFBTyxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNuQzs7OztBQUVELGVBQVc7YUFBQSx1QkFBRztBQUNaLGVBQU87QUFDTCxjQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDO0FBQ3hCLGdCQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYztBQUM3QyxnQkFBTSxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQ3hCLENBQUM7T0FDSDs7OztBQUVELFlBQVE7YUFBQSxrQkFBQyxLQUFLLEVBQUUsYUFBYSxFQUFFO0FBQzdCLGVBQU8sRUFBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLGFBQWEsRUFBYixhQUFhLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUMsQ0FBQztPQUM1Rjs7OztBQUVELHdCQUFvQjthQUFBLGdDQUFHO0FBQ3JCLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFekMsZ0JBQVEsR0FBRzs7QUFFVCxlQUFLLEdBQUc7QUFDTixnQkFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3QyxnQkFBSSxHQUFHLEtBQUssR0FBRztBQUFFLHFCQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7YUFBQSxBQUN6QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzdDLGdCQUFJLEdBQUcsS0FBSyxHQUFHO0FBQUUscUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQzthQUFBLEFBQ3pDLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQztBQUFBLEFBQzVCLGVBQUssR0FBRztBQUNOLG1CQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxBQUMxQixlQUFLLEdBQUc7QUFBQyxBQUNULGVBQUssR0FBRztBQUFDLEFBQ1QsZUFBSyxHQUFHO0FBQ04sbUJBQU8sbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDaEQsZUFBSyxHQUFHO0FBQ04sbUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEFBQzFCLGVBQUssR0FBRztBQUFDLEFBQ1QsZUFBSyxHQUFHO0FBQUMsQUFDVCxlQUFLLEdBQUc7QUFBQyxBQUNULGVBQUssR0FBRztBQUFDLEFBQ1QsZUFBSyxHQUFHO0FBQUMsQUFDVCxlQUFLLEdBQUc7QUFDTixtQkFBTyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUNoRDs7QUFFRSxnQkFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNyRixzQkFBUSxHQUFHO0FBQ1QscUJBQUssR0FBRztBQUNOLHNCQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3JGLDJCQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7bUJBQzVCO0FBQ0QseUJBQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQztBQUFBLEFBQ3RCLHFCQUFLLEdBQUc7QUFDTixzQkFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNyRiwyQkFBTyxTQUFTLENBQUMsU0FBUyxDQUFDO21CQUM1QjtBQUNELHlCQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFBQSxBQUN0QixxQkFBSyxHQUFHO0FBQ04seUJBQU8sU0FBUyxDQUFDLGFBQWEsQ0FBQztBQUFBLEFBQ2pDLHFCQUFLLEdBQUc7QUFDTix5QkFBTyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQUEsQUFDOUIscUJBQUssR0FBRztBQUNOLHlCQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFBQSxBQUM5QixxQkFBSyxHQUFHO0FBQ04seUJBQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUFBLEFBQzlCLHFCQUFLLEdBQUc7QUFDTix5QkFBTyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQUEsQUFDdkIscUJBQUssR0FBRztBQUNOLHlCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFBQSxBQUN2QixxQkFBSyxHQUFHO0FBQ04seUJBQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUFBLEFBQzlCLHFCQUFLLEdBQUc7QUFDTix5QkFBTyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQUEsQUFDOUIscUJBQUssR0FBRztBQUNOLHlCQUFPLFNBQVMsQ0FBQyxjQUFjLENBQUM7QUFBQSxBQUNsQyxxQkFBSyxHQUFHO0FBQ04seUJBQU8sU0FBUyxDQUFDLGNBQWMsQ0FBQztBQUFBO0FBRWxDO0FBQ0Usd0JBQU07QUFBQSxlQUNUO2FBQ0Y7QUFBQSxTQUNKOztBQUVELFlBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdkMsY0FBSSxJQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3QyxjQUFJLEdBQUcsS0FBSyxJQUFHLEVBQUU7QUFDZixnQkFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUN2QyxrQkFBSSxJQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3QyxrQkFBSSxHQUFHLEtBQUssR0FBRyxJQUFJLElBQUcsS0FBSyxHQUFHLEVBQUU7O0FBRTlCLG9CQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3JGLHlCQUFPLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztpQkFDdEM7QUFDRCx1QkFBTyxTQUFTLENBQUMsWUFBWSxDQUFDO2VBQy9COztBQUVELGtCQUFJLEdBQUcsS0FBSyxHQUFHLElBQUksSUFBRyxLQUFLLEdBQUcsRUFBRTtBQUM5Qix1QkFBTyxTQUFTLENBQUMsVUFBVSxDQUFDO2VBQzdCOztBQUVELGtCQUFJLEdBQUcsS0FBSyxHQUFHLElBQUksSUFBRyxLQUFLLEdBQUcsRUFBRTtBQUM5Qix1QkFBTyxTQUFTLENBQUMsVUFBVSxDQUFDO2VBQzdCO2FBQ0Y7O0FBRUQsb0JBQVEsR0FBRztBQUNULG1CQUFLLEdBQUc7QUFDTix1QkFBTyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQUEsQUFDdkIsbUJBQUssR0FBRztBQUNOLHVCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFBQSxBQUN2QixtQkFBSyxHQUFHO0FBQ04sdUJBQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUFBLEFBQ3ZCLG1CQUFLLEdBQUc7QUFDTix1QkFBTyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQUEsQUFDdkIsbUJBQUssR0FBRztBQUNOLHVCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFBQSxBQUN2QixtQkFBSyxHQUFHO0FBQ04sdUJBQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQztBQUFBO0FBRXRCO0FBQ0Usc0JBQU07QUFBQSxhQUNUO1dBQ0YsTUFBTSxJQUFJLEdBQUcsS0FBSyxHQUFHLElBQUksSUFBRyxLQUFLLEdBQUcsRUFBRTtBQUNyQyxtQkFBTyxTQUFTLENBQUMsS0FBSyxDQUFDO1dBQ3hCO1NBQ0Y7O0FBRUQsZUFBTyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDL0M7Ozs7QUFHRCxrQkFBYzs7O2FBQUEsMEJBQUc7QUFDZixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN2QixZQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUMxQyxZQUFJLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2xDLGVBQU8sSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7T0FDMUU7Ozs7QUFFRCxrQkFBYzthQUFBLHdCQUFDLEtBQUssRUFBRSxhQUFhLEVBQUU7QUFDbkMsWUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNuQixlQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUM3QixjQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixjQUFJLEdBQUcsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDMUIsY0FBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDZCxrQkFBTTtXQUNQO0FBQ0QsV0FBQyxFQUFFLENBQUM7U0FDTDs7QUFFRCxZQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFO0FBQ3BCLGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1Qjs7QUFFRCxZQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzFFLGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1Qjs7QUFFRCxZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFZixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNoRCxlQUFPLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO09BQzNFOzs7O0FBRUQscUJBQWlCO2FBQUEsMkJBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRTtBQUN0QyxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzs7QUFFaEMsZUFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLGNBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxjQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUM1QixrQkFBTTtXQUNQO0FBQ0QsY0FBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2Q7O0FBRUQsWUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxNQUFNLEVBQUU7QUFDaEMsZ0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzVCOztBQUVELFlBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFDdEYsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBRTtBQUMxRCxnQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDNUI7O0FBRUQsZUFBTyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ2xKOzs7O0FBRUQsb0JBQWdCO2FBQUEsMEJBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRTtBQUNyQyxlQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdEMsY0FBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLGNBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLGdCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7V0FDZCxNQUFNLElBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzdDLGtCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztXQUM1QixNQUFNO0FBQ0wsa0JBQU07V0FDUDtTQUNGOztBQUVELFlBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLEtBQUssQ0FBQyxFQUFFO0FBQzVCLGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1Qjs7QUFFRCxlQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7T0FDN0k7Ozs7QUFFRCwwQkFBc0I7YUFBQSxnQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFO0FBQzNDLFlBQUksT0FBTyxHQUFHLElBQUksQ0FBQzs7QUFFbkIsZUFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLGNBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxjQUFJLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUMxQixnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1dBQ2QsTUFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUNuQyxtQkFBTyxHQUFHLEtBQUssQ0FBQztBQUNoQixnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1dBQ2QsTUFBTSxJQUFJLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM3QyxrQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7V0FDNUIsTUFBTTtBQUNMLGtCQUFNO1dBQ1A7U0FDRjs7QUFFRCxlQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUMzSjs7OztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFeEMsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7O0FBRXZCLFlBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUNkLGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGNBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNuQyxjQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLGdCQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUM1QixrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IscUJBQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDbEQsTUFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUNuQyxrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IscUJBQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQzthQUNyRCxNQUFNLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ25DLGtCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixxQkFBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQ3BELE1BQU0sSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDakMsa0JBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNmLHNCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7ZUFDdkY7QUFDRCxxQkFBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQzFEO1dBQ0YsTUFBTTtBQUNMLG1CQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztXQUNyRTtTQUNGLE1BQU0sSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFOztBQUVyQixZQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLGlCQUFPLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUM3QixnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsZ0JBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNyQyxxQkFBTyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7YUFDckU7QUFDRCxjQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3JDO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1YsWUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ2QsY0FBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsY0FBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLG1CQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztXQUNyRTs7QUFFRCxZQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLGlCQUFPLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUM3QixhQUFDLEVBQUUsQ0FBQztBQUNKLGdCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixnQkFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLHFCQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQzthQUNyRTtBQUNELGNBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDckM7U0FDRjs7O0FBR0QsWUFBSSxFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDNUIsY0FBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsY0FBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLGtCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztXQUM1Qjs7QUFFRCxZQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLGNBQUksR0FBRyxHQUFHLEtBQUssQ0FBQztBQUNoQixjQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUM1QixlQUFHLEdBQUcsRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUNqQixnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsZ0JBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNyQyxvQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7YUFDNUI7QUFDRCxjQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3JDOztBQUVELGNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNWLGNBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLG1CQUFPLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUM3QixlQUFDLElBQUksRUFBRSxDQUFDO0FBQ1IsZUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBQ1Qsa0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGtCQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDckMsc0JBQU07ZUFDUDtBQUNELGdCQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3JDO1dBQ0YsTUFBTTtBQUNMLGtCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztXQUM1QjtBQUNELFdBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ25COztBQUVELFlBQUksaUJBQWlCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3ZDLGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1Qjs7QUFFRCxlQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztPQUNyRTs7OztBQUVELG9CQUFnQjthQUFBLDBCQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDM0IsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsWUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1QjtBQUNELFlBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxZQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3ZDLGtCQUFRLEVBQUU7QUFDUixpQkFBSyxHQUFHO0FBQ04saUJBQUcsSUFBSSxJQUFJLENBQUM7QUFDWixrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isb0JBQU07QUFBQSxBQUNSLGlCQUFLLEdBQUc7QUFDTixpQkFBRyxJQUFJLElBQUksQ0FBQztBQUNaLGtCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixvQkFBTTtBQUFBLEFBQ1IsaUJBQUssR0FBRztBQUNOLGlCQUFHLElBQUksSUFBSSxDQUFDO0FBQ1osa0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLG9CQUFNO0FBQUEsQUFDUixpQkFBSyxHQUFHO0FBQUMsQUFDVCxpQkFBSyxHQUFHO0FBQ04sa0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDekIsa0JBQUksU0FBUyxZQUFBLENBQUM7QUFDZCxrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isa0JBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNwQyxzQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7ZUFDNUI7QUFDRCx1QkFBUyxHQUFHLEVBQUUsS0FBSyxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNwRSxrQkFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFO0FBQ2pCLHNCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztlQUM1QjtBQUNELGlCQUFHLElBQUksYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2hDLG9CQUFNO0FBQUEsQUFDUixpQkFBSyxHQUFHO0FBQ04saUJBQUcsSUFBSSxJQUFJLENBQUM7QUFDWixrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isb0JBQU07QUFBQSxBQUNSLGlCQUFLLEdBQUc7QUFDTixpQkFBRyxJQUFJLElBQUksQ0FBQztBQUNaLGtCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixvQkFBTTtBQUFBLEFBQ1IsaUJBQUssR0FBRztBQUNOLGlCQUFHLElBQUksUUFBUSxDQUFDO0FBQ2hCLGtCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixvQkFBTTtBQUFBLEFBQ1I7QUFDRSxrQkFBSSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDMUIsb0JBQUksTUFBTSxHQUFHLENBQUMsQ0FBQzs7O0FBR2Ysb0JBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLHdCQUFNLEdBQUcsQ0FBQyxDQUFDO2lCQUNaO0FBQ0Qsb0JBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNiLHVCQUFPLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzNDLHNCQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUM1Qix5QkFBSyxHQUFHLElBQUksQ0FBQzttQkFDZDtBQUNELHNCQUFJLElBQUksQ0FBQyxDQUFDO0FBQ1Ysd0JBQU0sRUFBRSxDQUFDO0FBQ1Qsc0JBQUksSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLHNCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixzQkFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLDBCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzttQkFDNUI7QUFDRCxvQkFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDckM7QUFDRCxtQkFBRyxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7ZUFDbEMsTUFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUNuQyxzQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7ZUFDNUIsTUFBTTtBQUNMLG1CQUFHLElBQUksRUFBRSxDQUFDO0FBQ1Ysb0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztlQUNkO0FBQUEsV0FDSjtTQUNGLE1BQU07QUFDTCxjQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixjQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtBQUMxRCxnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1dBQ2Q7QUFDRCxjQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDNUIsY0FBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2I7QUFDRCxlQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ3JCOzs7O0FBRUQscUJBQWlCOzthQUFBLDZCQUFHO0FBQ2xCLFlBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQzs7QUFFYixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7OztBQUczQyxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN2QixZQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRWIsWUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ2xCLGVBQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUN0QyxjQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEMsY0FBSSxFQUFFLEtBQUssS0FBSyxFQUFFO0FBQ2hCLGdCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixtQkFBTyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztXQUNoRixNQUFNLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTt1QkFDUCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQzs7OztBQUEvQyxlQUFHO0FBQUUsaUJBQUs7V0FDWixNQUFNLElBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzdDLGtCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztXQUM1QixNQUFNO0FBQ0wsZUFBRyxJQUFJLEVBQUUsQ0FBQztBQUNWLGdCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7V0FDZDtTQUNGOztBQUVELGNBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO09BQzVCOzs7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDdkIsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsZUFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLGNBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1QyxrQkFBUSxFQUFFO0FBQ1IsaUJBQUssRUFBSTs7QUFDUCxrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IscUJBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN0RSxpQkFBSyxFQUFJOztBQUNQLGtCQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBSSxFQUFFOztBQUNuRCxvQkFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7QUFDaEIsdUJBQU8sSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7ZUFDdEU7QUFDRCxrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isb0JBQU07QUFBQSxBQUNSLGlCQUFLLEVBQUk7O0FBQ1Q7QUFDRSxvQkFBSSxTQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xDLG9CQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hELG9CQUFJLEtBQUssRUFBRTtBQUNULHdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFRLEVBQUUsYUFBYSxDQUFDLHdCQUF3QixDQUFDLENBQUM7aUJBQ3RGO0FBQ0Qsc0JBQU07ZUFDUDtBQUFBLEFBQ0Q7QUFDRSxrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQUEsV0FDaEI7U0FDRjs7QUFFRCxjQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztPQUM1Qjs7OztBQUVELGNBQVU7YUFBQSxvQkFBQyxHQUFHLEVBQUU7QUFDZCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzs7QUFFdkIsWUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3ZCLFlBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztBQUN4QixlQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdEMsY0FBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLGNBQUksRUFBRSxLQUFLLElBQUksRUFBRTtBQUNmLGVBQUcsSUFBSSxFQUFFLENBQUM7QUFDVixnQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsY0FBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFcEMsZ0JBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3RDLG9CQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDNUQ7QUFDRCxlQUFHLElBQUksRUFBRSxDQUFDO0FBQ1YsZ0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztXQUNkLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDN0Msa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztXQUM1RCxNQUFNO0FBQ0wsZ0JBQUksV0FBVyxFQUFFO0FBQ2Ysa0JBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUNkLDJCQUFXLEdBQUcsS0FBSyxDQUFDO2VBQ3JCO2FBQ0YsTUFBTTtBQUNMLGtCQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDZCwwQkFBVSxHQUFHLElBQUksQ0FBQztBQUNsQixtQkFBRyxJQUFJLEVBQUUsQ0FBQztBQUNWLG9CQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixzQkFBTTtlQUNQLE1BQU0sSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQ3JCLDJCQUFXLEdBQUcsSUFBSSxDQUFDO2VBQ3BCO2FBQ0Y7QUFDRCxlQUFHLElBQUksRUFBRSxDQUFDO0FBQ1YsZ0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztXQUNkO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNmLGdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDNUQ7O0FBRUQsZUFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLGNBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxjQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDdEQsa0JBQU07V0FDUDtBQUNELGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGFBQUcsSUFBSSxFQUFFLENBQUM7U0FDWDtBQUNELGVBQU8sSUFBSSw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztPQUNwRjs7OztBQUVELFdBQU87YUFBQSxtQkFBRztBQUNSLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFdkMsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzVCLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUMxQixZQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7O0FBRXBDLFlBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFbkIsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzdCLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7O0FBRXJDLFlBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNwQyxpQkFBTyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztTQUMvRDs7QUFFRCxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRWxELFlBQUksUUFBUSxHQUFHLEdBQUksRUFBRTtBQUNuQixjQUFJLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQzlCLG1CQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztXQUM5Qjs7QUFFRCxjQUFJLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsS0FBSyxFQUFJLG9CQUFBLEVBQXNCO0FBQ3hFLG1CQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztXQUM5Qjs7OztBQUlELGNBQUksUUFBUSxLQUFLLEVBQUksRUFBRTtBQUNyQixnQkFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ2pHLHFCQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2FBQ2xDO0FBQ0QsbUJBQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1dBQzlCOzs7QUFHRCxjQUFJLFFBQVEsS0FBSyxFQUFJLElBQUksUUFBUSxLQUFLLEVBQUksRUFBRTtBQUMxQyxtQkFBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztXQUNqQzs7O0FBR0QsY0FBSSxRQUFRLEtBQUssRUFBSSxFQUFFO0FBQ3JCLG1CQUFPLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1dBQ25DOztBQUVELGNBQUksRUFBSSxjQUFjLFFBQVEsSUFBSSxRQUFRLElBQUksRUFBSSxVQUFBLEVBQVk7QUFDNUQsbUJBQU8sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7V0FDbEM7OztBQUdELGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1QixNQUFNO0FBQ0wsY0FBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFNLElBQUksUUFBUSxJQUFJLFFBQVEsSUFBSSxLQUFNLEVBQUU7QUFDM0UsbUJBQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1dBQzlCOztBQUVELGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1QjtPQUNGOzs7O0FBRUQsT0FBRzthQUFBLGVBQUc7QUFDSixlQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7T0FDOUM7Ozs7QUFFRCxPQUFHO2FBQUEsZUFBRztBQUNKLFlBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDL0IsWUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDaEMsWUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2xCLGVBQU8sU0FBUyxDQUFDO09BQ2xCOzs7Ozs7U0Exd0NrQixTQUFTOzs7cUJBQVQsU0FBUyIsImZpbGUiOiJzcmMvdG9rZW5pemVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuaW1wb3J0IHtnZXRIZXhWYWx1ZSwgaXNMaW5lVGVybWluYXRvciwgaXNXaGl0ZVNwYWNlLCBpc0lkZW50aWZpZXJTdGFydCwgaXNJZGVudGlmaWVyUGFydCwgaXNEZWNpbWFsRGlnaXR9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQge0Vycm9yTWVzc2FnZXN9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0ICogYXMgU2hpZnQgZnJvbSBcInNoaWZ0LWFzdFwiO1xuXG5leHBvcnQgY29uc3QgVG9rZW5DbGFzcyA9IHtcbiAgRW9mOiB7bmFtZTogXCI8RW5kPlwifSxcbiAgSWRlbnQ6IHtuYW1lOiBcIklkZW50aWZpZXJcIiwgaXNJZGVudGlmaWVyTmFtZTogdHJ1ZX0sXG4gIEtleXdvcmQ6IHtuYW1lOiBcIktleXdvcmRcIiwgaXNJZGVudGlmaWVyTmFtZTogdHJ1ZX0sXG4gIE51bWVyaWNMaXRlcmFsOiB7bmFtZTogXCJOdW1lcmljXCJ9LFxuICBUZW1wbGF0ZUVsZW1lbnQ6IHtuYW1lOiBcIlRlbXBsYXRlXCJ9LFxuICBQdW5jdHVhdG9yOiB7bmFtZTogXCJQdW5jdHVhdG9yXCJ9LFxuICBTdHJpbmdMaXRlcmFsOiB7bmFtZTogXCJTdHJpbmdcIn0sXG4gIFJlZ3VsYXJFeHByZXNzaW9uOiB7bmFtZTogXCJSZWd1bGFyRXhwcmVzc2lvblwifSxcbiAgTGluZUNvbW1lbnQ6IHtuYW1lOiBcIkxpbmVcIn0sXG4gIEJsb2NrQ29tbWVudDoge25hbWU6IFwiQmxvY2tcIn0sXG4gIElsbGVnYWw6IHtuYW1lOiBcIklsbGVnYWxcIn1cbn07XG5cbmV4cG9ydCBjb25zdCBUb2tlblR5cGUgPSB7XG4gIEVPUzoge2tsYXNzOiBUb2tlbkNsYXNzLkVvZiwgbmFtZTogXCJFT1NcIn0sXG4gIExQQVJFTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKFwifSxcbiAgUlBBUkVOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIpXCJ9LFxuICBMQlJBQ0s6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIltcIn0sXG4gIFJCUkFDSzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXVwifSxcbiAgTEJSQUNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ7XCJ9LFxuICBSQlJBQ0U6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn1cIn0sXG4gIENPTE9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI6XCJ9LFxuICBTRU1JQ09MT046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjtcIn0sXG4gIFBFUklPRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLlwifSxcbiAgRUxMSVBTSVM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi4uLlwifSxcbiAgQVJST1c6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj0+XCJ9LFxuICBDT05ESVRJT05BTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiP1wifSxcbiAgSU5DOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrK1wifSxcbiAgREVDOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItLVwifSxcbiAgQVNTSUdOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9XCJ9LFxuICBBU1NJR05fQklUX09SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8PVwifSxcbiAgQVNTSUdOX0JJVF9YT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl49XCJ9LFxuICBBU1NJR05fQklUX0FORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJj1cIn0sXG4gIEFTU0lHTl9TSEw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw8PVwifSxcbiAgQVNTSUdOX1NIUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj49XCJ9LFxuICBBU1NJR05fU0hSX1VOU0lHTkVEOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj49XCJ9LFxuICBBU1NJR05fQUREOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrPVwifSxcbiAgQVNTSUdOX1NVQjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLT1cIn0sXG4gIEFTU0lHTl9NVUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIio9XCJ9LFxuICBBU1NJR05fRElWOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIvPVwifSxcbiAgQVNTSUdOX01PRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJT1cIn0sXG4gIENPTU1BOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIsXCJ9LFxuICBPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifHxcIn0sXG4gIEFORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJiZcIn0sXG4gIEJJVF9PUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifFwifSxcbiAgQklUX1hPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXlwifSxcbiAgQklUX0FORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJlwifSxcbiAgU0hMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PFwifSxcbiAgU0hSOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+PlwifSxcbiAgU0hSX1VOU0lHTkVEOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj5cIn0sXG4gIEFERDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiK1wifSxcbiAgU1VCOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItXCJ9LFxuICBNVUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIipcIn0sXG4gIERJVjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiL1wifSxcbiAgTU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIlXCJ9LFxuICBFUToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPT1cIn0sXG4gIE5FOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIhPVwifSxcbiAgRVFfU1RSSUNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9PT1cIn0sXG4gIE5FX1NUUklDVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIT09XCJ9LFxuICBMVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPFwifSxcbiAgR1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj5cIn0sXG4gIExURToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPD1cIn0sXG4gIEdURToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj1cIn0sXG4gIElOU1RBTkNFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImluc3RhbmNlb2ZcIn0sXG4gIElOOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpblwifSxcbiAgT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm9mXCJ9LFxuICBOT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiFcIn0sXG4gIEJJVF9OT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn5cIn0sXG4gIERFTEVURToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVsZXRlXCJ9LFxuICBUWVBFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInR5cGVvZlwifSxcbiAgVk9JRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidm9pZFwifSxcbiAgQlJFQUs6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImJyZWFrXCJ9LFxuICBDQVNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXNlXCJ9LFxuICBDQVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2F0Y2hcIn0sXG4gIENMQVNTOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjbGFzc1wifSxcbiAgQ09OVElOVUU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNvbnRpbnVlXCJ9LFxuICBERUJVR0dFUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVidWdnZXJcIn0sXG4gIERFRkFVTFQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlZmF1bHRcIn0sXG4gIERPOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkb1wifSxcbiAgRUxTRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZWxzZVwifSxcbiAgRVhQT1JUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJleHBvcnRcIn0sXG4gIEVYVEVORFM6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImV4dGVuZHNcIn0sXG4gIEZJTkFMTFk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZpbmFsbHlcIn0sXG4gIEZPUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZm9yXCJ9LFxuICBGVU5DVElPTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZnVuY3Rpb25cIn0sXG4gIElGOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpZlwifSxcbiAgSU1QT1JUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpbXBvcnRcIn0sXG4gIExFVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwibGV0XCJ9LFxuICBORVc6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm5ld1wifSxcbiAgUkVUVVJOOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJyZXR1cm5cIn0sXG4gIFNVUEVSOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJzdXBlclwifSxcbiAgU1dJVENIOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJzd2l0Y2hcIn0sXG4gIFRISVM6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRoaXNcIn0sXG4gIFRIUk9XOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0aHJvd1wifSxcbiAgVFJZOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0cnlcIn0sXG4gIFZBUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidmFyXCJ9LFxuICBXSElMRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwid2hpbGVcIn0sXG4gIFdJVEg6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIndpdGhcIn0sXG4gIE5VTEw6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm51bGxcIn0sXG4gIFRSVUU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRydWVcIn0sXG4gIEZBTFNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJmYWxzZVwifSxcbiAgWUlFTEQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInlpZWxkXCJ9LFxuICBOVU1CRVI6IHtrbGFzczogVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFNUUklORzoge2tsYXNzOiBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWwsIG5hbWU6IFwiXCJ9LFxuICBSRUdFWFA6IHtrbGFzczogVG9rZW5DbGFzcy5SZWd1bGFyRXhwcmVzc2lvbiwgbmFtZTogXCJcIn0sXG4gIElERU5USUZJRVI6IHtrbGFzczogVG9rZW5DbGFzcy5JZGVudCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9SRVNFUlZFRF9XT1JEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiXCJ9LFxuICBDT05TVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY29uc3RcIn0sXG4gIFRFTVBMQVRFOiB7a2xhc3M6IFRva2VuQ2xhc3MuVGVtcGxhdGVFbGVtZW50LCBuYW1lOiBcIlwifSxcbiAgSUxMRUdBTDoge2tsYXNzOiBUb2tlbkNsYXNzLklsbGVnYWwsIG5hbWU6IFwiXCJ9XG59O1xuXG5jb25zdCBUVCA9IFRva2VuVHlwZTtcbmNvbnN0IEkgPSBUVC5JTExFR0FMO1xuY29uc3QgRiA9IGZhbHNlO1xuY29uc3QgVCA9IHRydWU7XG5cbmNvbnN0IE9ORV9DSEFSX1BVTkNUVUFUT1IgPSBbXG4gIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIFRULk5PVCwgSSwgSSwgSSxcbiAgVFQuTU9ELCBUVC5CSVRfQU5ELCBJLCBUVC5MUEFSRU4sIFRULlJQQVJFTiwgVFQuTVVMLCBUVC5BREQsIFRULkNPTU1BLCBUVC5TVUIsIFRULlBFUklPRCwgVFQuRElWLCBJLCBJLCBJLCBJLCBJLCBJLCBJLFxuICBJLCBJLCBJLCBUVC5DT0xPTiwgVFQuU0VNSUNPTE9OLCBUVC5MVCwgVFQuQVNTSUdOLCBUVC5HVCwgVFQuQ09ORElUSU9OQUwsIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIFRULkxCUkFDSywgSSwgVFQuUkJSQUNLLCBUVC5CSVRfWE9SLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLFxuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5MQlJBQ0UsIFRULkJJVF9PUiwgVFQuUkJSQUNFLCBUVC5CSVRfTk9UXTtcblxuY29uc3QgUFVOQ1RVQVRPUl9TVEFSVCA9IFtcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgRiwgRiwgRiwgVCwgVCxcbiAgRiwgVCwgVCwgVCwgVCwgVCwgVCwgRiwgVCwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgVCwgVCwgVCwgVCwgVCwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRixcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgRiwgVCwgVCwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRixcbiAgRiwgRiwgRiwgRiwgRiwgRiwgVCwgVCwgVCwgVCwgRl07XG5cbmV4cG9ydCBjbGFzcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlLCBvY3RhbCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5zbGljZSA9IHNsaWNlO1xuICAgIHRoaXMub2N0YWwgPSBvY3RhbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpZmllckxpa2VUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnNsaWNlLnRleHQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIElkZW50aWZpZXJUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5JREVOVElGSUVSLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEtleXdvcmRUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCBzbGljZSkge1xuICAgIHN1cGVyKHR5cGUsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUHVuY3R1YXRvclRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCBzbGljZSkge1xuICAgIHN1cGVyKHR5cGUsIHNsaWNlLCBmYWxzZSk7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMudHlwZS5uYW1lO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWxUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UsIHZhbHVlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLlJFR0VYUCwgc2xpY2UsIGZhbHNlKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVtZXJpY0xpdGVyYWxUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UsIHZhbHVlID0gK3NsaWNlLnRleHQsIGxlZ2FjeU9jdGFsID0gZmFsc2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuTlVNQkVSLCBzbGljZSwgbGVnYWN5T2N0YWwpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0cmluZ0xpdGVyYWxUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UsIHZhbHVlLCBvY3RhbCkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5TVFJJTkcsIHNsaWNlLCBvY3RhbCk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodGFpbCwgc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuVEVNUExBVEUsIHNsaWNlKTtcbiAgICB0aGlzLnRhaWwgPSB0YWlsO1xuICAgIHRoaXMudmFsdWUgPSBzbGljZS50ZXh0O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFT0ZUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuRU9TLCBzbGljZSwgZmFsc2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBKc0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihpbmRleCwgbGluZSwgY29sdW1uLCBtc2cpIHtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5saW5lID0gbGluZTtcbiAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICB0aGlzLmRlc2NyaXB0aW9uID0gbXNnO1xuICAgIHRoaXMubWVzc2FnZSA9IGBbJHtsaW5lfToke2NvbHVtbn1dOiAke21zZ31gO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZyb21Db2RlUG9pbnQoY3ApIHtcbiAgaWYgKGNwIDw9IDB4RkZGRikgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY3ApO1xuICBsZXQgY3UxID0gU3RyaW5nLmZyb21DaGFyQ29kZShNYXRoLmZsb29yKChjcCAtIDB4MTAwMDApIC8gMHg0MDApICsgMHhEODAwKTtcbiAgbGV0IGN1MiA9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjcCAtIDB4MTAwMDApICUgMHg0MDApICsgMHhEQzAwKTtcbiAgcmV0dXJuIGN1MSArIGN1Mjtcbn1cblxuZnVuY3Rpb24gZGVjb2RlVXRmMTYobGVhZCwgdHJhaWwpIHtcbiAgcmV0dXJuIChsZWFkIC0gMHhEODAwKSAqIDB4NDAwICsgKHRyYWlsIC0gMHhEQzAwKSArIDB4MTAwMDA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRva2VuaXplciB7XG4gIGNvbnN0cnVjdG9yKHNvdXJjZSkge1xuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIHRoaXMubGluZSA9IDA7XG4gICAgdGhpcy5saW5lU3RhcnQgPSAwO1xuICAgIHRoaXMuc3RhcnRJbmRleCA9IDA7XG4gICAgdGhpcy5zdGFydExpbmUgPSAwO1xuICAgIHRoaXMuc3RhcnRMaW5lU3RhcnQgPSAwO1xuICAgIHRoaXMubGFzdEluZGV4ID0gMDtcbiAgICB0aGlzLmxhc3RMaW5lID0gMDtcbiAgICB0aGlzLmxhc3RMaW5lU3RhcnQgPSAwO1xuICAgIHRoaXMuc3RyaWN0ID0gZmFsc2U7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLnRva2VuSW5kZXggPSAwO1xuICB9XG5cbiAgc2F2ZUxleGVyU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNvdXJjZTogdGhpcy5zb3VyY2UsXG4gICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgIGxpbmU6IHRoaXMubGluZSxcbiAgICAgIGxpbmVTdGFydDogdGhpcy5saW5lU3RhcnQsXG4gICAgICBzdGFydEluZGV4OiB0aGlzLnN0YXJ0SW5kZXgsXG4gICAgICBzdGFydExpbmU6IHRoaXMuc3RhcnRMaW5lLFxuICAgICAgc3RhcnRMaW5lU3RhcnQ6IHRoaXMuc3RhcnRMaW5lU3RhcnQsXG4gICAgICBsYXN0SW5kZXg6IHRoaXMubGFzdEluZGV4LFxuICAgICAgbGFzdExpbmU6IHRoaXMubGFzdExpbmUsXG4gICAgICBsYXN0TGluZVN0YXJ0OiB0aGlzLmxhc3RMaW5lU3RhcnQsXG4gICAgICBsb29rYWhlYWQ6IHRoaXMubG9va2FoZWFkLFxuICAgICAgc3RyaWN0OiB0aGlzLnN0cmljdCxcbiAgICAgIGhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dDogdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQsXG4gICAgICB0b2tlbkluZGV4OiB0aGlzLnRva2VuSW5kZXhcbiAgICB9O1xuICB9XG5cbiAgcmVzdG9yZUxleGVyU3RhdGUoc3RhdGUpIHtcbiAgICB0aGlzLnNvdXJjZSA9IHN0YXRlLnNvdXJjZTtcbiAgICB0aGlzLmluZGV4ID0gc3RhdGUuaW5kZXg7XG4gICAgdGhpcy5saW5lID0gc3RhdGUubGluZTtcbiAgICB0aGlzLmxpbmVTdGFydCA9IHN0YXRlLmxpbmVTdGFydDtcbiAgICB0aGlzLnN0YXJ0SW5kZXggPSBzdGF0ZS5zdGFydEluZGV4O1xuICAgIHRoaXMuc3RhcnRMaW5lID0gc3RhdGUuc3RhcnRMaW5lO1xuICAgIHRoaXMuc3RhcnRMaW5lU3RhcnQgPSBzdGF0ZS5zdGFydExpbmVTdGFydDtcbiAgICB0aGlzLmxhc3RJbmRleCA9IHN0YXRlLmxhc3RJbmRleDtcbiAgICB0aGlzLmxhc3RMaW5lID0gc3RhdGUubGFzdExpbmU7XG4gICAgdGhpcy5sYXN0TGluZVN0YXJ0ID0gc3RhdGUubGFzdExpbmVTdGFydDtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHN0YXRlLmxvb2thaGVhZDtcbiAgICB0aGlzLnN0cmljdCA9IHN0YXRlLnN0cmljdDtcbiAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHN0YXRlLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dDtcbiAgICB0aGlzLnRva2VuSW5kZXggPSBzdGF0ZS50b2tlbkluZGV4O1xuICB9XG5cbiAgY3JlYXRlSUxMRUdBTCgpIHtcbiAgICB0aGlzLnN0YXJ0SW5kZXggPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuc3RhcnRMaW5lID0gdGhpcy5saW5lO1xuICAgIHRoaXMuc3RhcnRMaW5lU3RhcnQgPSB0aGlzLmxpbmVTdGFydDtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfSUxMRUdBTF9UT0tFTik7XG4gIH1cblxuICBjcmVhdGVVbmV4cGVjdGVkKHRva2VuKSB7XG4gICAgc3dpdGNoICh0b2tlbi50eXBlLmtsYXNzKSB7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuRW9mOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfRU9TKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX05VTUJFUik7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuU3RyaW5nTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NUUklORyk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuSWRlbnQ6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9JREVOVElGSUVSKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5LZXl3b3JkOlxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi5zbGljZS50ZXh0KTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5QdW5jdHVhdG9yOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnR5cGUubmFtZSk7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlRXJyb3IobWVzc2FnZSwgYXJnKSB7XG4gICAgbGV0IG1zZyA9IG1lc3NhZ2UucmVwbGFjZSgveyhcXGQrKX0vZywgKCkgPT4gYXJnKTtcbiAgICByZXR1cm4gbmV3IEpzRXJyb3IodGhpcy5zdGFydEluZGV4LCB0aGlzLnN0YXJ0TGluZSArIDEsIHRoaXMuc3RhcnRJbmRleCAtIHRoaXMuc3RhcnRMaW5lU3RhcnQgKyAxLCBtc2cpO1xuICB9XG5cbiAgY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obG9jYXRpb24sIG1lc3NhZ2UsIGFyZykge1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csICgpID0+IGFyZyk7XG4gICAgaWYgKGxvY2F0aW9uIGluc3RhbmNlb2YgVG9rZW4pIHtcbiAgICAgIGxvY2F0aW9uID0gbG9jYXRpb24uc2xpY2Uuc3RhcnRMb2NhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKGxvY2F0aW9uLm9mZnNldCwgbG9jYXRpb24ubGluZSwgbG9jYXRpb24uY29sdW1uICsgMSwgbXNnKTtcbiAgfVxuXG4gIHN0YXRpYyBjc2UyKGlkLCBjaDEsIGNoMikge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMjtcbiAgfVxuXG4gIHN0YXRpYyBjc2UzKGlkLCBjaDEsIGNoMiwgY2gzKSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzO1xuICB9XG5cbiAgc3RhdGljIGNzZTQoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCkge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNDtcbiAgfVxuXG4gIHN0YXRpYyBjc2U1KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSkge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSkgPT09IGNoNTtcbiAgfVxuXG4gIHN0YXRpYyBjc2U2KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSwgY2g2KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0ICYmIGlkLmNoYXJBdCg1KSA9PT0gY2g1ICYmIGlkLmNoYXJBdCg2KSA9PT0gY2g2O1xuICB9XG5cbiAgc3RhdGljIGNzZTcoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCwgY2g1LCBjaDYsIGNoNykge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSkgPT09IGNoNSAmJiBpZC5jaGFyQXQoNikgPT09IGNoNiAmJiBpZC5jaGFyQXQoNykgPT09IGNoNztcbiAgfVxuXG4gIHN0YXRpYyBnZXRLZXl3b3JkKGlkLCBzdHJpY3QpIHtcbiAgICAvLyBcImNvbnN0XCIgaXMgc3BlY2lhbGl6ZWQgYXMgS2V5d29yZCBpbiBWOC5cbiAgICAvLyBcInlpZWxkXCIgYW5kIFwibGV0XCIgYXJlIGZvciBjb21wYXRpYmlsaXR5IHdpdGggU3BpZGVyTW9ua2V5IGFuZCBFUy5uZXh0LlxuICAgIC8vIFNvbWUgb3RoZXJzIGFyZSBmcm9tIGZ1dHVyZSByZXNlcnZlZCB3b3Jkcy5cblxuICAgIGlmIChpZC5sZW5ndGggPT09IDEgfHwgaWQubGVuZ3RoID4gMTApIHtcbiAgICAgIHJldHVybiBUb2tlblR5cGUuSUxMRUdBTDtcbiAgICB9XG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHN3aXRjaCAoaWQubGVuZ3RoKSB7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImlcIjpcbiAgICAgICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDEpKSB7XG4gICAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JRjtcbiAgICAgICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChpZC5jaGFyQXQoMSkgPT09IFwib1wiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRE87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwib1wiOlxuICAgICAgICAgICAgaWYgKGlkLmNoYXJBdCgxKSA9PT0gXCJmXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5PRjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImFcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVkFSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJvXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZPUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiZVwiLCBcIndcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORVc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcInJcIiwgXCJ5XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVFJZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImxcIjpcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgVG9rZW5pemVyLmNzZTIoaWQsIFwiZVwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MRVQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJoXCIsIFwiaVwiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5USElTO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJyXCIsIFwidVwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UUlVFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJ1XCIsIFwibFwiLCBcImxcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5OVUxMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJsXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FTFNFO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJuXCIsIFwidVwiLCBcIm1cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiYVwiLCBcInNcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0FTRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwib1wiLCBcImlcIiwgXCJkXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVk9JRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ3XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiaVwiLCBcInRcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuV0lUSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwid1wiOiAvLyBXSElMRVxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImhcIiwgXCJpXCIsIFwibFwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5XSElMRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJiXCI6IC8vIEJSRUFLXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiclwiLCBcImVcIiwgXCJhXCIsIFwia1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkJSRUFLO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjogLy8gRkFMU0VcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJhXCIsIFwibFwiLCBcInNcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRkFMU0U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOiAvLyBDQVRDSFxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImFcIiwgXCJ0XCIsIFwiY1wiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DQVRDSDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwib1wiLCBcIm5cIiwgXCJzXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNPTlNUO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJsXCIsIFwiYVwiLCBcInNcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0xBU1M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOiAvLyBUSFJPV1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImhcIiwgXCJyXCIsIFwib1wiLCBcIndcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5USFJPVztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ5XCI6IC8vIFlJRUxEXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiaVwiLCBcImVcIiwgXCJsXCIsIFwiZFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLllJRUxEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInNcIjogLy8gU1VQRVJcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJ1XCIsIFwicFwiLCBcImVcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU1VQRVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDY6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJlXCIsIFwidFwiLCBcInVcIiwgXCJyXCIsIFwiblwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlJFVFVSTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwieVwiLCBcInBcIiwgXCJlXCIsIFwib1wiLCBcImZcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UWVBFT0Y7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcImVcIiwgXCJsXCIsIFwiZVwiLCBcInRcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVMRVRFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJ3XCIsIFwiaVwiLCBcInRcIiwgXCJjXCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNXSVRDSDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwidFwiLCBcImFcIiwgXCJ0XCIsIFwiaVwiLCBcImNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQgOiBUb2tlblR5cGUuSURFTlRJRklFUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwieFwiLCBcInBcIiwgXCJvXCIsIFwiclwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FWFBPUlQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIm1cIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU1QT1JUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBcIjpcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgVG9rZW5pemVyLmNzZTUoaWQsIFwidVwiLCBcImJcIiwgXCJsXCIsIFwiaVwiLCBcImNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImRcIjogLy8gZGVmYXVsdFxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcImVcIiwgXCJmXCIsIFwiYVwiLCBcInVcIiwgXCJsXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFRkFVTFQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZlwiOiAvLyBmaW5hbGx5XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwiaVwiLCBcIm5cIiwgXCJhXCIsIFwibFwiLCBcImxcIiwgXCJ5XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRklOQUxMWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6IC8vIGV4dGVuZHNcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJ4XCIsIFwidFwiLCBcImVcIiwgXCJuXCIsIFwiZFwiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FWFRFTkRTO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBcIjpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgICAgICAgaWYgKHMgPT09IFwicHJpdmF0ZVwiIHx8IHMgPT09IFwicGFja2FnZVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgODpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcInVcIiwgXCJuXCIsIFwiY1wiLCBcInRcIiwgXCJpXCIsIFwib1wiLCBcIm5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVU5DVElPTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwib1wiLCBcIm5cIiwgXCJ0XCIsIFwiaVwiLCBcIm5cIiwgXCJ1XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNPTlRJTlVFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJlXCIsIFwiYlwiLCBcInVcIiwgXCJnXCIsIFwiZ1wiLCBcImVcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVCVUdHRVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIGlmIChzdHJpY3QgJiYgKGlkLmNoYXJBdCgwKSA9PT0gXCJwXCIgfHwgaWQuY2hhckF0KDApID09PSBcImlcIikpIHtcbiAgICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICAgIGlmIChzID09PSBcInByb3RlY3RlZFwiIHx8IHMgPT09IFwiaW50ZXJmYWNlXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTA6XG4gICAgICB7XG4gICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgIGlmIChzID09PSBcImluc3RhbmNlb2ZcIikge1xuICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU5TVEFOQ0VPRjtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgcyA9PT0gXCJpbXBsZW1lbnRzXCIpIHtcbiAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gIH1cblxuICBza2lwU2luZ2xlTGluZUNvbW1lbnQob2Zmc2V0KSB7XG4gICAgdGhpcy5pbmRleCArPSBvZmZzZXQ7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAqL1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gMHhEIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KSA9PT0gMHhBIC8qXCJcXG5cIiAqLykge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2tpcE11bHRpTGluZUNvbW1lbnQoKSB7XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgICBsZXQgaXNMaW5lU3RhcnQgPSBmYWxzZTtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2hDb2RlIDwgMHg4MCkge1xuICAgICAgICBzd2l0Y2ggKGNoQ29kZSkge1xuICAgICAgICAgIGNhc2UgNDI6ICAvLyBcIipcIlxuICAgICAgICAgICAgLy8gQmxvY2sgY29tbWVudCBlbmRzIHdpdGggXCIqL1wiLlxuICAgICAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXggPSB0aGlzLmluZGV4ICsgMjtcbiAgICAgICAgICAgICAgcmV0dXJuIGlzTGluZVN0YXJ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMDogIC8vIFwiXFxuXCJcbiAgICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMzogLy8gXCJcXHJcIjpcbiAgICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDB4MjAyOCB8fCBjaENvZGUgPT09IDB4MjAyOSkge1xuICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgfVxuXG5cbiAgc2tpcENvbW1lbnQoKSB7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcblxuICAgIGxldCBpc0xpbmVTdGFydCA9IHRoaXMuaW5kZXggPT09IDA7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGlzV2hpdGVTcGFjZShjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAoY2hDb2RlID09PSAxMyAvKiBcIlxcclwiICovICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNDcgLyogXCIvXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgICBpZiAoY2hDb2RlID09PSA0NyAvKiBcIi9cIiAqLykge1xuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDIpO1xuICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDQyIC8qIFwiKlwiICovKSB7XG4gICAgICAgICAgaXNMaW5lU3RhcnQgPSB0aGlzLnNraXBNdWx0aUxpbmVDb21tZW50KCkgfHwgaXNMaW5lU3RhcnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMubW9kdWxlICYmIGlzTGluZVN0YXJ0ICYmIGNoQ29kZSA9PT0gNDUgLyogXCItXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFUrMDAzRSBpcyBcIj5cIlxuICAgICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCItXCIgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAvLyBcIi0tPlwiIGlzIGEgc2luZ2xlLWxpbmUgY29tbWVudFxuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCF0aGlzLm1vZHVsZSAmJiBjaENvZGUgPT09IDYwIC8qIFwiPFwiICovKSB7XG4gICAgICAgIGlmICh0aGlzLnNvdXJjZS5zbGljZSh0aGlzLmluZGV4ICsgMSwgdGhpcy5pbmRleCArIDQpID09PSBcIiEtLVwiKSB7XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoNCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNjYW5IZXhFc2NhcGUyKCkge1xuICAgIGlmICh0aGlzLmluZGV4ICsgMiA+IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjEgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpO1xuICAgIGlmIChyMSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIyID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSk7XG4gICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICB0aGlzLmluZGV4ICs9IDI7XG4gICAgcmV0dXJuIHIxIDw8IDQgfCByMjtcbiAgfVxuXG4gIHNjYW5Vbmljb2RlKCkge1xuICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwie1wiKSB7XG4gICAgICAvL1xcdXtIZXhEaWdpdHN9XG4gICAgICBsZXQgaSA9IHRoaXMuaW5kZXggKyAxO1xuICAgICAgbGV0IGhleERpZ2l0cyA9IDAsIGNoO1xuICAgICAgd2hpbGUgKGkgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICAgIGxldCBoZXggPSBnZXRIZXhWYWx1ZShjaCk7XG4gICAgICAgIGlmIChoZXggPT09IC0xKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaGV4RGlnaXRzID0gKGhleERpZ2l0cyA8PCA0KSB8IGhleDtcbiAgICAgICAgaWYgKGhleERpZ2l0cyA+IDB4MTBGRkZGKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgICAgaWYgKGNoICE9PSBcIn1cIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggPSBpICsgMTtcbiAgICAgIHJldHVybiBoZXhEaWdpdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vXFx1SGV4NERpZ2l0c1xuICAgICAgaWYgKHRoaXMuaW5kZXggKyA0ID4gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGxldCByMSA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSk7XG4gICAgICBpZiAocjEgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGxldCByMiA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpO1xuICAgICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBsZXQgcjMgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpKTtcbiAgICAgIGlmIChyMyA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgbGV0IHI0ID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSk7XG4gICAgICBpZiAocjQgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggKz0gNDtcbiAgICAgIHJldHVybiByMSA8PCAxMiB8IHIyIDw8IDggfCByMyA8PCA0IHwgcjQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0RXNjYXBlZElkZW50aWZpZXIoKSB7XG4gICAgbGV0IGlkID0gXCJcIjtcbiAgICBsZXQgY2hlY2sgPSBpc0lkZW50aWZpZXJTdGFydDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBsZXQgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgICAgKyt0aGlzLmluZGV4O1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpICE9PSBcInVcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgICsrdGhpcy5pbmRleDtcbiAgICAgICAgY29kZSA9IHRoaXMuc2NhblVuaWNvZGUoKTtcbiAgICAgICAgaWYgKGNvZGUgPCAwKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKDB4RDgwMCA8PSBjb2RlICYmIGNvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK3RoaXMuaW5kZXg7XG4gICAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJ1XCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK3RoaXMuaW5kZXg7XG4gICAgICAgICAgbGV0IGxvd1N1cnJvZ2F0ZUNvZGUgPSB0aGlzLnNjYW5Vbmljb2RlKCk7XG4gICAgICAgICAgaWYgKCEoMHhEQzAwIDw9IGxvd1N1cnJvZ2F0ZUNvZGUgJiYgbG93U3Vycm9nYXRlQ29kZSA8PSAweERGRkYpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29kZSA9IGRlY29kZVV0ZjE2KGNvZGUsIGxvd1N1cnJvZ2F0ZUNvZGUpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gZnJvbUNvZGVQb2ludChjb2RlKTtcbiAgICAgIH0gZWxzZSBpZiAoMHhEODAwIDw9IGNvZGUgJiYgY29kZSA8PSAweERCRkYpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvd1N1cnJvZ2F0ZUNvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgICArK3RoaXMuaW5kZXg7XG4gICAgICAgIGlmICghKDB4REMwMCA8PSBsb3dTdXJyb2dhdGVDb2RlICYmIGxvd1N1cnJvZ2F0ZUNvZGUgPD0gMHhERkZGKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvZGUgPSBkZWNvZGVVdGYxNihjb2RlLCBsb3dTdXJyb2dhdGVDb2RlKTtcbiAgICAgICAgY2ggPSBmcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgICAgfVxuICAgICAgaWYgKCFjaGVjayhjb2RlKSkge1xuICAgICAgICBpZiAoaWQubGVuZ3RoIDwgMSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5kZXggPSBzdGFydDtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgfVxuICAgICAgY2hlY2sgPSBpc0lkZW50aWZpZXJQYXJ0O1xuICAgICAgaWQgKz0gY2g7XG4gICAgfVxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIGdldElkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICBsZXQgbCA9IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IGNoZWNrID0gaXNJZGVudGlmaWVyU3RhcnQ7XG4gICAgd2hpbGUgKGkgPCBsKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBsZXQgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiIHx8IDB4RDgwMCA8PSBjb2RlICYmIGNvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAgIC8vIEdvIGJhY2sgYW5kIHRyeSB0aGUgaGFyZCBvbmUuXG4gICAgICAgIHRoaXMuaW5kZXggPSBzdGFydDtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RXNjYXBlZElkZW50aWZpZXIoKTtcbiAgICAgIH1cbiAgICAgIGlmICghY2hlY2soY29kZSkpIHtcbiAgICAgICAgdGhpcy5pbmRleCA9IGk7XG4gICAgICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgaSk7XG4gICAgICB9XG4gICAgICArK2k7XG4gICAgICBjaGVjayA9IGlzSWRlbnRpZmllclBhcnQ7XG4gICAgfVxuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgaSk7XG4gIH1cblxuICBzY2FuSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgLy8gQmFja3NsYXNoIChVKzAwNUMpIHN0YXJ0cyBhbiBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICBsZXQgaWQgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxcXFwiID8gdGhpcy5nZXRFc2NhcGVkSWRlbnRpZmllcigpIDogdGhpcy5nZXRJZGVudGlmaWVyKCk7XG5cbiAgICAvLyBUaGVyZSBpcyBubyBrZXl3b3JkIG9yIGxpdGVyYWwgd2l0aCBvbmx5IG9uZSBjaGFyYWN0ZXIuXG4gICAgLy8gVGh1cywgaXQgbXVzdCBiZSBhbiBpZGVudGlmaWVyLlxuICAgIGxldCBzbGljZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgIHNsaWNlLnRleHQgPSBpZDtcblxuICAgIGlmIChpZC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBuZXcgSWRlbnRpZmllclRva2VuKHNsaWNlKTtcbiAgICB9XG5cbiAgICBsZXQgc3ViVHlwZSA9IFRva2VuaXplci5nZXRLZXl3b3JkKGlkLCB0aGlzLnN0cmljdCk7XG4gICAgaWYgKHN1YlR5cGUgIT09IFRva2VuVHlwZS5JTExFR0FMKSB7XG4gICAgICByZXR1cm4gbmV3IEtleXdvcmRUb2tlbihzdWJUeXBlLCBzbGljZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJZGVudGlmaWVyVG9rZW4oc2xpY2UpO1xuICB9XG5cbiAgZ2V0TG9jYXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbmU6IHRoaXMuc3RhcnRMaW5lICsgMSxcbiAgICAgIGNvbHVtbjogdGhpcy5zdGFydEluZGV4IC0gdGhpcy5zdGFydExpbmVTdGFydCxcbiAgICAgIG9mZnNldDogdGhpcy5zdGFydEluZGV4XG4gICAgfTtcbiAgfVxuXG4gIGdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgcmV0dXJuIHt0ZXh0OiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgdGhpcy5pbmRleCksIHN0YXJ0LCBzdGFydExvY2F0aW9uLCBlbmQ6IHRoaXMuaW5kZXh9O1xuICB9XG5cbiAgc2NhblB1bmN0dWF0b3JIZWxwZXIoKSB7XG4gICAgbGV0IGNoMSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcblxuICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAvLyBDaGVjayBmb3IgbW9zdCBjb21tb24gc2luZ2xlLWNoYXJhY3RlciBwdW5jdHVhdG9ycy5cbiAgICAgIGNhc2UgXCIuXCI6XG4gICAgICAgIGxldCBjaDIgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgICBpZiAoY2gyICE9PSBcIi5cIikgcmV0dXJuIFRva2VuVHlwZS5QRVJJT0Q7XG4gICAgICAgIGxldCBjaDMgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpO1xuICAgICAgICBpZiAoY2gzICE9PSBcIi5cIikgcmV0dXJuIFRva2VuVHlwZS5QRVJJT0Q7XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuRUxMSVBTSVM7XG4gICAgICBjYXNlIFwiKFwiOlxuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkxQQVJFTjtcbiAgICAgIGNhc2UgXCIpXCI6XG4gICAgICBjYXNlIFwiO1wiOlxuICAgICAgY2FzZSBcIixcIjpcbiAgICAgICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICAgICAgY2FzZSBcIntcIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MQlJBQ0U7XG4gICAgICBjYXNlIFwifVwiOlxuICAgICAgY2FzZSBcIltcIjpcbiAgICAgIGNhc2UgXCJdXCI6XG4gICAgICBjYXNlIFwiOlwiOlxuICAgICAgY2FzZSBcIj9cIjpcbiAgICAgIGNhc2UgXCJ+XCI6XG4gICAgICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIFwiPVwiIChVKzAwM0QpIG1hcmtzIGFuIGFzc2lnbm1lbnQgb3IgY29tcGFyaXNvbiBvcGVyYXRvci5cbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiPVwiKSB7XG4gICAgICAgICAgc3dpdGNoIChjaDEpIHtcbiAgICAgICAgICAgIGNhc2UgXCI9XCI6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRVFfU1RSSUNUO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRVE7XG4gICAgICAgICAgICBjYXNlIFwiIVwiOlxuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5FX1NUUklDVDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5FO1xuICAgICAgICAgICAgY2FzZSBcInxcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX09SO1xuICAgICAgICAgICAgY2FzZSBcIitcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQUREO1xuICAgICAgICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU1VCO1xuICAgICAgICAgICAgY2FzZSBcIipcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fTVVMO1xuICAgICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MVEU7XG4gICAgICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkdURTtcbiAgICAgICAgICAgIGNhc2UgXCIvXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0RJVjtcbiAgICAgICAgICAgIGNhc2UgXCIlXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX01PRDtcbiAgICAgICAgICAgIGNhc2UgXCJeXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9YT1I7XG4gICAgICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EO1xuICAgICAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGJyZWFrOyAvL2ZhaWxlZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoMiA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSk7XG4gICAgICBpZiAoY2gxID09PSBjaDIpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IGNoMyA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMik7XG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI+XCIgJiYgY2gzID09PSBcIj5cIikge1xuICAgICAgICAgICAgLy8gNC1jaGFyYWN0ZXIgcHVuY3R1YXRvcjogPj4+PVxuICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAzIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NIUl9VTlNJR05FRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hSX1VOU0lHTkVEO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjaDEgPT09IFwiPFwiICYmIGNoMyA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NITDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2gxID09PSBcIj5cIiAmJiBjaDMgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSFI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyIDItY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiArKyAtLSA8PCA+PiAmJiB8fFxuICAgICAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOQztcbiAgICAgICAgICBjYXNlIFwiLVwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUM7XG4gICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hMO1xuICAgICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNIUjtcbiAgICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BTkQ7XG4gICAgICAgICAgY2FzZSBcInxcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuT1I7XG4gICAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7IC8vZmFpbGVkXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2gxID09PSBcIj1cIiAmJiBjaDIgPT09IFwiPlwiKSB7XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuQVJST1c7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICB9XG5cbiAgLy8gNy43IFB1bmN0dWF0b3JzXG4gIHNjYW5QdW5jdHVhdG9yKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IHN1YlR5cGUgPSB0aGlzLnNjYW5QdW5jdHVhdG9ySGVscGVyKCk7XG4gICAgdGhpcy5pbmRleCArPSBzdWJUeXBlLm5hbWUubGVuZ3RoO1xuICAgIHJldHVybiBuZXcgUHVuY3R1YXRvclRva2VuKHN1YlR5cGUsIHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgfVxuXG4gIHNjYW5IZXhMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBsZXQgaGV4ID0gZ2V0SGV4VmFsdWUoY2gpO1xuICAgICAgaWYgKGhleCA9PT0gLTEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPT09IGkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZGV4ID0gaTtcblxuICAgIGxldCBzbGljZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbihzbGljZSwgcGFyc2VJbnQoc2xpY2UudGV4dC5zdWJzdHIoMiksIDE2KSk7XG4gIH1cblxuICBzY2FuQmluYXJ5TGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBvZmZzZXQgPSB0aGlzLmluZGV4IC0gc3RhcnQ7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoICE9PSBcIjBcIiAmJiBjaCAhPT0gXCIxXCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggLSBzdGFydCA8PSBvZmZzZXQpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpKVxuICAgICAgICB8fCBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSwgcGFyc2VJbnQodGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikudGV4dC5zdWJzdHIob2Zmc2V0KSwgMiksIGZhbHNlKTtcbiAgfVxuXG4gIHNjYW5PY3RhbExpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IC0gc3RhcnQgPT09IDIpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSwgcGFyc2VJbnQodGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikudGV4dC5zdWJzdHIoMiksIDgpLCBmYWxzZSk7XG4gIH1cblxuICBzY2FuTGVnYWN5T2N0YWxMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgbGV0IGlzT2N0YWwgPSB0cnVlO1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSBcIjhcIiB8fCBjaCA9PT0gXCI5XCIpIHtcbiAgICAgICAgaXNPY3RhbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbiksIHBhcnNlSW50KHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLnRleHQuc3Vic3RyKDEpLCBpc09jdGFsID8gOCA6IDEwKSwgdHJ1ZSk7XG4gIH1cblxuICBzY2FuTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgIC8vIGFzc2VydChjaCA9PT0gXCIuXCIgfHwgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpXG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIGlmIChjaCA9PT0gXCIwXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICBpZiAoY2ggPT09IFwieFwiIHx8IGNoID09PSBcIlhcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuSGV4TGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiYlwiIHx8IGNoID09PSBcIkJcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuQmluYXJ5TGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwib1wiIHx8IGNoID09PSBcIk9cIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuT2N0YWxMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbkxlZ2FjeU9jdGFsTGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaCAhPT0gXCIuXCIpIHtcbiAgICAgIC8vIE11c3QgYmUgXCIxXCIuLlwiOVwiXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBlID0gMDtcbiAgICBpZiAoY2ggPT09IFwiLlwiKSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICB9XG5cbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIGUrKztcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFT0Ygbm90IHJlYWNoZWQgaGVyZVxuICAgIGlmIChjaCA9PT0gXCJlXCIgfHwgY2ggPT09IFwiRVwiKSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGxldCBuZWcgPSBmYWxzZTtcbiAgICAgIGlmIChjaCA9PT0gXCIrXCIgfHwgY2ggPT09IFwiLVwiKSB7XG4gICAgICAgIG5lZyA9IGNoID09PSBcIi1cIjtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGxldCBmID0gMDtcbiAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICBmICo9IDEwO1xuICAgICAgICAgIGYgKz0gK2NoO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgZSArPSBuZWcgPyBmIDogLWY7XG4gICAgfVxuXG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICB9XG5cbiAgc2NhblN0cmluZ0VzY2FwZShzdHIsIG9jdGFsKSB7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cbiAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgaWYgKCFpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgc3RyICs9IFwiXFxuXCI7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiclwiOlxuICAgICAgICAgIHN0ciArPSBcIlxcclwiO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICBzdHIgKz0gXCJcXHRcIjtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgIGNhc2UgXCJ4XCI6XG4gICAgICAgICAgbGV0IHJlc3RvcmUgPSB0aGlzLmluZGV4O1xuICAgICAgICAgIGxldCB1bmVzY2FwZWQ7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHVuZXNjYXBlZCA9IGNoID09PSBcInVcIiA/IHRoaXMuc2NhblVuaWNvZGUoKSA6IHRoaXMuc2NhbkhleEVzY2FwZTIoKTtcbiAgICAgICAgICBpZiAodW5lc2NhcGVkIDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0ciArPSBmcm9tQ29kZVBvaW50KHVuZXNjYXBlZCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJiXCI6XG4gICAgICAgICAgc3RyICs9IFwiXFxiXCI7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgIHN0ciArPSBcIlxcZlwiO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICBzdHIgKz0gXCJcXHUwMDBCXCI7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikge1xuICAgICAgICAgICAgbGV0IG9jdExlbiA9IDE7XG4gICAgICAgICAgICAvLyAzIGRpZ2l0cyBhcmUgb25seSBhbGxvd2VkIHdoZW4gc3RyaW5nIHN0YXJ0c1xuICAgICAgICAgICAgLy8gd2l0aCAwLCAxLCAyLCAzXG4gICAgICAgICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCIzXCIpIHtcbiAgICAgICAgICAgICAgb2N0TGVuID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBjb2RlID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChvY3RMZW4gPCAzICYmIFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICAgIGlmIChvY3RMZW4gPiAwIHx8IGNoICE9PSBcIjBcIikge1xuICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb2RlICo9IDg7XG4gICAgICAgICAgICAgIG9jdExlbisrO1xuICAgICAgICAgICAgICBjb2RlICs9IGNoIC0gXCIwXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCI4XCIgfHwgY2ggPT09IFwiOVwiKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKGNoID09PSBcIlxcclwiICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXG5cIikge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICB0aGlzLmxpbmUrKztcbiAgICB9XG4gICAgcmV0dXJuIFtzdHIsIG9jdGFsXTtcbiAgfVxuICAvLyA3LjguNCBTdHJpbmcgTGl0ZXJhbHNcbiAgc2NhblN0cmluZ0xpdGVyYWwoKSB7XG4gICAgbGV0IHN0ciA9IFwiXCI7XG5cbiAgICBsZXQgcXVvdGUgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgLy8gIGFzc2VydCgocXVvdGUgPT09IFwiXFxcIlwiIHx8IHF1b3RlID09PSBcIlwiXCIpLCBcIlN0cmluZyBsaXRlcmFsIG11c3Qgc3RhcnRzIHdpdGggYSBxdW90ZVwiKVxuXG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4Kys7XG5cbiAgICBsZXQgb2N0YWwgPSBmYWxzZTtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIHJldHVybiBuZXcgU3RyaW5nTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLCBzdHIsIG9jdGFsKTtcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIFtzdHIsIG9jdGFsXSA9IHRoaXMuc2NhblN0cmluZ0VzY2FwZShzdHIsIG9jdGFsKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICB9XG5cbiAgc2NhblRlbXBsYXRlRWxlbWVudCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXgrKztcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcbiAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgY2FzZSAweDYwOiAgLy8gYFxuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gbmV3IFRlbXBsYXRlVG9rZW4odHJ1ZSwgdGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgICBjYXNlIDB4MjQ6ICAvLyAkXG4gICAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCArIDEpID09PSAweDdCKSB7ICAvLyB7XG4gICAgICAgICAgICB0aGlzLmluZGV4ICs9IDI7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFRlbXBsYXRlVG9rZW4oZmFsc2UsIHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDB4NUM6ICAvLyBcXFxcXG4gICAgICAgIHtcbiAgICAgICAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgICAgbGV0IG9jdGFsID0gdGhpcy5zY2FuU3RyaW5nRXNjYXBlKFwiXCIsIGZhbHNlKVsxXTtcbiAgICAgICAgICBpZiAob2N0YWwpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9JTExFR0FMX1RPS0VOKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gIH1cblxuICBzY2FuUmVnRXhwKHN0cikge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICBsZXQgdGVybWluYXRlZCA9IGZhbHNlO1xuICAgIGxldCBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2xhc3NNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiXVwiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiW1wiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGVybWluYXRlZCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpICYmIGNoICE9PSBcIlxcXFxcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIHN0ciArPSBjaDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSwgc3RyKTtcbiAgfVxuXG4gIGFkdmFuY2UoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmxhc3RJbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5sYXN0TGluZSA9IHRoaXMubGluZTtcbiAgICB0aGlzLmxhc3RMaW5lU3RhcnQgPSB0aGlzLmxpbmVTdGFydDtcblxuICAgIHRoaXMuc2tpcENvbW1lbnQoKTtcblxuICAgIHRoaXMuc3RhcnRJbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5zdGFydExpbmUgPSB0aGlzLmxpbmU7XG4gICAgdGhpcy5zdGFydExpbmVTdGFydCA9IHRoaXMubGluZVN0YXJ0O1xuXG4gICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbmV3IEVPRlRva2VuKHRoaXMuZ2V0U2xpY2UodGhpcy5pbmRleCwgc3RhcnRMb2NhdGlvbikpO1xuICAgIH1cblxuICAgIGxldCBjaGFyQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG5cbiAgICBpZiAoY2hhckNvZGUgPCAweDgwKSB7XG4gICAgICBpZiAoUFVOQ1RVQVRPUl9TVEFSVFtjaGFyQ29kZV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoYXJDb2RlKSB8fCBjaGFyQ29kZSA9PT0gMHg1QyAvKiBiYWNrc2xhc2ggKFxcKSAqLykge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuSWRlbnRpZmllcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBEb3QgKC4pIFUrMDAyRSBjYW4gYWxzbyBzdGFydCBhIGZsb2F0aW5nLXBvbGV0IG51bWJlciwgaGVuY2UgdGhlIG5lZWRcbiAgICAgIC8vIHRvIGNoZWNrIHRoZSBuZXh0IGNoYXJhY3Rlci5cbiAgICAgIGlmIChjaGFyQ29kZSA9PT0gMHgyRSkge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgaXNEZWNpbWFsRGlnaXQodGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4ICsgMSkpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RyaW5nIGxpdGVyYWwgc3RhcnRzIHdpdGggc2luZ2xlIHF1b3RlIChVKzAwMjcpIG9yIGRvdWJsZSBxdW90ZSAoVSswMDIyKS5cbiAgICAgIGlmIChjaGFyQ29kZSA9PT0gMHgyNyB8fCBjaGFyQ29kZSA9PT0gMHgyMikge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBUZW1wbGF0ZSBsaXRlcmFsIHN0YXJ0cyB3aXRoIGJhY2sgcXVvdGUgKFUrMDA2MClcbiAgICAgIGlmIChjaGFyQ29kZSA9PT0gMHg2MCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuVGVtcGxhdGVFbGVtZW50KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICgweDMwIC8qIFwiMFwiICovIDw9IGNoYXJDb2RlICYmIGNoYXJDb2RlIDw9IDB4MzkgLyogXCI5XCIgKi8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNsYXNoICgvKSBVKzAwMkYgY2FuIGFsc28gc3RhcnQgYSByZWdleC5cbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2hhckNvZGUpIHx8IDB4RDgwMCA8PSBjaGFyQ29kZSAmJiBjaGFyQ29kZSA8PSAweERCRkYpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbklkZW50aWZpZXIoKTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuICB9XG5cbiAgZW9mKCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRU9TO1xuICB9XG5cbiAgbGV4KCkge1xuICAgIGxldCBwcmV2VG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuICAgIHRoaXMudG9rZW5JbmRleCsrO1xuICAgIHJldHVybiBwcmV2VG9rZW47XG4gIH1cbn1cbiJdfQ==