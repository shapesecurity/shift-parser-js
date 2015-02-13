"use strict";

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

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
var isWhitespace = _utils.isWhitespace;
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
  CONTINUE: { klass: TokenClass.Keyword, name: "continue" },
  DEBUGGER: { klass: TokenClass.Keyword, name: "debugger" },
  DEFAULT: { klass: TokenClass.Keyword, name: "default" },
  DO: { klass: TokenClass.Keyword, name: "do" },
  ELSE: { klass: TokenClass.Keyword, name: "else" },
  FINALLY: { klass: TokenClass.Keyword, name: "finally" },
  FOR: { klass: TokenClass.Keyword, name: "for" },
  FUNCTION: { klass: TokenClass.Keyword, name: "function" },
  IF: { klass: TokenClass.Keyword, name: "if" },
  NEW: { klass: TokenClass.Keyword, name: "new" },
  RETURN: { klass: TokenClass.Keyword, name: "return" },
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
  LET: { klass: TokenClass.Keyword, name: "let" },
  ILLEGAL: { klass: TokenClass.Illegal, name: "" }
};

var TT = TokenType;
var I = TT.ILLEGAL;
var F = false;
var T = true;

var ONE_CHAR_PUNCTUATOR = [I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.NOT, I, I, I, TT.MOD, TT.BIT_AND, I, TT.LPAREN, TT.RPAREN, TT.MUL, TT.ADD, TT.COMMA, TT.SUB, TT.PERIOD, TT.DIV, I, I, I, I, I, I, I, I, I, I, TT.COLON, TT.SEMICOLON, TT.LT, TT.ASSIGN, TT.GT, TT.CONDITIONAL, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACK, I, TT.RBRACK, TT.BIT_XOR, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACE, TT.BIT_OR, TT.RBRACE, TT.BIT_NOT];

var PUNCTUATOR_START = [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, T, T, F, T, T, T, T, T, T, F, T, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, T, T, T, F];

var IDENTIFIER_START = [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, F, T, F, F, T, F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, F, F, F, F, F];

var Token = exports.Token = (function () {
  function Token(type, slice, octal) {
    _classCallCheck(this, Token);

    this.type = type;
    this.slice = slice;
    this.octal = octal;
  }

  _prototypeProperties(Token, null, {
    value: {
      get: function () {},
      configurable: true
    }
  });

  return Token;
})();
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
    var octal = arguments[2] === undefined ? false : arguments[2];
    return (function () {
      _classCallCheck(_this, NumericLiteralToken);

      _get(Object.getPrototypeOf(NumericLiteralToken.prototype), "constructor", _this).call(_this, TokenType.NUMBER, slice, octal);
      _this._value = value;
    })();
  }

  _inherits(NumericLiteralToken, Token);

  _prototypeProperties(NumericLiteralToken, null, {
    value: {
      get: function () {
        return this._value.toString();
      },
      configurable: true
    }
  });

  return NumericLiteralToken;
})(Token);
var StringLiteralToken = exports.StringLiteralToken = (function (Token) {
  function StringLiteralToken(slice, value, octal) {
    _classCallCheck(this, StringLiteralToken);

    _get(Object.getPrototypeOf(StringLiteralToken.prototype), "constructor", this).call(this, TokenType.STRING, slice, octal);
    this._value = value;
  }

  _inherits(StringLiteralToken, Token);

  _prototypeProperties(StringLiteralToken, null, {
    value: {
      get: function () {
        return this._value;
      },
      configurable: true
    }
  });

  return StringLiteralToken;
})(Token);
var EOFToken = exports.EOFToken = (function (Token) {
  function EOFToken(slice) {
    _classCallCheck(this, EOFToken);

    _get(Object.getPrototypeOf(EOFToken.prototype), "constructor", this).call(this, TokenType.EOS, slice, false);
  }

  _inherits(EOFToken, Token);

  _prototypeProperties(EOFToken, null, {
    value: {
      get: function () {
        return "";
      },
      configurable: true
    }
  });

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
    this.lookahead = this.advance();
    this.strict = false;
    this.hasLineTerminatorBeforeNext = false;
    this.prevToken = null;
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
                if (Tokenizer.cse2(id, "e", "t")) {
                  return strict ? TokenType.FUTURE_STRICT_RESERVED_WORD : TokenType.LET;
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
                  return TokenType.FUTURE_RESERVED_WORD;
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
                  return strict ? TokenType.FUTURE_STRICT_RESERVED_WORD : TokenType.ILLEGAL;
                }
                break;
              case "s":
                // SUPER
                if (Tokenizer.cse4(id, "u", "p", "e", "r")) {
                  return TokenType.FUTURE_RESERVED_WORD;
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
                } else if (strict && Tokenizer.cse5(id, "t", "a", "t", "i", "c")) {
                  return TokenType.FUTURE_STRICT_RESERVED_WORD;
                }
                break;
              case "e":
                if (Tokenizer.cse5(id, "x", "p", "o", "r", "t")) {
                  return TokenType.FUTURE_RESERVED_WORD;
                }
                break;
              case "i":
                if (Tokenizer.cse5(id, "m", "p", "o", "r", "t")) {
                  return TokenType.FUTURE_RESERVED_WORD;
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
                  return TokenType.FUTURE_RESERVED_WORD;
                }
                break;
              case "p":
                if (strict) {
                  var s = id;
                  if ("private" === s || "package" === s) {
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
              if ("protected" === s || "interface" === s) {
                return TokenType.FUTURE_STRICT_RESERVED_WORD;
              }
            }
            break;
          case 10:
            {
              var s = id;
              if ("instanceof" === s) {
                return TokenType.INSTANCEOF;
              } else if (strict && "implements" === s) {
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
          default:
            break;
        }
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.value);
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
            if (chCode === 13 /* "\r" */ && this.index < this.source.length && this.source.charCodeAt(this.index) === 10 /*"\n" */) {
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

        while (this.index < length) {
          var chCode = this.source.charCodeAt(this.index);
          if (chCode < 128) {
            switch (chCode) {
              case 42:
                // "*"
                // Block comment ends with "*/'.
                if (this.index + 1 < length && this.source.charAt(this.index + 1) === "/") {
                  this.index = this.index + 2;
                  return;
                }
                this.index++;
                break;
              case 10:
                // "\n"
                this.hasLineTerminatorBeforeNext = true;
                this.index++;
                this.lineStart = this.index;
                this.line++;
                break;
              case 13:
                // "\r":
                this.hasLineTerminatorBeforeNext = true;
                if (this.index < length - 1 && this.source.charAt(this.index + 1) === "\n") {
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
          if (isWhitespace(chCode)) {
            this.index++;
          } else if (isLineTerminator(chCode)) {
            this.hasLineTerminatorBeforeNext = true;
            this.index++;
            if (chCode === 13 /* "\r" */ && this.index < length && this.source.charAt(this.index) === "\n") {
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
              this.skipMultiLineComment();
            } else {
              break;
            }
          } else if (isLineStart && chCode === 45 /* "-" */) {
            if (this.index + 2 >= length) {
              break;
            }
            // U+003E is ">'
            if (this.source.charAt(this.index + 1) === "-" && this.source.charAt(this.index + 2) === ">") {
              // "-->" is a single-line comment
              this.skipSingleLineComment(3);
            } else {
              break;
            }
          } else if (chCode === 60 /* "<" */) {
            if (this.index + 4 <= length && this.source.charAt(this.index + 1) === "!" && this.source.charAt(this.index + 2) === "-" && this.source.charAt(this.index + 3) === "-") {
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
            return -1;
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
        var ch = this.source.charAt(this.index);
        this.index++;
        if (this.index >= this.source.length) {
          throw this.createILLEGAL();
        }

        var id = "";

        if (ch === "\\") {
          if (this.source.charAt(this.index) !== "u") {
            throw this.createILLEGAL();
          }
          this.index++;
          if (this.index >= this.source.length) {
            throw this.createILLEGAL();
          }
          var ich = this.scanUnicode();
          if (ich < 0 || ich === 92 /* "\\" */ || !isIdentifierStart(ich)) {
            throw this.createILLEGAL();
          }
          ch = String.fromCharCode(ich);
        }
        id += ch;

        while (this.index < this.source.length) {
          ch = this.source.charAt(this.index);
          if (!isIdentifierPart(ch.charCodeAt(0)) && ch !== "\\") {
            break;
          }
          this.index++;
          if (ch === "\\") {
            if (this.index >= this.source.length) {
              throw this.createILLEGAL();
            }
            if (this.source.charAt(this.index) !== "u") {
              throw this.createILLEGAL();
            }
            this.index++;
            if (this.index >= this.source.length) {
              throw this.createILLEGAL();
            }
            var ich = this.scanUnicode();
            if (ich < 0 || ich === 92 /* "\\" */ || !isIdentifierPart(ich)) {
              throw this.createILLEGAL();
            }
            ch = String.fromCharCode(ich);
          }
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
        this.index++;
        var l = this.source.length;
        var i = this.index;
        while (i < l) {
          var ch = this.source.charAt(i);
          if (ch === "\\") {
            // Go back and try the hard one.
            this.index = start;
            return this.getEscapedIdentifier();
          } else if (isIdentifierPart(ch.charCodeAt(0))) {
            i++;
          } else {
            break;
          }
        }
        this.index = i;
        return this.source.slice(start, this.index);
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
            if (ch2 !== ".") return TokenType.PERIOD;
            var ch3 = this.source.charAt(this.index + 2);
            if (ch3 !== ".") return TokenType.PERIOD;
            return TokenType.ELLIPSIS;
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

        if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index)) || isDecimalDigit(this.source.charAt(this.index)))) {
          throw this.createILLEGAL();
        }

        return new NumericLiteralToken(this.getSlice(start, startLocation), parseInt(this.getSlice(start, startLocation).text.substr(offset), 2), true);
      },
      writable: true,
      configurable: true
    },
    scanOctalLiteral: {
      value: function scanOctalLiteral(start, startLocation) {
        var offset = this.index - start;

        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (!("0" <= ch && ch <= "7")) {
            break;
          }
          this.index++;
        }

        if (offset === 2 && this.index - start === 2) {
          throw this.createILLEGAL();
        }

        if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index)) || isDecimalDigit(this.source.charAt(this.index)))) {
          throw this.createILLEGAL();
        }

        return new NumericLiteralToken(this.getSlice(start, startLocation), parseInt(this.getSlice(start, startLocation).text.substr(offset), 8), true);
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
              return this.scanOctalLiteral(start, startLocation);
            }
          } else {
            return new NumericLiteralToken(this.getSlice(start, startLocation));
          }
        } else if (ch !== ".") {
          // Must be "1'..'9'
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
            this.index++;
            if (this.index === this.source.length) {
              throw this.createILLEGAL();
            }
            ch = this.source.charAt(this.index);
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
                  if (unescaped >= 0) {
                    str += String.fromCharCode(unescaped);
                  } else {
                    this.index = restore;
                    str += ch;
                    this.index++;
                  }
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
                    octal = true;
                    var octLen = 1;
                    // 3 digits are only allowed when string starts
                    // with 0, 1, 2, 3
                    if ("0" <= ch && ch <= "3") {
                      octLen = 0;
                    }
                    var code = 0;
                    while (octLen < 3 && "0" <= ch && ch <= "7") {
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
                  } else {
                    str += ch;
                    this.index++;
                  }
              }
            } else {
              this.hasLineTerminatorBeforeNext = true;
              this.index++;
              if (ch === "\r" && this.source.charAt(this.index) === "\n") {
                this.index++;
              }
              this.lineStart = this.index;
              this.line++;
            }
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

          if (IDENTIFIER_START[charCode]) {
            return this.scanIdentifier();
          }

          // Dot (.) U+002E can also start a floating-polet number, hence the need
          // to check the next character.
          if (charCode === 46) {
            if (this.index + 1 < this.source.length && isDecimalDigit(this.source.charAt(this.index + 1))) {
              return this.scanNumericLiteral();
            }
            return this.scanPunctuator();
          }

          // String literal starts with single quote (U+0027) or double quote (U+0022).
          if (charCode === 39 || charCode === 34) {
            return this.scanStringLiteral();
          }

          if (48 /* '0' */ <= charCode && charCode <= 57 /* '9' */) {
            return this.scanNumericLiteral();
          }

          // Slash (/) U+002F can also start a regex.
          throw this.createILLEGAL();
        } else {
          if (isIdentifierStart(charCode)) {
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
        this.prevToken = this.lookahead;
        this.lookahead = this.advance();
        this.tokenIndex++;
        return this.prevToken;
      },
      writable: true,
      configurable: true
    }
  });

  return Tokenizer;
})();

exports["default"] = Tokenizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQWlCK0csU0FBUzs7SUFBaEgsV0FBVyxVQUFYLFdBQVc7SUFBRSxnQkFBZ0IsVUFBaEIsZ0JBQWdCO0lBQUUsWUFBWSxVQUFaLFlBQVk7SUFBRSxpQkFBaUIsVUFBakIsaUJBQWlCO0lBQUUsZ0JBQWdCLFVBQWhCLGdCQUFnQjtJQUFFLGNBQWMsVUFBZCxjQUFjO0lBQ2hHLGFBQWEsV0FBTyxVQUFVLEVBQTlCLGFBQWE7SUFDVCxLQUFLLFdBQU0sV0FBVzs7QUFFM0IsSUFBTSxVQUFVLFdBQVYsVUFBVSxHQUFHO0FBQ3hCLEtBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDcEIsT0FBSyxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUM7QUFDbkQsU0FBTyxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLEVBQUM7QUFDbEQsZ0JBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDakMsWUFBVSxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUNoQyxlQUFhLEVBQUUsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQy9CLG1CQUFpQixFQUFFLEVBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFDO0FBQzlDLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsY0FBWSxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUM3QixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0NBQzNCLENBQUM7O0FBRUssSUFBTSxTQUFTLFdBQVQsU0FBUyxHQUFHO0FBQ3ZCLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekMsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsVUFBUSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUNyRCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ2pELGFBQVcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDdEQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsZUFBYSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN6RCxnQkFBYyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMxRCxnQkFBYyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMxRCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3ZELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdkQscUJBQW1CLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQ2pFLFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2hELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsY0FBWSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN6RCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdEQsV0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN0RCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzdDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDN0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUM7QUFDM0QsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7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RUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDckgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDcEgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdEYsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRW5DLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztJQUV0QixLQUFLLFdBQUwsS0FBSztBQUNMLFdBREEsS0FBSyxDQUNKLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSzswQkFE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RSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7T0FDN0U7Ozs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQ2xDLGVBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7T0FDckc7Ozs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUN2QyxlQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQzNHLEdBQUcsQ0FBQztPQUNiOzs7O0FBRU0sUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQzVDLGVBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FB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QUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzdGLHFCQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2FBQ2xDO0FBQ0QsbUJBQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1dBQzlCOzs7QUFHRCxjQUFJLFFBQVEsS0FBSyxFQUFNLElBQUksUUFBUSxLQUFLLEVBQU0sRUFBRTtBQUM5QyxtQkFBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztXQUNqQzs7QUFFRCxjQUFJLEVBQU0sY0FBYyxRQUFRLElBQUksUUFBUSxJQUFJLEVBQU0sVUFBQSxFQUFZO0FBQ2hFLG1CQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1dBQ2xDOzs7QUFHRCxnQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDNUIsTUFBTTtBQUNMLGNBQUksaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDL0IsbUJBQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1dBQzlCOztBQUVELGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1QjtPQUNGOzs7O0FBRUQsT0FBRzthQUFBLGVBQUc7QUFDSixlQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7T0FDOUM7Ozs7QUFFRCxPQUFHO2FBQUEsZUFBRztBQUNKLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUNoQyxZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxZQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDbEIsZUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDO09BQ3ZCOzs7Ozs7U0EzcENrQixTQUFTOzs7cUJBQVQsU0FBUyIsImZpbGUiOiJzcmMvdG9rZW5pemVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuaW1wb3J0IHtnZXRIZXhWYWx1ZSwgaXNMaW5lVGVybWluYXRvciwgaXNXaGl0ZXNwYWNlLCBpc0lkZW50aWZpZXJTdGFydCwgaXNJZGVudGlmaWVyUGFydCwgaXNEZWNpbWFsRGlnaXR9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQge0Vycm9yTWVzc2FnZXN9IGZyb20gXCIuL2Vycm9yc1wiO1xuaW1wb3J0ICogYXMgU2hpZnQgZnJvbSBcInNoaWZ0LWFzdFwiO1xuXG5leHBvcnQgY29uc3QgVG9rZW5DbGFzcyA9IHtcbiAgRW9mOiB7bmFtZTogXCI8RW5kPlwifSxcbiAgSWRlbnQ6IHtuYW1lOiBcIklkZW50aWZpZXJcIiwgaXNJZGVudGlmaWVyTmFtZTogdHJ1ZX0sXG4gIEtleXdvcmQ6IHtuYW1lOiBcIktleXdvcmRcIiwgaXNJZGVudGlmaWVyTmFtZTogdHJ1ZX0sXG4gIE51bWVyaWNMaXRlcmFsOiB7bmFtZTogXCJOdW1lcmljXCJ9LFxuICBQdW5jdHVhdG9yOiB7bmFtZTogXCJQdW5jdHVhdG9yXCJ9LFxuICBTdHJpbmdMaXRlcmFsOiB7bmFtZTogXCJTdHJpbmdcIn0sXG4gIFJlZ3VsYXJFeHByZXNzaW9uOiB7bmFtZTogXCJSZWd1bGFyRXhwcmVzc2lvblwifSxcbiAgTGluZUNvbW1lbnQ6IHtuYW1lOiBcIkxpbmVcIn0sXG4gIEJsb2NrQ29tbWVudDoge25hbWU6IFwiQmxvY2tcIn0sXG4gIElsbGVnYWw6IHtuYW1lOiBcIklsbGVnYWxcIn1cbn07XG5cbmV4cG9ydCBjb25zdCBUb2tlblR5cGUgPSB7XG4gIEVPUzoge2tsYXNzOiBUb2tlbkNsYXNzLkVvZiwgbmFtZTogXCJFT1NcIn0sXG4gIExQQVJFTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKFwifSxcbiAgUlBBUkVOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIpXCJ9LFxuICBMQlJBQ0s6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIltcIn0sXG4gIFJCUkFDSzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXVwifSxcbiAgTEJSQUNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ7XCJ9LFxuICBSQlJBQ0U6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn1cIn0sXG4gIENPTE9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI6XCJ9LFxuICBTRU1JQ09MT046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjtcIn0sXG4gIFBFUklPRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLlwifSxcbiAgRUxMSVBTSVM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi4uLlwifSxcbiAgQVJST1c6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj0+XCJ9LFxuICBDT05ESVRJT05BTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiP1wifSxcbiAgSU5DOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrK1wifSxcbiAgREVDOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItLVwifSxcbiAgQVNTSUdOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9XCJ9LFxuICBBU1NJR05fQklUX09SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8PVwifSxcbiAgQVNTSUdOX0JJVF9YT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl49XCJ9LFxuICBBU1NJR05fQklUX0FORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJj1cIn0sXG4gIEFTU0lHTl9TSEw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw8PVwifSxcbiAgQVNTSUdOX1NIUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj49XCJ9LFxuICBBU1NJR05fU0hSX1VOU0lHTkVEOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj49XCJ9LFxuICBBU1NJR05fQUREOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrPVwifSxcbiAgQVNTSUdOX1NVQjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLT1cIn0sXG4gIEFTU0lHTl9NVUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIio9XCJ9LFxuICBBU1NJR05fRElWOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIvPVwifSxcbiAgQVNTSUdOX01PRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJT1cIn0sXG4gIENPTU1BOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIsXCJ9LFxuICBPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifHxcIn0sXG4gIEFORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJiZcIn0sXG4gIEJJVF9PUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifFwifSxcbiAgQklUX1hPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXlwifSxcbiAgQklUX0FORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJlwifSxcbiAgU0hMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PFwifSxcbiAgU0hSOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+PlwifSxcbiAgU0hSX1VOU0lHTkVEOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj5cIn0sXG4gIEFERDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiK1wifSxcbiAgU1VCOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItXCJ9LFxuICBNVUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIipcIn0sXG4gIERJVjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiL1wifSxcbiAgTU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIlXCJ9LFxuICBFUToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPT1cIn0sXG4gIE5FOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIhPVwifSxcbiAgRVFfU1RSSUNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9PT1cIn0sXG4gIE5FX1NUUklDVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIT09XCJ9LFxuICBMVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPFwifSxcbiAgR1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj5cIn0sXG4gIExURToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPD1cIn0sXG4gIEdURToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj1cIn0sXG4gIElOU1RBTkNFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImluc3RhbmNlb2ZcIn0sXG4gIElOOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpblwifSxcbiAgT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm9mXCJ9LFxuICBOT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiFcIn0sXG4gIEJJVF9OT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn5cIn0sXG4gIERFTEVURToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVsZXRlXCJ9LFxuICBUWVBFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInR5cGVvZlwifSxcbiAgVk9JRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidm9pZFwifSxcbiAgQlJFQUs6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImJyZWFrXCJ9LFxuICBDQVNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXNlXCJ9LFxuICBDQVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2F0Y2hcIn0sXG4gIENPTlRJTlVFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb250aW51ZVwifSxcbiAgREVCVUdHRVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlYnVnZ2VyXCJ9LFxuICBERUZBVUxUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkZWZhdWx0XCJ9LFxuICBETzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZG9cIn0sXG4gIEVMU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImVsc2VcIn0sXG4gIEZJTkFMTFk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZpbmFsbHlcIn0sXG4gIEZPUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZm9yXCJ9LFxuICBGVU5DVElPTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZnVuY3Rpb25cIn0sXG4gIElGOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpZlwifSxcbiAgTkVXOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJuZXdcIn0sXG4gIFJFVFVSTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwicmV0dXJuXCJ9LFxuICBTV0lUQ0g6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInN3aXRjaFwifSxcbiAgVEhJUzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidGhpc1wifSxcbiAgVEhST1c6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRocm93XCJ9LFxuICBUUlk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRyeVwifSxcbiAgVkFSOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ2YXJcIn0sXG4gIFdISUxFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ3aGlsZVwifSxcbiAgV0lUSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwid2l0aFwifSxcbiAgTlVMTDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwibnVsbFwifSxcbiAgVFJVRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidHJ1ZVwifSxcbiAgRkFMU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZhbHNlXCJ9LFxuICBZSUVMRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwieWllbGRcIn0sXG4gIE5VTUJFUjoge2tsYXNzOiBUb2tlbkNsYXNzLk51bWVyaWNMaXRlcmFsLCBuYW1lOiBcIlwifSxcbiAgU1RSSU5HOiB7a2xhc3M6IFRva2VuQ2xhc3MuU3RyaW5nTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFJFR0VYUDoge2tsYXNzOiBUb2tlbkNsYXNzLlJlZ3VsYXJFeHByZXNzaW9uLCBuYW1lOiBcIlwifSxcbiAgSURFTlRJRklFUjoge2tsYXNzOiBUb2tlbkNsYXNzLklkZW50LCBuYW1lOiBcIlwifSxcbiAgRlVUVVJFX1JFU0VSVkVEX1dPUkQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIlwifSxcbiAgRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJcIn0sXG4gIENPTlNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb25zdFwifSxcbiAgTEVUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJsZXRcIn0sXG4gIElMTEVHQUw6IHtrbGFzczogVG9rZW5DbGFzcy5JbGxlZ2FsLCBuYW1lOiBcIlwifVxufTtcblxuY29uc3QgVFQgPSBUb2tlblR5cGU7XG5jb25zdCBJID0gVFQuSUxMRUdBTDtcbmNvbnN0IEYgPSBmYWxzZTtcbmNvbnN0IFQgPSB0cnVlO1xuXG5jb25zdCBPTkVfQ0hBUl9QVU5DVFVBVE9SID0gW1xuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5OT1QsIEksIEksIEksXG4gIFRULk1PRCwgVFQuQklUX0FORCwgSSwgVFQuTFBBUkVOLCBUVC5SUEFSRU4sIFRULk1VTCwgVFQuQURELCBUVC5DT01NQSwgVFQuU1VCLCBUVC5QRVJJT0QsIFRULkRJViwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgVFQuQ09MT04sIFRULlNFTUlDT0xPTiwgVFQuTFQsIFRULkFTU0lHTiwgVFQuR1QsIFRULkNPTkRJVElPTkFMLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLFxuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5MQlJBQ0ssIEksIFRULlJCUkFDSywgVFQuQklUX1hPUiwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNFLCBUVC5CSVRfT1IsIFRULlJCUkFDRSwgVFQuQklUX05PVF07XG5cbmNvbnN0IFBVTkNUVUFUT1JfU1RBUlQgPSBbXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIEYsIEYsIFQsIFQsXG4gIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIEZdO1xuXG5jb25zdCBJREVOVElGSUVSX1NUQVJUID0gW1xuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULFxuICBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBGLCBULCBGLCBGLCBULCBGLCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULFxuICBULCBULCBULCBULCBULCBULCBGLCBGLCBGLCBGLCBGXTtcblxuZXhwb3J0IGNsYXNzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UsIG9jdGFsKSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnNsaWNlID0gc2xpY2U7XG4gICAgdGhpcy5vY3RhbCA9IG9jdGFsO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJZGVudGlmaWVyTGlrZVRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCBzbGljZSkge1xuICAgIHN1cGVyKHR5cGUsIHNsaWNlLCBmYWxzZSk7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2xpY2UudGV4dDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpZmllclRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLklERU5USUZJRVIsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5d29yZFRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQdW5jdHVhdG9yVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlLm5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuUkVHRVhQLCBzbGljZSwgZmFsc2UpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUgPSArc2xpY2UudGV4dCwgb2N0YWwgPSBmYWxzZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5OVU1CRVIsIHNsaWNlLCBvY3RhbCk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUsIG9jdGFsKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLlNUUklORywgc2xpY2UsIG9jdGFsKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRU9GVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkVPUywgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSnNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoaW5kZXgsIGxpbmUsIGNvbHVtbiwgbXNnKSB7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IG1zZztcbiAgICB0aGlzLm1lc3NhZ2UgPSBgWyR7bGluZX06JHtjb2x1bW59XTogJHttc2d9YDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB0aGlzLmluZGV4ID0gMDtcbiAgICB0aGlzLmxpbmUgPSAwO1xuICAgIHRoaXMubGluZVN0YXJ0ID0gMDtcbiAgICB0aGlzLnN0YXJ0SW5kZXggPSAwO1xuICAgIHRoaXMuc3RhcnRMaW5lID0gMDtcbiAgICB0aGlzLnN0YXJ0TGluZVN0YXJ0ID0gMDtcbiAgICB0aGlzLmxhc3RJbmRleCA9IDA7XG4gICAgdGhpcy5sYXN0TGluZSA9IDA7XG4gICAgdGhpcy5sYXN0TGluZVN0YXJ0ID0gMDtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuICAgIHRoaXMuc3RyaWN0ID0gZmFsc2U7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLnByZXZUb2tlbiA9IG51bGw7XG4gICAgdGhpcy50b2tlbkluZGV4ID0gMDtcbiAgfVxuXG4gIGNyZWF0ZUlMTEVHQUwoKSB7XG4gICAgdGhpcy5zdGFydEluZGV4ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLnN0YXJ0TGluZSA9IHRoaXMubGluZTtcbiAgICB0aGlzLnN0YXJ0TGluZVN0YXJ0ID0gdGhpcy5saW5lU3RhcnQ7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lMTEVHQUxfVE9LRU4pO1xuICB9XG5cbiAgY3JlYXRlVW5leHBlY3RlZCh0b2tlbikge1xuICAgIHN3aXRjaCAodG9rZW4udHlwZS5rbGFzcykge1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLkVvZjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0VPUyk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuTnVtZXJpY0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9OVU1CRVIpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9TVFJJTkcpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLklkZW50OlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfSURFTlRJRklFUik7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuS2V5d29yZDpcbiAgICAgICAgaWYgKCh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnNsaWNlLnRleHQpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLlB1bmN0dWF0b3I6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4udHlwZS5uYW1lKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnZhbHVlKTtcbiAgfVxuXG4gIGNyZWF0ZUVycm9yKG1lc3NhZ2UsIGFyZykge1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csICgpID0+IGFyZyk7XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKHRoaXMuc3RhcnRJbmRleCwgdGhpcy5zdGFydExpbmUgKyAxLCB0aGlzLnN0YXJ0SW5kZXggLSB0aGlzLnN0YXJ0TGluZVN0YXJ0ICsgMSwgbXNnKTtcbiAgfVxuXG4gIGNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGxvY2F0aW9uLCBtZXNzYWdlLCBhcmcpIHtcbiAgICBsZXQgbXNnID0gbWVzc2FnZS5yZXBsYWNlKC97KFxcZCspfS9nLCAoKSA9PiBhcmcpO1xuICAgIHJldHVybiBuZXcgSnNFcnJvcihsb2NhdGlvbi5vZmZzZXQsIGxvY2F0aW9uLmxpbmUsIGxvY2F0aW9uLmNvbHVtbiArIDEsIG1zZyk7XG4gIH1cblxuICBzdGF0aWMgY3NlMihpZCwgY2gxLCBjaDIpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDI7XG4gIH1cblxuICBzdGF0aWMgY3NlMyhpZCwgY2gxLCBjaDIsIGNoMykge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMztcbiAgfVxuXG4gIHN0YXRpYyBjc2U0KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQ7XG4gIH1cblxuICBzdGF0aWMgY3NlNShpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDU7XG4gIH1cblxuICBzdGF0aWMgY3NlNihpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUsIGNoNikge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSlcbiAgICAgICAgPT09IGNoNSAmJiBpZC5jaGFyQXQoNikgPT09IGNoNjtcbiAgfVxuXG4gIHN0YXRpYyBjc2U3KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSwgY2g2LCBjaDcpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDUgJiYgaWQuY2hhckF0KDYpID09PSBjaDYgJiYgaWQuY2hhckF0KDcpID09PSBjaDc7XG4gIH1cblxuICBzdGF0aWMgZ2V0S2V5d29yZChpZCwgc3RyaWN0KSB7XG4gICAgLy8gXCJjb25zdFwiIGlzIHNwZWNpYWxpemVkIGFzIEtleXdvcmQgaW4gVjguXG4gICAgLy8gXCJ5aWVsZFwiIGFuZCBcImxldFwiIGFyZSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIFNwaWRlck1vbmtleSBhbmQgRVMubmV4dC5cbiAgICAvLyBTb21lIG90aGVycyBhcmUgZnJvbSBmdXR1cmUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSAxIHx8IGlkLmxlbmd0aCA+IDEwKSB7XG4gICAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gICAgfVxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBzd2l0Y2ggKGlkLmxlbmd0aCkge1xuICAgICAgY2FzZSAyOlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgxKSkge1xuICAgICAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSUY7XG4gICAgICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTjtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoaWQuY2hhckF0KDEpID09PSBcIm9cIikge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRPO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm9cIjpcbiAgICAgICAgICAgIGlmIChpZC5jaGFyQXQoMSkgPT09IFwiZlwiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuT0Y7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiYVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5WQVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcIm9cIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRk9SO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJlXCIsIFwid1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5FVztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiclwiLCBcInlcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UUlk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwibFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImVcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEIDogVG9rZW5UeXBlLkxFVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImhcIiwgXCJpXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRISVM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcInJcIiwgXCJ1XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRSVUU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcInVcIiwgXCJsXCIsIFwibFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5VTEw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImxcIiwgXCJzXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVMU0U7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcIm5cIiwgXCJ1XCIsIFwibVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJhXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DQVNFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJvXCIsIFwiaVwiLCBcImRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5WT0lEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIndcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJpXCIsIFwidFwiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5XSVRIO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ3XCI6IC8vIFdISUxFXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiaFwiLCBcImlcIiwgXCJsXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLldISUxFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImJcIjogLy8gQlJFQUtcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJyXCIsIFwiZVwiLCBcImFcIiwgXCJrXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQlJFQUs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZlwiOiAvLyBGQUxTRVxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImFcIiwgXCJsXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GQUxTRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6IC8vIENBVENIXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiYVwiLCBcInRcIiwgXCJjXCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNBVENIO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJvXCIsIFwiblwiLCBcInNcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ09OU1Q7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImxcIiwgXCJhXCIsIFwic1wiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6IC8vIFRIUk9XXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiaFwiLCBcInJcIiwgXCJvXCIsIFwid1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRIUk9XO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInlcIjogLy8gWUlFTERcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJpXCIsIFwiZVwiLCBcImxcIiwgXCJkXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEIDogVG9rZW5UeXBlLklMTEVHQUw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwic1wiOiAvLyBTVVBFUlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcInVcIiwgXCJwXCIsIFwiZVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiclwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcImVcIiwgXCJ0XCIsIFwidVwiLCBcInJcIiwgXCJuXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuUkVUVVJOO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJ5XCIsIFwicFwiLCBcImVcIiwgXCJvXCIsIFwiZlwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRZUEVPRjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwiZVwiLCBcImxcIiwgXCJlXCIsIFwidFwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUxFVEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIndcIiwgXCJpXCIsIFwidFwiLCBcImNcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU1dJVENIO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgVG9rZW5pemVyLmNzZTUoaWQsIFwidFwiLCBcImFcIiwgXCJ0XCIsIFwiaVwiLCBcImNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInhcIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIm1cIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwicFwiOlxuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBUb2tlbml6ZXIuY3NlNShpZCwgXCJ1XCIsIFwiYlwiLCBcImxcIiwgXCJpXCIsIFwiY1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNzpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiZFwiOiAvLyBkZWZhdWx0XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwiZVwiLCBcImZcIiwgXCJhXCIsIFwidVwiLCBcImxcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVGQVVMVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6IC8vIGZpbmFsbHlcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJpXCIsIFwiblwiLCBcImFcIiwgXCJsXCIsIFwibFwiLCBcInlcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GSU5BTExZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjogLy8gZXh0ZW5kc1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcInhcIiwgXCJ0XCIsIFwiZVwiLCBcIm5cIiwgXCJkXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBcIjpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgICAgICAgaWYgKFwicHJpdmF0ZVwiID09PSBzIHx8IFwicGFja2FnZVwiID09PSBzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgODpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcInVcIiwgXCJuXCIsIFwiY1wiLCBcInRcIiwgXCJpXCIsIFwib1wiLCBcIm5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVU5DVElPTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwib1wiLCBcIm5cIiwgXCJ0XCIsIFwiaVwiLCBcIm5cIiwgXCJ1XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNPTlRJTlVFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJlXCIsIFwiYlwiLCBcInVcIiwgXCJnXCIsIFwiZ1wiLCBcImVcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVCVUdHRVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIGlmIChzdHJpY3QgJiYgKGlkLmNoYXJBdCgwKSA9PT0gXCJwXCIgfHwgaWQuY2hhckF0KDApID09PSBcImlcIikpIHtcbiAgICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICAgIGlmIChcInByb3RlY3RlZFwiID09PSBzIHx8IFwiaW50ZXJmYWNlXCIgPT09IHMpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTA6XG4gICAgICB7XG4gICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgIGlmIChcImluc3RhbmNlb2ZcIiA9PT0gcykge1xuICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU5TVEFOQ0VPRjtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgXCJpbXBsZW1lbnRzXCIgPT09IHMpIHtcbiAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gIH1cblxuICBza2lwU2luZ2xlTGluZUNvbW1lbnQob2Zmc2V0KSB7XG4gICAgdGhpcy5pbmRleCArPSBvZmZzZXQ7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAqL1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gMHgwMDBEIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpXG4gICAgICAgICAgICA9PT0gMHgwMDBBIC8qXCJcXG5cIiAqLykge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgIHRoaXMubGluZSsrO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2tpcE11bHRpTGluZUNvbW1lbnQoKSB7XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuc291cmNlLmxlbmd0aDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBsZXQgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChjaENvZGUgPCAweDgwKSB7XG4gICAgICAgIHN3aXRjaCAoY2hDb2RlKSB7XG4gICAgICAgICAgY2FzZSA0MjogIC8vIFwiKlwiXG4gICAgICAgICAgICAvLyBCbG9jayBjb21tZW50IGVuZHMgd2l0aCBcIiovJy5cbiAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIi9cIikge1xuICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gdGhpcy5pbmRleCArIDI7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTA6ICAvLyBcIlxcblwiXG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTM6IC8vIFwiXFxyXCI6XG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5pbmRleCA8IGxlbmd0aCAtIDEgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSAweDIwMjggfHwgY2hDb2RlID09PSAweDIwMjkpIHtcbiAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAgICAgdGhpcy5saW5lKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICB9XG5cblxuICBza2lwQ29tbWVudCgpIHtcbiAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IGZhbHNlO1xuXG4gICAgbGV0IGlzTGluZVN0YXJ0ID0gdGhpcy5pbmRleCA9PT0gMDtcbiAgICBjb25zdCBsZW5ndGggPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoaXNXaGl0ZXNwYWNlKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmIChjaENvZGUgPT09IDEzIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5pbmRleCA8IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lU3RhcnQgPSB0aGlzLmluZGV4O1xuICAgICAgICB0aGlzLmxpbmUrKztcbiAgICAgICAgaXNMaW5lU3RhcnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDQ3IC8qIFwiL1wiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA+PSBsZW5ndGgpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gNDcgLyogXCIvXCIgKi8pIHtcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCgyKTtcbiAgICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSA0MiAvKiBcIipcIiAqLykge1xuICAgICAgICAgIHRoaXMuc2tpcE11bHRpTGluZUNvbW1lbnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc0xpbmVTdGFydCAmJiBjaENvZGUgPT09IDQ1IC8qIFwiLVwiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA+PSBsZW5ndGgpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyBVKzAwM0UgaXMgXCI+J1xuICAgICAgICBpZiAoKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiLVwiKSAmJiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI+XCIpKSB7XG4gICAgICAgICAgLy8gXCItLT5cIiBpcyBhIHNpbmdsZS1saW5lIGNvbW1lbnRcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCgzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDYwIC8qIFwiPFwiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgNCA8PSBsZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCIhXCIgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKVxuICAgICAgICAgICAgPT09IFwiLVwiXG4gICAgICAgICAgICAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpID09PSBcIi1cIikge1xuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzY2FuSGV4RXNjYXBlMigpIHtcbiAgICBpZiAodGhpcy5pbmRleCArIDIgPiB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIxID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKTtcbiAgICBpZiAocjEgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMiA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpO1xuICAgIGlmIChyMiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIHJldHVybiByMSA8PCA0IHwgcjI7XG4gIH1cblxuICBzY2FuVW5pY29kZSgpIHtcbiAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIntcIikge1xuICAgICAgLy9cXHV7SGV4RGlnaXRzfVxuICAgICAgbGV0IGkgPSB0aGlzLmluZGV4ICsgMTtcbiAgICAgIGxldCBoZXhEaWdpdHMgPSAwLCBjaDtcbiAgICAgIHdoaWxlIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KGkpO1xuICAgICAgICBsZXQgaGV4ID0gZ2V0SGV4VmFsdWUoY2gpO1xuICAgICAgICBpZiAoaGV4ID09PSAtMSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGhleERpZ2l0cyA9IChoZXhEaWdpdHMgPDwgNCkgfCBoZXg7XG4gICAgICAgIGlmIChoZXhEaWdpdHMgPiAweDEwRkZGRikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICAgIGlmIChjaCAhPT0gXCJ9XCIpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCA9IGkgKyAxO1xuICAgICAgcmV0dXJuIGhleERpZ2l0cztcbiAgICB9IGVsc2Uge1xuICAgICAgLy9cXHVIZXg0RGlnaXRzXG4gICAgICBpZiAodGhpcy5pbmRleCArIDQgPiB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgbGV0IHIxID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKTtcbiAgICAgIGlmIChyMSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgbGV0IHIyID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSk7XG4gICAgICBpZiAocjIgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGxldCByMyA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikpO1xuICAgICAgaWYgKHIzID09PSAtMSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBsZXQgcjQgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpKTtcbiAgICAgIGlmIChyNCA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCArPSA0O1xuICAgICAgcmV0dXJuIHIxIDw8IDEyIHwgcjIgPDwgOCB8IHIzIDw8IDQgfCByNDtcbiAgICB9XG4gIH1cblxuICBnZXRFc2NhcGVkSWRlbnRpZmllcigpIHtcbiAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgbGV0IGlkID0gXCJcIjtcblxuICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwidVwiKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgbGV0IGljaCA9IHRoaXMuc2NhblVuaWNvZGUoKTtcbiAgICAgIGlmIChpY2ggPCAwIHx8IGljaCA9PT0gMHgwMDVDIC8qIFwiXFxcXFwiICovICB8fCAhaXNJZGVudGlmaWVyU3RhcnQoaWNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpY2gpO1xuICAgIH1cbiAgICBpZCArPSBjaDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSAmJiBjaCAhPT0gXCJcXFxcXCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwidVwiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWNoID0gdGhpcy5zY2FuVW5pY29kZSgpO1xuICAgICAgICBpZiAoaWNoIDwgMCB8fCBpY2ggPT09IDB4MDA1QyAvKiBcIlxcXFxcIiAqLyB8fCAhaXNJZGVudGlmaWVyUGFydChpY2gpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGljaCk7XG4gICAgICB9XG4gICAgICBpZCArPSBjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBnZXRJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIGxldCBsID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5pbmRleDtcbiAgICB3aGlsZSAoaSA8IGwpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdChpKTtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgLy8gR28gYmFjayBhbmQgdHJ5IHRoZSBoYXJkIG9uZS5cbiAgICAgICAgdGhpcy5pbmRleCA9IHN0YXJ0O1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRFc2NhcGVkSWRlbnRpZmllcigpO1xuICAgICAgfSBlbHNlIGlmIChpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmluZGV4ID0gaTtcbiAgICByZXR1cm4gdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIHRoaXMuaW5kZXgpO1xuICB9XG5cbiAgc2NhbklkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIC8vIEJhY2tzbGFzaCAoVSswMDVDKSBzdGFydHMgYW4gZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgbGV0IGlkID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcXFxcIiA/IHRoaXMuZ2V0RXNjYXBlZElkZW50aWZpZXIoKSA6IHRoaXMuZ2V0SWRlbnRpZmllcigpO1xuXG4gICAgLy8gVGhlcmUgaXMgbm8ga2V5d29yZCBvciBsaXRlcmFsIHdpdGggb25seSBvbmUgY2hhcmFjdGVyLlxuICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICBzbGljZS50ZXh0ID0gaWQ7XG5cbiAgICBpZiAoKGlkLmxlbmd0aCA9PT0gMSkpIHtcbiAgICAgIHJldHVybiBuZXcgSWRlbnRpZmllclRva2VuKHNsaWNlKTtcbiAgICB9XG5cbiAgICBsZXQgc3ViVHlwZSA9IFRva2VuaXplci5nZXRLZXl3b3JkKGlkLCB0aGlzLnN0cmljdCk7XG4gICAgaWYgKHN1YlR5cGUgIT09IFRva2VuVHlwZS5JTExFR0FMKSB7XG4gICAgICByZXR1cm4gbmV3IEtleXdvcmRUb2tlbihzdWJUeXBlLCBzbGljZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJZGVudGlmaWVyVG9rZW4oc2xpY2UpO1xuICB9XG5cbiAgZ2V0TG9jYXRpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Tb3VyY2VMb2NhdGlvbih0aGlzLnN0YXJ0SW5kZXgsIHRoaXMuc3RhcnRMaW5lICsgMSwgdGhpcy5zdGFydEluZGV4IC0gdGhpcy5zdGFydExpbmVTdGFydCk7XG4gIH1cblxuICBnZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiB7dGV4dDogdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIHRoaXMuaW5kZXgpLCBzdGFydCwgc3RhcnRMb2NhdGlvbiwgZW5kOiB0aGlzLmluZGV4fTtcbiAgfVxuXG4gIHNjYW5QdW5jdHVhdG9ySGVscGVyKCkge1xuICAgIGxldCBjaDEgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG5cbiAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgLy8gQ2hlY2sgZm9yIG1vc3QgY29tbW9uIHNpbmdsZS1jaGFyYWN0ZXIgcHVuY3R1YXRvcnMuXG4gICAgICBjYXNlIFwiLlwiOlxuICAgICAgICBsZXQgY2gyID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgICAgaWYgKGNoMiAhPT0gXCIuXCIpIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgICBsZXQgY2gzID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKTtcbiAgICAgICAgaWYgKGNoMyAhPT0gXCIuXCIpIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVMTElQU0lTO1xuICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MUEFSRU47XG4gICAgICBjYXNlIFwiKVwiOlxuICAgICAgY2FzZSBcIjtcIjpcbiAgICAgIGNhc2UgXCIsXCI6XG4gICAgICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuTEJSQUNFO1xuICAgICAgY2FzZSBcIn1cIjpcbiAgICAgIGNhc2UgXCJbXCI6XG4gICAgICBjYXNlIFwiXVwiOlxuICAgICAgY2FzZSBcIjpcIjpcbiAgICAgIGNhc2UgXCI/XCI6XG4gICAgICBjYXNlIFwiflwiOlxuICAgICAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBcIj1cIiAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIj1cIikge1xuICAgICAgICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAgICAgICBjYXNlIFwiPVwiOlxuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRX1NUUklDVDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRO1xuICAgICAgICAgICAgY2FzZSBcIiFcIjpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORV9TVFJJQ1Q7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORTtcbiAgICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9PUjtcbiAgICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0FERDtcbiAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NVQjtcbiAgICAgICAgICAgIGNhc2UgXCIqXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX01VTDtcbiAgICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTFRFO1xuICAgICAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5HVEU7XG4gICAgICAgICAgICBjYXNlIFwiL1wiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9ESVY7XG4gICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9NT0Q7XG4gICAgICAgICAgICBjYXNlIFwiXlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfWE9SO1xuICAgICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDtcbiAgICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBicmVhazsgLy9mYWlsZWRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaDIgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgaWYgKGNoMSA9PT0gY2gyKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIGxldCBjaDMgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpO1xuICAgICAgICAgIGlmIChjaDEgPT09IFwiPlwiICYmIGNoMyA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAgIC8vIDQtY2hhcmFjdGVyIHB1bmN0dWF0b3I6ID4+Pj1cbiAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMyA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSFJfVU5TSUdORUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNIUl9VTlNJR05FRDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2gxID09PSBcIjxcIiAmJiBjaDMgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSEw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI+XCIgJiYgY2gzID09PSBcIj1cIikge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hSO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBPdGhlciAyLWNoYXJhY3RlciBwdW5jdHVhdG9yczogKysgLS0gPDwgPj4gJiYgfHxcbiAgICAgICAgc3dpdGNoIChjaDEpIHtcbiAgICAgICAgICBjYXNlIFwiK1wiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTkM7XG4gICAgICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVDO1xuICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNITDtcbiAgICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSFI7XG4gICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQU5EO1xuICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk9SO1xuICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrOyAvL2ZhaWxlZFxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoMSA9PT0gJz0nICYmIGNoMiA9PT0gJz4nKSB7XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuQVJST1c7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICB9XG5cbiAgLy8gNy43IFB1bmN0dWF0b3JzXG4gIHNjYW5QdW5jdHVhdG9yKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IHN1YlR5cGUgPSB0aGlzLnNjYW5QdW5jdHVhdG9ySGVscGVyKCk7XG4gICAgdGhpcy5pbmRleCArPSBzdWJUeXBlLm5hbWUubGVuZ3RoO1xuICAgIHJldHVybiBuZXcgUHVuY3R1YXRvclRva2VuKHN1YlR5cGUsIHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgfVxuXG4gIHNjYW5IZXhMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBsZXQgaGV4ID0gZ2V0SGV4VmFsdWUoY2gpO1xuICAgICAgaWYgKGhleCA9PT0gLTEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPT09IGkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZGV4ID0gaTtcblxuICAgIGxldCBzbGljZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbihzbGljZSwgcGFyc2VJbnQoc2xpY2UudGV4dC5zdWJzdHIoMiksIDE2KSk7XG4gIH1cblxuICBzY2FuQmluYXJ5TGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBvZmZzZXQgPSB0aGlzLmluZGV4IC0gc3RhcnQ7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoICE9PSBcIjBcIiAmJiBjaCAhPT0gXCIxXCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggLSBzdGFydCA8PSBvZmZzZXQpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpKVxuICAgICAgICB8fCBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLCBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKS50ZXh0LnN1YnN0cihvZmZzZXQpLCAyKSwgdHJ1ZSk7XG4gIH1cblxuICBzY2FuT2N0YWxMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKSB7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuaW5kZXggLSBzdGFydDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoIShcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldCA9PT0gMiAmJiB0aGlzLmluZGV4IC0gc3RhcnQgPT09IDIpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpKVxuICAgICAgICB8fCBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pLCBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKS50ZXh0LnN1YnN0cihvZmZzZXQpLCA4KSwgdHJ1ZSk7XG4gIH1cblxuICBzY2FuTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgIC8vIGFzc2VydChjaCA9PT0gXCIuXCIgfHwgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpXG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIGlmIChjaCA9PT0gXCIwXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICBpZiAoY2ggPT09IFwieFwiIHx8IGNoID09PSBcIlhcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuSGV4TGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiYlwiIHx8IGNoID09PSBcIkJcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuQmluYXJ5TGl0ZXJhbChzdGFydCwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwib1wiIHx8IGNoID09PSBcIk9cIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuT2N0YWxMaXRlcmFsKHN0YXJ0LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5PY3RhbExpdGVyYWwoc3RhcnQsIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggIT09IFwiLlwiKSB7XG4gICAgICAvLyBNdXN0IGJlIFwiMScuLic5J1xuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgZSA9IDA7XG4gICAgaWYgKGNoID09PSBcIi5cIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgfVxuXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICBlKys7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRU9GIG5vdCByZWFjaGVkIGhlcmVcbiAgICBpZiAoY2ggPT09IFwiZVwiIHx8IGNoID09PSBcIkVcIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cblxuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBsZXQgbmVnID0gZmFsc2U7XG4gICAgICBpZiAoY2ggPT09IFwiK1wiIHx8IGNoID09PSBcIi1cIikge1xuICAgICAgICBuZWcgPSBjaCA9PT0gXCItXCI7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBsZXQgZiA9IDA7XG4gICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgICAgZiAqPSAxMDtcbiAgICAgICAgICBmICs9ICtjaDtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIGUgKz0gbmVnID8gZiA6IC1mO1xuICAgIH1cblxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQsIHN0YXJ0TG9jYXRpb24pKTtcbiAgfVxuXG4gIC8vIDcuOC40IFN0cmluZyBMaXRlcmFsc1xuICBzY2FuU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcblxuICAgIGxldCBxdW90ZSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAvLyAgYXNzZXJ0KChxdW90ZSA9PT0gXCJcXFwiXCIgfHwgcXVvdGUgPT09IFwiXCJcIiksIFwiU3RyaW5nIGxpdGVyYWwgbXVzdCBzdGFydHMgd2l0aCBhIHF1b3RlXCIpXG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXgrKztcblxuICAgIGxldCBvY3RhbCA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IHF1b3RlKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCwgc3RhcnRMb2NhdGlvbiksIHN0ciwgb2N0YWwpO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIGlmICghaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcblwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFxyXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXHRcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgICAgICBjYXNlIFwieFwiOlxuICAgICAgICAgICAgICBsZXQgcmVzdG9yZSA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICAgIGxldCB1bmVzY2FwZWQ7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdW5lc2NhcGVkID0gY2ggPT09IFwidVwiID8gdGhpcy5zY2FuVW5pY29kZSgpIDogdGhpcy5zY2FuSGV4RXNjYXBlMigpO1xuICAgICAgICAgICAgICBpZiAodW5lc2NhcGVkID49IDApIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1bmVzY2FwZWQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYlwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXGJcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcZlwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFx1MDAwQlwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICAgICAgb2N0YWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGxldCBvY3RMZW4gPSAxO1xuICAgICAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAgICAgLy8gd2l0aCAwLCAxLCAyLCAzXG4gICAgICAgICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiM1wiKSB7XG4gICAgICAgICAgICAgICAgICBvY3RMZW4gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgY29kZSA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG9jdExlbiA8IDMgJiYgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgICAgICAgICAgIGNvZGUgKj0gODtcbiAgICAgICAgICAgICAgICAgIG9jdExlbisrO1xuICAgICAgICAgICAgICAgICAgY29kZSArPSBjaCAtIFwiMFwiO1xuICAgICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKGNoID09PSBcIlxcclwiICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgdGhpcy5saW5lKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICB9XG5cbiAgc2NhblJlZ0V4cChzdHIpIHtcblxuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICBsZXQgdGVybWluYXRlZCA9IGZhbHNlO1xuICAgIGxldCBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2xhc3NNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiXVwiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiW1wiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGVybWluYXRlZCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpICYmIGNoICE9PSBcIlxcXFxcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIHN0ciArPSBjaDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0LCBzdGFydExvY2F0aW9uKSwgc3RyKTtcbiAgfVxuXG4gIGFkdmFuY2UoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmxhc3RJbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5sYXN0TGluZSA9IHRoaXMubGluZTtcbiAgICB0aGlzLmxhc3RMaW5lU3RhcnQgPSB0aGlzLmxpbmVTdGFydDtcblxuICAgIHRoaXMuc2tpcENvbW1lbnQoKTtcblxuICAgIHRoaXMuc3RhcnRJbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5zdGFydExpbmUgPSB0aGlzLmxpbmU7XG4gICAgdGhpcy5zdGFydExpbmVTdGFydCA9IHRoaXMubGluZVN0YXJ0O1xuXG4gICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbmV3IEVPRlRva2VuKHRoaXMuZ2V0U2xpY2UodGhpcy5pbmRleCwgc3RhcnRMb2NhdGlvbikpO1xuICAgIH1cblxuICAgIGxldCBjaGFyQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG5cbiAgICBpZiAoY2hhckNvZGUgPCAweDgwKSB7XG4gICAgICBpZiAoUFVOQ1RVQVRPUl9TVEFSVFtjaGFyQ29kZV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKElERU5USUZJRVJfU1RBUlRbY2hhckNvZGVdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9sZXQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDAwMkUpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzRGVjaW1hbERpZ2l0KHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RyaW5nIGxpdGVyYWwgc3RhcnRzIHdpdGggc2luZ2xlIHF1b3RlIChVKzAwMjcpIG9yIGRvdWJsZSBxdW90ZSAoVSswMDIyKS5cbiAgICAgIGlmIChjaGFyQ29kZSA9PT0gMHgwMDI3IHx8IGNoYXJDb2RlID09PSAweDAwMjIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKDB4MDAzMCAvKiAnMCcgKi8gPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHgwMDM5IC8qICc5JyAqLykge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2xhc2ggKC8pIFUrMDAyRiBjYW4gYWxzbyBzdGFydCBhIHJlZ2V4LlxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaGFyQ29kZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbklkZW50aWZpZXIoKTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuICB9XG5cbiAgZW9mKCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRU9TO1xuICB9XG5cbiAgbGV4KCkge1xuICAgIHRoaXMucHJldlRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICB0aGlzLnRva2VuSW5kZXgrKztcbiAgICByZXR1cm4gdGhpcy5wcmV2VG9rZW47XG4gIH1cbn1cbiJdfQ==