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
var TokenClass = exports.TokenClass = {
  BooleanLiteral: { name: "Boolean" },
  Eof: { name: "<End>" },
  Ident: { name: "Identifier" },
  Keyword: { name: "Keyword" },
  NullLiteral: { name: "Null" },
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
  NULL_LITERAL: { klass: TokenClass.NullLiteral, name: "null" },
  TRUE_LITERAL: { klass: TokenClass.BooleanLiteral, name: "true" },
  FALSE_LITERAL: { klass: TokenClass.BooleanLiteral, name: "false" },
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
var NullLiteralToken = exports.NullLiteralToken = (function (IdentifierLikeToken) {
  function NullLiteralToken(slice) {
    _classCallCheck(this, NullLiteralToken);

    _get(Object.getPrototypeOf(NullLiteralToken.prototype), "constructor", this).call(this, TokenType.NULL_LITERAL, slice);
  }

  _inherits(NullLiteralToken, IdentifierLikeToken);

  return NullLiteralToken;
})(IdentifierLikeToken);
var TrueLiteralToken = exports.TrueLiteralToken = (function (IdentifierLikeToken) {
  function TrueLiteralToken(slice) {
    _classCallCheck(this, TrueLiteralToken);

    _get(Object.getPrototypeOf(TrueLiteralToken.prototype), "constructor", this).call(this, TokenType.TRUE_LITERAL, slice);
  }

  _inherits(TrueLiteralToken, IdentifierLikeToken);

  return TrueLiteralToken;
})(IdentifierLikeToken);
var FalseLiteralToken = exports.FalseLiteralToken = (function (IdentifierLikeToken) {
  function FalseLiteralToken(slice) {
    _classCallCheck(this, FalseLiteralToken);

    _get(Object.getPrototypeOf(FalseLiteralToken.prototype), "constructor", this).call(this, TokenType.FALSE_LITERAL, slice);
  }

  _inherits(FalseLiteralToken, IdentifierLikeToken);

  return FalseLiteralToken;
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
    this.lineStarts = [0];
    this.lookaheadStart = 0;
    this.lookahead = this.advance();
    this.lookaheadEnd = this.index;
    this.index = 0;
    this.strict = false;
    this.hasLineTerminatorBeforeNext = false;
    this.prevToken = null;
    this.tokenIndex = 0;
    this.lineStarts = [0];
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
    trackBackLineNumber: {
      value: function trackBackLineNumber(position) {
        for (var line = this.lineStarts.length - 1; line >= 0; line--) {
          if (position >= this.getLineStart(line)) {
            return line;
          }
        }
        return 0;
      },
      writable: true,
      configurable: true
    },
    createILLEGAL: {
      value: function createILLEGAL() {
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
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.value || token.type.name);
      },
      writable: true,
      configurable: true
    },
    createError: {
      value: function createError(message, arg) {
        var msg = message.replace(/{(\d+)}/g, function () {
          return arg;
        });
        var index = this.index;
        var line = this.trackBackLineNumber(index);
        return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
      },
      writable: true,
      configurable: true
    },
    createErrorWithToken: {
      value: function createErrorWithToken(token, message, arg) {
        var msg = message.replace(/{(\d+)}/g, function () {
          return arg;
        });
        var index = token.slice.start;
        var line = this.trackBackLineNumber(index);
        return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
      },
      writable: true,
      configurable: true
    },
    getLineStart: {
      value: function getLineStart(line) {
        return this.lineStarts[line];
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
            this.lineStarts.push(this.index);
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
        var i = this.index;
        while (i < length) {
          var chCode = this.source.charCodeAt(i);
          if (chCode < 128) {
            switch (chCode) {
              case 42:
                // "*"
                // Block comment ends with "*/'.
                if (i + 1 < length && this.source.charAt(i + 1) === "/") {
                  this.index = i + 2;
                  return;
                }
                i++;
                break;
              case 10:
                // "\n"
                this.hasLineTerminatorBeforeNext = true;
                i++;
                this.lineStarts.push(this.index);
                break;
              case 12:
                // "\r":
                this.hasLineTerminatorBeforeNext = true;
                if (i < length - 1 && this.source.charAt(i + 1) === "\n") {
                  i++;
                }
                i++;
                this.lineStarts.push(this.index);
                break;
              default:
                i++;
            }
          } else if (chCode === 8232 || chCode === 8233) {
            i++;
            this.lineStarts.push(this.index);
          } else {
            i++;
          }
        }
        this.index = i;
        throw this.createILLEGAL();
      },
      writable: true,
      configurable: true
    },
    skipComment: {
      value: function skipComment() {
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
            this.lineStarts.push(this.index);
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
    scanHexEscape4: {
      value: function scanHexEscape4() {
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
          var ich = this.scanHexEscape4();
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
            var ich = this.scanHexEscape4();
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
        var start = this.index;

        // Backslash (U+005C) starts an escaped character.
        var id = this.source.charAt(this.index) === "\\" ? this.getEscapedIdentifier() : this.getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        var slice = { text: id, start: start, end: this.index };
        if (id.length === 1) {
          return new IdentifierToken(slice);
        }

        var subType = Tokenizer.getKeyword(id, this.strict);
        if (subType !== TokenType.ILLEGAL) {
          return new KeywordToken(subType, slice);
        }

        if (id.length === 4) {
          if ("null" === id) {
            return new NullLiteralToken(slice);
          } else if ("true" === id) {
            return new TrueLiteralToken(slice);
          }
        }

        if (id.length === 5 && "false" === id) {
          return new FalseLiteralToken(slice);
        }

        return new IdentifierToken(slice);
      },
      writable: true,
      configurable: true
    },
    getSlice: {
      value: function getSlice(start) {
        return { text: this.source.slice(start, this.index), start: start, end: this.index };
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
              default:
                break; //failed
            }
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
        var start = this.index;
        var subType = this.scanPunctuatorHelper();
        this.index += subType.name.length;
        return new PunctuatorToken(subType, this.getSlice(start));
      },
      writable: true,
      configurable: true
    },
    scanHexLiteral: {
      value: function scanHexLiteral(start) {
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

        var slice = this.getSlice(start);
        return new NumericLiteralToken(slice, parseInt(slice.text.substr(2), 16));
      },
      writable: true,
      configurable: true
    },
    scanBinaryLiteral: {
      value: function scanBinaryLiteral(start) {
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

        return new NumericLiteralToken(this.getSlice(start), parseInt(this.getSlice(start).text.substr(offset), 2), true);
      },
      writable: true,
      configurable: true
    },
    scanOctalLiteral: {
      value: function scanOctalLiteral(start) {
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

        return new NumericLiteralToken(this.getSlice(start), parseInt(this.getSlice(start).text.substr(offset), 8), true);
      },
      writable: true,
      configurable: true
    },
    scanNumericLiteral: {
      value: function scanNumericLiteral() {
        var ch = this.source.charAt(this.index);
        // assert(ch === "." || "0" <= ch && ch <= "9")
        var start = this.index;

        if (ch === "0") {
          this.index++;
          if (this.index < this.source.length) {
            ch = this.source.charAt(this.index);
            if (ch === "x" || ch === "X") {
              this.index++;
              return this.scanHexLiteral(start);
            } else if (ch === "b" || ch === "B") {
              this.index++;
              return this.scanBinaryLiteral(start);
            } else if (ch === "o" || ch === "O") {
              this.index++;
              return this.scanOctalLiteral(start);
            } else if ("0" <= ch && ch <= "9") {
              return this.scanOctalLiteral(start);
            }
          } else {
            return new NumericLiteralToken(this.getSlice(start));
          }
        } else if (ch !== ".") {
          // Must be "1'..'9'
          ch = this.source.charAt(this.index);
          while ("0" <= ch && ch <= "9") {
            this.index++;
            if (this.index === this.source.length) {
              return new NumericLiteralToken(this.getSlice(start));
            }
            ch = this.source.charAt(this.index);
          }
        }

        var e = 0;
        if (ch === ".") {
          this.index++;
          if (this.index === this.source.length) {
            return new NumericLiteralToken(this.getSlice(start));
          }

          ch = this.source.charAt(this.index);
          while ("0" <= ch && ch <= "9") {
            e++;
            this.index++;
            if (this.index === this.source.length) {
              return new NumericLiteralToken(this.getSlice(start));
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

        return new NumericLiteralToken(this.getSlice(start));
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

        var start = this.index;
        this.index++;

        var octal = false;
        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (ch === quote) {
            this.index++;
            return new StringLiteralToken(this.getSlice(start), str, octal);
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
                  unescaped = ch === "u" ? this.scanHexEscape4() : this.scanHexEscape2();
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
      value: function scanRegExp() {
        var start = this.index;
        // ch = this.source.charAt(this.index)

        var str = "";
        str += "/";
        this.index++;

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
        this.lookaheadEnd = this.index;
        return new RegularExpressionLiteralToken(this.getSlice(start), str);
      },
      writable: true,
      configurable: true
    },
    advance: {
      value: function advance() {
        var start = this.index;
        this.skipComment();
        this.lastWhitespace = this.getSlice(start);
        this.lookaheadStart = start = this.index;

        if (this.index >= this.source.length) {
          return new EOFToken(this.getSlice(start));
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
        if (this.prevToken !== null && this.prevToken.type === TokenType.EOS) {
          return this.prevToken;
        }
        this.prevToken = this.lookahead;
        var start = this.index = this.lookaheadEnd;
        this.hasLineTerminatorBeforeNext = false;
        this.lookahead = this.advance();
        this.lookaheadEnd = this.index;
        this.index = start;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQWlCK0csU0FBUzs7SUFBaEgsV0FBVyxVQUFYLFdBQVc7SUFBRSxnQkFBZ0IsVUFBaEIsZ0JBQWdCO0lBQUUsWUFBWSxVQUFaLFlBQVk7SUFBRSxpQkFBaUIsVUFBakIsaUJBQWlCO0lBQUUsZ0JBQWdCLFVBQWhCLGdCQUFnQjtJQUFFLGNBQWMsVUFBZCxjQUFjO0lBQ2hHLGFBQWEsV0FBTyxVQUFVLEVBQTlCLGFBQWE7QUFFZCxJQUFNLFVBQVUsV0FBVixVQUFVLEdBQUc7QUFDeEIsZ0JBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDakMsS0FBRyxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNwQixPQUFLLEVBQUUsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQzNCLFNBQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDMUIsYUFBVyxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMzQixnQkFBYyxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNqQyxZQUFVLEVBQUUsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQ2hDLGVBQWEsRUFBRSxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDL0IsbUJBQWlCLEVBQUUsRUFBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUM7QUFDOUMsYUFBVyxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMzQixjQUFZLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQzdCLFNBQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7Q0FDM0IsQ0FBQzs7QUFFSyxJQUFNLFNBQVMsV0FBVCxTQUFTLEdBQUc7QUFDdkIsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN6QyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2hELFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDcEQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3JELGFBQVcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDdEQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsZUFBYSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN6RCxnQkFBYyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMxRCxnQkFBYyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMxRCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3ZELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdkQscUJBQW1CLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQ2pFLFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2hELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsY0FBWSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN6RCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdEQsV0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN0RCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzdDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDN0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUM7QUFDM0QsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxjQUFZLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQzNELGNBQVksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDOUQsZUFBYSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNoRSxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3ZELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDL0Msc0JBQW9CLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQzNELDZCQUEyQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztBQUNsRSxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztDQUMvQyxDQUFDOztBQUVGLElBQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQztBQUNyQixJQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQ3JCLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNoQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRWYsSUFBTSxtQkFBbUIsR0FBRyxDQUMxQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNsSCxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNySCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3BILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRXRGLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUVuQyxJQUFNLGdCQUFnQixHQUFHLENBQ3ZCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFFdEIsS0FBSyxXQUFMLEtBQUs7QUFDTCxXQURBLEtBQUssQ0FDSixJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUs7MEJBRG5CLEtBQUs7O0FBRWQsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDakIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDbkIsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7R0FDcEI7O3VC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QUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQzNHLEdBQUcsQ0FBQztPQUNiOzs7O0FBRU0sUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQzVDLGVBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FDM0csR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO09BQ3JDOzs7O0FBRU0sUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUNqRCxlQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQzNHLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFD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Q2xCLGVBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztPQUN2Qjs7Ozs7O1NBMW5DRyxTQUFTOzs7cUJBQVQsU0FBUyIsImZpbGUiOiJzcmMvdG9rZW5pemVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblxuaW1wb3J0IHtnZXRIZXhWYWx1ZSwgaXNMaW5lVGVybWluYXRvciwgaXNXaGl0ZXNwYWNlLCBpc0lkZW50aWZpZXJTdGFydCwgaXNJZGVudGlmaWVyUGFydCwgaXNEZWNpbWFsRGlnaXR9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQge0Vycm9yTWVzc2FnZXN9IGZyb20gXCIuL2Vycm9yc1wiO1xuXG5leHBvcnQgY29uc3QgVG9rZW5DbGFzcyA9IHtcbiAgQm9vbGVhbkxpdGVyYWw6IHtuYW1lOiBcIkJvb2xlYW5cIn0sXG4gIEVvZjoge25hbWU6IFwiPEVuZD5cIn0sXG4gIElkZW50OiB7bmFtZTogXCJJZGVudGlmaWVyXCJ9LFxuICBLZXl3b3JkOiB7bmFtZTogXCJLZXl3b3JkXCJ9LFxuICBOdWxsTGl0ZXJhbDoge25hbWU6IFwiTnVsbFwifSxcbiAgTnVtZXJpY0xpdGVyYWw6IHtuYW1lOiBcIk51bWVyaWNcIn0sXG4gIFB1bmN0dWF0b3I6IHtuYW1lOiBcIlB1bmN0dWF0b3JcIn0sXG4gIFN0cmluZ0xpdGVyYWw6IHtuYW1lOiBcIlN0cmluZ1wifSxcbiAgUmVndWxhckV4cHJlc3Npb246IHtuYW1lOiBcIlJlZ3VsYXJFeHByZXNzaW9uXCJ9LFxuICBMaW5lQ29tbWVudDoge25hbWU6IFwiTGluZVwifSxcbiAgQmxvY2tDb21tZW50OiB7bmFtZTogXCJCbG9ja1wifSxcbiAgSWxsZWdhbDoge25hbWU6IFwiSWxsZWdhbFwifVxufTtcblxuZXhwb3J0IGNvbnN0IFRva2VuVHlwZSA9IHtcbiAgRU9TOiB7a2xhc3M6IFRva2VuQ2xhc3MuRW9mLCBuYW1lOiBcIkVPU1wifSxcbiAgTFBBUkVOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIoXCJ9LFxuICBSUEFSRU46IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIilcIn0sXG4gIExCUkFDSzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiW1wifSxcbiAgUkJSQUNLOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJdXCJ9LFxuICBMQlJBQ0U6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIntcIn0sXG4gIFJCUkFDRToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifVwifSxcbiAgQ09MT046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjpcIn0sXG4gIFNFTUlDT0xPTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiO1wifSxcbiAgUEVSSU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIuXCJ9LFxuICBFTExJUFNJUzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLi4uXCJ9LFxuICBDT05ESVRJT05BTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiP1wifSxcbiAgSU5DOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrK1wifSxcbiAgREVDOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItLVwifSxcbiAgQVNTSUdOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9XCJ9LFxuICBBU1NJR05fQklUX09SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8PVwifSxcbiAgQVNTSUdOX0JJVF9YT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl49XCJ9LFxuICBBU1NJR05fQklUX0FORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJj1cIn0sXG4gIEFTU0lHTl9TSEw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw8PVwifSxcbiAgQVNTSUdOX1NIUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj49XCJ9LFxuICBBU1NJR05fU0hSX1VOU0lHTkVEOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj49XCJ9LFxuICBBU1NJR05fQUREOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrPVwifSxcbiAgQVNTSUdOX1NVQjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLT1cIn0sXG4gIEFTU0lHTl9NVUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIio9XCJ9LFxuICBBU1NJR05fRElWOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIvPVwifSxcbiAgQVNTSUdOX01PRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJT1cIn0sXG4gIENPTU1BOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIsXCJ9LFxuICBPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifHxcIn0sXG4gIEFORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJiZcIn0sXG4gIEJJVF9PUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifFwifSxcbiAgQklUX1hPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXlwifSxcbiAgQklUX0FORDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJlwifSxcbiAgU0hMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PFwifSxcbiAgU0hSOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+PlwifSxcbiAgU0hSX1VOU0lHTkVEOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj5cIn0sXG4gIEFERDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiK1wifSxcbiAgU1VCOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItXCJ9LFxuICBNVUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIipcIn0sXG4gIERJVjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiL1wifSxcbiAgTU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIlXCJ9LFxuICBFUToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPT1cIn0sXG4gIE5FOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIhPVwifSxcbiAgRVFfU1RSSUNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9PT1cIn0sXG4gIE5FX1NUUklDVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIT09XCJ9LFxuICBMVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPFwifSxcbiAgR1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj5cIn0sXG4gIExURToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPD1cIn0sXG4gIEdURToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj1cIn0sXG4gIElOU1RBTkNFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImluc3RhbmNlb2ZcIn0sXG4gIElOOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpblwifSxcbiAgT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm9mXCJ9LFxuICBOT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiFcIn0sXG4gIEJJVF9OT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn5cIn0sXG4gIERFTEVURToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVsZXRlXCJ9LFxuICBUWVBFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInR5cGVvZlwifSxcbiAgVk9JRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidm9pZFwifSxcbiAgQlJFQUs6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImJyZWFrXCJ9LFxuICBDQVNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXNlXCJ9LFxuICBDQVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2F0Y2hcIn0sXG4gIENPTlRJTlVFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb250aW51ZVwifSxcbiAgREVCVUdHRVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlYnVnZ2VyXCJ9LFxuICBERUZBVUxUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkZWZhdWx0XCJ9LFxuICBETzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZG9cIn0sXG4gIEVMU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImVsc2VcIn0sXG4gIEZJTkFMTFk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZpbmFsbHlcIn0sXG4gIEZPUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZm9yXCJ9LFxuICBGVU5DVElPTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZnVuY3Rpb25cIn0sXG4gIElGOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpZlwifSxcbiAgTkVXOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJuZXdcIn0sXG4gIFJFVFVSTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwicmV0dXJuXCJ9LFxuICBTV0lUQ0g6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInN3aXRjaFwifSxcbiAgVEhJUzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidGhpc1wifSxcbiAgVEhST1c6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRocm93XCJ9LFxuICBUUlk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRyeVwifSxcbiAgVkFSOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ2YXJcIn0sXG4gIFdISUxFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ3aGlsZVwifSxcbiAgV0lUSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwid2l0aFwifSxcbiAgTlVMTF9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuTnVsbExpdGVyYWwsIG5hbWU6IFwibnVsbFwifSxcbiAgVFJVRV9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuQm9vbGVhbkxpdGVyYWwsIG5hbWU6IFwidHJ1ZVwifSxcbiAgRkFMU0VfTElURVJBTDoge2tsYXNzOiBUb2tlbkNsYXNzLkJvb2xlYW5MaXRlcmFsLCBuYW1lOiBcImZhbHNlXCJ9LFxuICBOVU1CRVI6IHtrbGFzczogVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFNUUklORzoge2tsYXNzOiBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWwsIG5hbWU6IFwiXCJ9LFxuICBSRUdFWFA6IHtrbGFzczogVG9rZW5DbGFzcy5SZWd1bGFyRXhwcmVzc2lvbiwgbmFtZTogXCJcIn0sXG4gIElERU5USUZJRVI6IHtrbGFzczogVG9rZW5DbGFzcy5JZGVudCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9SRVNFUlZFRF9XT1JEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiXCJ9LFxuICBDT05TVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY29uc3RcIn0sXG4gIExFVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwibGV0XCJ9LFxuICBJTExFR0FMOiB7a2xhc3M6IFRva2VuQ2xhc3MuSWxsZWdhbCwgbmFtZTogXCJcIn1cbn07XG5cbmNvbnN0IFRUID0gVG9rZW5UeXBlO1xuY29uc3QgSSA9IFRULklMTEVHQUw7XG5jb25zdCBGID0gZmFsc2U7XG5jb25zdCBUID0gdHJ1ZTtcblxuY29uc3QgT05FX0NIQVJfUFVOQ1RVQVRPUiA9IFtcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTk9ULCBJLCBJLCBJLFxuICBUVC5NT0QsIFRULkJJVF9BTkQsIEksIFRULkxQQVJFTiwgVFQuUlBBUkVOLCBUVC5NVUwsIFRULkFERCwgVFQuQ09NTUEsIFRULlNVQiwgVFQuUEVSSU9ELCBUVC5ESVYsIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIFRULkNPTE9OLCBUVC5TRU1JQ09MT04sIFRULkxULCBUVC5BU1NJR04sIFRULkdULCBUVC5DT05ESVRJT05BTCwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNLLCBJLCBUVC5SQlJBQ0ssIFRULkJJVF9YT1IsIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIFRULkxCUkFDRSwgVFQuQklUX09SLCBUVC5SQlJBQ0UsIFRULkJJVF9OT1RdO1xuXG5jb25zdCBQVU5DVFVBVE9SX1NUQVJUID0gW1xuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBGLCBGLCBULCBULFxuICBGLCBULCBULCBULCBULCBULCBULCBGLCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBGXTtcblxuY29uc3QgSURFTlRJRklFUl9TVEFSVCA9IFtcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgRiwgRixcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCxcbiAgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgRiwgVCwgRiwgRiwgVCwgRiwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCxcbiAgVCwgVCwgVCwgVCwgVCwgVCwgRiwgRiwgRiwgRiwgRl07XG5cbmV4cG9ydCBjbGFzcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlLCBvY3RhbCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5zbGljZSA9IHNsaWNlO1xuICAgIHRoaXMub2N0YWwgPSBvY3RhbDtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpZmllckxpa2VUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnNsaWNlLnRleHQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIElkZW50aWZpZXJUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5JREVOVElGSUVSLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bGxMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuTlVMTF9MSVRFUkFMLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRydWVMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuVFJVRV9MSVRFUkFMLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZhbHNlTGl0ZXJhbFRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkZBTFNFX0xJVEVSQUwsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5d29yZFRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQdW5jdHVhdG9yVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlLm5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuUkVHRVhQLCBzbGljZSwgZmFsc2UpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUgPSArc2xpY2UudGV4dCwgb2N0YWwgPSBmYWxzZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5OVU1CRVIsIHNsaWNlLCBvY3RhbCk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUsIG9jdGFsKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLlNUUklORywgc2xpY2UsIG9jdGFsKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRU9GVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkVPUywgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSnNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoaW5kZXgsIGxpbmUsIGNvbHVtbiwgbXNnKSB7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IG1zZztcbiAgICB0aGlzLm1lc3NhZ2UgPSBgWyR7bGluZX06JHtjb2x1bW59XTogJHttc2d9YDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdFxuY2xhc3MgVG9rZW5pemVyIHtcbiAgY29uc3RydWN0b3Ioc291cmNlKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgdGhpcy5pbmRleCA9IDA7XG4gICAgdGhpcy5saW5lU3RhcnRzID0gWzBdO1xuICAgIHRoaXMubG9va2FoZWFkU3RhcnQgPSAwO1xuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG4gICAgdGhpcy5sb29rYWhlYWRFbmQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIHRoaXMuc3RyaWN0ID0gZmFsc2U7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLnByZXZUb2tlbiA9IG51bGw7XG4gICAgdGhpcy50b2tlbkluZGV4ID0gMDtcbiAgICB0aGlzLmxpbmVTdGFydHMgPSBbMF07XG4gIH1cblxuICB0cmFja0JhY2tMaW5lTnVtYmVyKHBvc2l0aW9uKSB7XG4gICAgZm9yIChsZXQgbGluZSA9IHRoaXMubGluZVN0YXJ0cy5sZW5ndGggLSAxOyBsaW5lID49IDA7IGxpbmUtLSkge1xuICAgICAgaWYgKChwb3NpdGlvbiA+PSB0aGlzLmdldExpbmVTdGFydChsaW5lKSkpIHtcbiAgICAgICAgcmV0dXJuIGxpbmU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgY3JlYXRlSUxMRUdBTCgpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfSUxMRUdBTF9UT0tFTik7XG4gIH1cblxuICBjcmVhdGVVbmV4cGVjdGVkKHRva2VuKSB7XG4gICAgc3dpdGNoICh0b2tlbi50eXBlLmtsYXNzKSB7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuRW9mOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfRU9TKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX05VTUJFUik7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuU3RyaW5nTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NUUklORyk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuSWRlbnQ6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9JREVOVElGSUVSKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5LZXl3b3JkOlxuICAgICAgICBpZiAoKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfUkVTRVJWRURfV09SRCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4uc2xpY2UudGV4dCk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuUHVuY3R1YXRvcjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi50eXBlLm5hbWUpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4udmFsdWUgfHwgdG9rZW4udHlwZS5uYW1lKTtcbiAgfVxuXG4gIGNyZWF0ZUVycm9yKG1lc3NhZ2UsIGFyZykge1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csICgpID0+IGFyZyk7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5pbmRleDtcbiAgICBsZXQgbGluZSA9IHRoaXMudHJhY2tCYWNrTGluZU51bWJlcihpbmRleCk7XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKGluZGV4LCBsaW5lICsgMSwgaW5kZXggLSB0aGlzLmdldExpbmVTdGFydChsaW5lKSArIDEsIG1zZyk7XG4gIH1cblxuICBjcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgbWVzc2FnZSwgYXJnKSB7XG4gICAgbGV0IG1zZyA9IG1lc3NhZ2UucmVwbGFjZSgveyhcXGQrKX0vZywgKCkgPT4gYXJnKTtcbiAgICBsZXQgaW5kZXggPSB0b2tlbi5zbGljZS5zdGFydDtcbiAgICBsZXQgbGluZSA9IHRoaXMudHJhY2tCYWNrTGluZU51bWJlcihpbmRleCk7XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKGluZGV4LCBsaW5lICsgMSwgaW5kZXggLSB0aGlzLmdldExpbmVTdGFydChsaW5lKSArIDEsIG1zZyk7XG4gIH1cblxuICBnZXRMaW5lU3RhcnQobGluZSkge1xuICAgIHJldHVybiB0aGlzLmxpbmVTdGFydHNbbGluZV07XG4gIH1cblxuICBzdGF0aWMgY3NlMihpZCwgY2gxLCBjaDIpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDI7XG4gIH1cblxuICBzdGF0aWMgY3NlMyhpZCwgY2gxLCBjaDIsIGNoMykge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMztcbiAgfVxuXG4gIHN0YXRpYyBjc2U0KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQ7XG4gIH1cblxuICBzdGF0aWMgY3NlNShpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDU7XG4gIH1cblxuICBzdGF0aWMgY3NlNihpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUsIGNoNikge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSlcbiAgICAgICAgPT09IGNoNSAmJiBpZC5jaGFyQXQoNikgPT09IGNoNjtcbiAgfVxuXG4gIHN0YXRpYyBjc2U3KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSwgY2g2LCBjaDcpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDUgJiYgaWQuY2hhckF0KDYpID09PSBjaDYgJiYgaWQuY2hhckF0KDcpID09PSBjaDc7XG4gIH1cblxuICBzdGF0aWMgZ2V0S2V5d29yZChpZCwgc3RyaWN0KSB7XG4gICAgLy8gXCJjb25zdFwiIGlzIHNwZWNpYWxpemVkIGFzIEtleXdvcmQgaW4gVjguXG4gICAgLy8gXCJ5aWVsZFwiIGFuZCBcImxldFwiIGFyZSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIFNwaWRlck1vbmtleSBhbmQgRVMubmV4dC5cbiAgICAvLyBTb21lIG90aGVycyBhcmUgZnJvbSBmdXR1cmUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSAxIHx8IGlkLmxlbmd0aCA+IDEwKSB7XG4gICAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gICAgfVxuICAgIHN3aXRjaCAoaWQubGVuZ3RoKSB7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImlcIjpcbiAgICAgICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDEpKSB7XG4gICAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JRjtcbiAgICAgICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChpZC5jaGFyQXQoMSkgPT09IFwib1wiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRE87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwib1wiOlxuICAgICAgICAgICAgaWYgKGlkLmNoYXJBdCgxKSA9PT0gXCJmXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5PRjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJhXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlZBUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwib1wiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GT1I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImVcIiwgXCJ3XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTkVXO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJyXCIsIFwieVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRSWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJsXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiZVwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQgOiBUb2tlblR5cGUuTEVUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiaFwiLCBcImlcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVEhJUztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwibFwiLCBcInNcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRUxTRTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiblwiLCBcInVcIiwgXCJtXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImFcIiwgXCJzXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNBU0U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcIm9cIiwgXCJpXCIsIFwiZFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlZPSUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwid1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImlcIiwgXCJ0XCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLldJVEg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcIndcIjogLy8gV0hJTEVcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiaVwiLCBcImxcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuV0hJTEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiYlwiOiAvLyBCUkVBS1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcInJcIiwgXCJlXCIsIFwiYVwiLCBcImtcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5CUkVBSztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6IC8vIENBVENIXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiYVwiLCBcInRcIiwgXCJjXCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNBVENIO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJvXCIsIFwiblwiLCBcInNcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ09OU1Q7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImxcIiwgXCJhXCIsIFwic1wiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6IC8vIFRIUk9XXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiaFwiLCBcInJcIiwgXCJvXCIsIFwid1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRIUk9XO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInlcIjogLy8gWUlFTERcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJpXCIsIFwiZVwiLCBcImxcIiwgXCJkXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEIDogVG9rZW5UeXBlLklMTEVHQUw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwic1wiOiAvLyBTVVBFUlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcInVcIiwgXCJwXCIsIFwiZVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiclwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcImVcIiwgXCJ0XCIsIFwidVwiLCBcInJcIiwgXCJuXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuUkVUVVJOO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJ5XCIsIFwicFwiLCBcImVcIiwgXCJvXCIsIFwiZlwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRZUEVPRjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwiZVwiLCBcImxcIiwgXCJlXCIsIFwidFwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUxFVEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIndcIiwgXCJpXCIsIFwidFwiLCBcImNcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU1dJVENIO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgVG9rZW5pemVyLmNzZTUoaWQsIFwidFwiLCBcImFcIiwgXCJ0XCIsIFwiaVwiLCBcImNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInhcIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIm1cIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwicFwiOlxuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBUb2tlbml6ZXIuY3NlNShpZCwgXCJ1XCIsIFwiYlwiLCBcImxcIiwgXCJpXCIsIFwiY1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNzpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiZFwiOiAvLyBkZWZhdWx0XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwiZVwiLCBcImZcIiwgXCJhXCIsIFwidVwiLCBcImxcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVGQVVMVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6IC8vIGZpbmFsbHlcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJpXCIsIFwiblwiLCBcImFcIiwgXCJsXCIsIFwibFwiLCBcInlcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GSU5BTExZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjogLy8gZXh0ZW5kc1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcInhcIiwgXCJ0XCIsIFwiZVwiLCBcIm5cIiwgXCJkXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBcIjpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgICAgICAgaWYgKFwicHJpdmF0ZVwiID09PSBzIHx8IFwicGFja2FnZVwiID09PSBzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgODpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcInVcIiwgXCJuXCIsIFwiY1wiLCBcInRcIiwgXCJpXCIsIFwib1wiLCBcIm5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVU5DVElPTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwib1wiLCBcIm5cIiwgXCJ0XCIsIFwiaVwiLCBcIm5cIiwgXCJ1XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNPTlRJTlVFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJlXCIsIFwiYlwiLCBcInVcIiwgXCJnXCIsIFwiZ1wiLCBcImVcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVCVUdHRVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIGlmIChzdHJpY3QgJiYgKGlkLmNoYXJBdCgwKSA9PT0gXCJwXCIgfHwgaWQuY2hhckF0KDApID09PSBcImlcIikpIHtcbiAgICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICAgIGlmIChcInByb3RlY3RlZFwiID09PSBzIHx8IFwiaW50ZXJmYWNlXCIgPT09IHMpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTA6XG4gICAgICB7XG4gICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgIGlmIChcImluc3RhbmNlb2ZcIiA9PT0gcykge1xuICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU5TVEFOQ0VPRjtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgXCJpbXBsZW1lbnRzXCIgPT09IHMpIHtcbiAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gIH1cblxuICBza2lwU2luZ2xlTGluZUNvbW1lbnQob2Zmc2V0KSB7XG4gICAgdGhpcy5pbmRleCArPSBvZmZzZXQ7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAqL1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gMHgwMDBEIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpXG4gICAgICAgICAgICA9PT0gMHgwMDBBIC8qXCJcXG5cIiAqLykge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNraXBNdWx0aUxpbmVDb21tZW50KCkge1xuICAgIHRoaXMuaW5kZXggKz0gMjtcbiAgICBsZXQgbGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5pbmRleDtcbiAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY2hDb2RlIDwgMHg4MCkge1xuICAgICAgICBzd2l0Y2ggKGNoQ29kZSkge1xuICAgICAgICAgIGNhc2UgNDI6ICAvLyBcIipcIlxuICAgICAgICAgICAgLy8gQmxvY2sgY29tbWVudCBlbmRzIHdpdGggXCIqLycuXG4gICAgICAgICAgICBpZiAoaSArIDEgPCBsZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KGkgKyAxKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCA9IGkgKyAyO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDEwOiAgLy8gXCJcXG5cIlxuICAgICAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDEyOiAvLyBcIlxcclwiOlxuICAgICAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGkgPCBsZW5ndGggLSAxICYmIHRoaXMuc291cmNlLmNoYXJBdChpICsgMSkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gMHgyMDI4IHx8IGNoQ29kZSA9PT0gMHgyMDI5KSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICB9XG5cblxuICBza2lwQ29tbWVudCgpIHtcbiAgICBsZXQgaXNMaW5lU3RhcnQgPSB0aGlzLmluZGV4ID09PSAwO1xuICAgIGxldCBsZW5ndGggPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoaXNXaGl0ZXNwYWNlKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmIChjaENvZGUgPT09IDEzIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5pbmRleCA8IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSA0NyAvKiBcIi9cIiAqLykge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDEgPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4ICsgMSk7XG4gICAgICAgIGlmIChjaENvZGUgPT09IDQ3IC8qIFwiL1wiICovKSB7XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoMik7XG4gICAgICAgICAgaXNMaW5lU3RhcnQgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNDIgLyogXCIqXCIgKi8pIHtcbiAgICAgICAgICB0aGlzLnNraXBNdWx0aUxpbmVDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lU3RhcnQgJiYgY2hDb2RlID09PSA0NSAvKiBcIi1cIiAqLykge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVSswMDNFIGlzIFwiPidcbiAgICAgICAgaWYgKCh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIi1cIikgJiYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPlwiKSkge1xuICAgICAgICAgIC8vIFwiLS0+XCIgaXMgYSBzaW5nbGUtbGluZSBjb21tZW50XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoMyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSA2MCAvKiBcIjxcIiAqLykge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDQgPD0gbGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiIVwiICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMilcbiAgICAgICAgICAgID09PSBcIi1cIlxuICAgICAgICAgICAgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSA9PT0gXCItXCIpIHtcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCg0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2NhbkhleEVzY2FwZTQoKSB7XG4gICAgaWYgKHRoaXMuaW5kZXggKyA0ID4gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMSA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSk7XG4gICAgaWYgKHIxID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjIgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpKTtcbiAgICBpZiAocjIgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMyA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikpO1xuICAgIGlmIChyMyA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHI0ID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSk7XG4gICAgaWYgKHI0ID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICB0aGlzLmluZGV4ICs9IDQ7XG4gICAgcmV0dXJuIHIxIDw8IDEyIHwgcjIgPDwgOCB8IHIzIDw8IDQgfCByNDtcbiAgfVxuXG4gIHNjYW5IZXhFc2NhcGUyKCkge1xuICAgIGlmICh0aGlzLmluZGV4ICsgMiA+IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjEgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpO1xuICAgIGlmIChyMSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIyID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSk7XG4gICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICB0aGlzLmluZGV4ICs9IDI7XG4gICAgcmV0dXJuIHIxIDw8IDQgfCByMjtcbiAgfVxuXG4gIGdldEVzY2FwZWRJZGVudGlmaWVyKCkge1xuICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICB0aGlzLmluZGV4Kys7XG4gICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICBsZXQgaWQgPSBcIlwiO1xuXG4gICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJ1XCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICBsZXQgaWNoID0gdGhpcy5zY2FuSGV4RXNjYXBlNCgpO1xuICAgICAgaWYgKGljaCA8IDAgfHwgaWNoID09PSAweDAwNUMgLyogXCJcXFxcXCIgKi8gIHx8ICFpc0lkZW50aWZpZXJTdGFydChpY2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGljaCk7XG4gICAgfVxuICAgIGlkICs9IGNoO1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpICYmIGNoICE9PSBcIlxcXFxcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJ1XCIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpY2ggPSB0aGlzLnNjYW5IZXhFc2NhcGU0KCk7XG4gICAgICAgIGlmIChpY2ggPCAwIHx8IGljaCA9PT0gMHgwMDVDIC8qIFwiXFxcXFwiICovIHx8ICFpc0lkZW50aWZpZXJQYXJ0KGljaCkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaWNoKTtcbiAgICAgIH1cbiAgICAgIGlkICs9IGNoO1xuICAgIH1cblxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIGdldElkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4Kys7XG4gICAgbGV0IGwgPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgbCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KGkpO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICAvLyBHbyBiYWNrIGFuZCB0cnkgdGhlIGhhcmQgb25lLlxuICAgICAgICB0aGlzLmluZGV4ID0gc3RhcnQ7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEVzY2FwZWRJZGVudGlmaWVyKCk7XG4gICAgICB9IGVsc2UgaWYgKGlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgdGhpcy5pbmRleCk7XG4gIH1cblxuICBzY2FuSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgLy8gQmFja3NsYXNoIChVKzAwNUMpIHN0YXJ0cyBhbiBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICBsZXQgaWQgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxcXFwiID8gdGhpcy5nZXRFc2NhcGVkSWRlbnRpZmllcigpIDogdGhpcy5nZXRJZGVudGlmaWVyKCk7XG5cbiAgICAvLyBUaGVyZSBpcyBubyBrZXl3b3JkIG9yIGxpdGVyYWwgd2l0aCBvbmx5IG9uZSBjaGFyYWN0ZXIuXG4gICAgLy8gVGh1cywgaXQgbXVzdCBiZSBhbiBpZGVudGlmaWVyLlxuICAgIGxldCBzbGljZSA9IHt0ZXh0OiBpZCwgc3RhcnQsIGVuZDogdGhpcy5pbmRleH07XG4gICAgaWYgKChpZC5sZW5ndGggPT09IDEpKSB7XG4gICAgICByZXR1cm4gbmV3IElkZW50aWZpZXJUb2tlbihzbGljZSk7XG4gICAgfVxuXG4gICAgbGV0IHN1YlR5cGUgPSBUb2tlbml6ZXIuZ2V0S2V5d29yZChpZCwgdGhpcy5zdHJpY3QpO1xuICAgIGlmIChzdWJUeXBlICE9PSBUb2tlblR5cGUuSUxMRUdBTCkge1xuICAgICAgcmV0dXJuIG5ldyBLZXl3b3JkVG9rZW4oc3ViVHlwZSwgc2xpY2UpO1xuICAgIH1cblxuICAgIGlmIChpZC5sZW5ndGggPT09IDQpIHtcbiAgICAgIGlmIChcIm51bGxcIiA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdWxsTGl0ZXJhbFRva2VuKHNsaWNlKTtcbiAgICAgIH0gZWxzZSBpZiAoXCJ0cnVlXCIgPT09IGlkKSB7XG4gICAgICAgIHJldHVybiBuZXcgVHJ1ZUxpdGVyYWxUb2tlbihzbGljZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlkLmxlbmd0aCA9PT0gNSAmJiBcImZhbHNlXCIgPT09IGlkKSB7XG4gICAgICByZXR1cm4gbmV3IEZhbHNlTGl0ZXJhbFRva2VuKHNsaWNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IElkZW50aWZpZXJUb2tlbihzbGljZSk7XG4gIH1cblxuICBnZXRTbGljZShzdGFydCkge1xuICAgIHJldHVybiB7dGV4dDogdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIHRoaXMuaW5kZXgpLCBzdGFydDogc3RhcnQsIGVuZDogdGhpcy5pbmRleH07XG4gIH1cblxuICBzY2FuUHVuY3R1YXRvckhlbHBlcigpIHtcbiAgICBsZXQgY2gxID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuXG4gICAgc3dpdGNoIChjaDEpIHtcbiAgICAgIC8vIENoZWNrIGZvciBtb3N0IGNvbW1vbiBzaW5nbGUtY2hhcmFjdGVyIHB1bmN0dWF0b3JzLlxuICAgICAgY2FzZSBcIi5cIjpcbiAgICAgICAgbGV0IGNoMiA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSk7XG4gICAgICAgIGlmIChjaDIgIT09IFwiLlwiKSByZXR1cm4gVG9rZW5UeXBlLlBFUklPRDtcbiAgICAgICAgbGV0IGNoMyA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMik7XG4gICAgICAgIGlmIChjaDMgIT09IFwiLlwiKSByZXR1cm4gVG9rZW5UeXBlLlBFUklPRDtcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FTExJUFNJUztcbiAgICAgIGNhc2UgXCIoXCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuTFBBUkVOO1xuICAgICAgY2FzZSBcIilcIjpcbiAgICAgIGNhc2UgXCI7XCI6XG4gICAgICBjYXNlIFwiLFwiOlxuICAgICAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gICAgICBjYXNlIFwie1wiOlxuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkxCUkFDRTtcbiAgICAgIGNhc2UgXCJ9XCI6XG4gICAgICBjYXNlIFwiW1wiOlxuICAgICAgY2FzZSBcIl1cIjpcbiAgICAgIGNhc2UgXCI6XCI6XG4gICAgICBjYXNlIFwiP1wiOlxuICAgICAgY2FzZSBcIn5cIjpcbiAgICAgICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gXCI9XCIgKFUrMDAzRCkgbWFya3MgYW4gYXNzaWdubWVudCBvciBjb21wYXJpc29uIG9wZXJhdG9yLlxuICAgICAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgICAgICAgY2FzZSBcIj1cIjpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FUV9TVFJJQ1Q7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FUTtcbiAgICAgICAgICAgIGNhc2UgXCIhXCI6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTkVfU1RSSUNUO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTkU7XG4gICAgICAgICAgICBjYXNlIFwifFwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I7XG4gICAgICAgICAgICBjYXNlIFwiK1wiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9BREQ7XG4gICAgICAgICAgICBjYXNlIFwiLVwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TVUI7XG4gICAgICAgICAgICBjYXNlIFwiKlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9NVUw7XG4gICAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkxURTtcbiAgICAgICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuR1RFO1xuICAgICAgICAgICAgY2FzZSBcIi9cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fRElWO1xuICAgICAgICAgICAgY2FzZSBcIiVcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fTU9EO1xuICAgICAgICAgICAgY2FzZSBcIl5cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjtcbiAgICAgICAgICAgIGNhc2UgXCImXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9BTkQ7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBicmVhazsgLy9mYWlsZWRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaDIgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgaWYgKGNoMSA9PT0gY2gyKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIGxldCBjaDMgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpO1xuICAgICAgICAgIGlmIChjaDEgPT09IFwiPlwiICYmIGNoMyA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAgIC8vIDQtY2hhcmFjdGVyIHB1bmN0dWF0b3I6ID4+Pj1cbiAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMyA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSFJfVU5TSUdORUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNIUl9VTlNJR05FRDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2gxID09PSBcIjxcIiAmJiBjaDMgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSEw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI+XCIgJiYgY2gzID09PSBcIj1cIikge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hSO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBPdGhlciAyLWNoYXJhY3RlciBwdW5jdHVhdG9yczogKysgLS0gPDwgPj4gJiYgfHxcbiAgICAgICAgc3dpdGNoIChjaDEpIHtcbiAgICAgICAgICBjYXNlIFwiK1wiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTkM7XG4gICAgICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVDO1xuICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNITDtcbiAgICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSFI7XG4gICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQU5EO1xuICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk9SO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhazsgLy9mYWlsZWRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgfVxuXG4gIC8vIDcuNyBQdW5jdHVhdG9yc1xuICBzY2FuUHVuY3R1YXRvcigpIHtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIGxldCBzdWJUeXBlID0gdGhpcy5zY2FuUHVuY3R1YXRvckhlbHBlcigpO1xuICAgIHRoaXMuaW5kZXggKz0gc3ViVHlwZS5uYW1lLmxlbmd0aDtcbiAgICByZXR1cm4gbmV3IFB1bmN0dWF0b3JUb2tlbihzdWJUeXBlLCB0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gIH1cblxuICBzY2FuSGV4TGl0ZXJhbChzdGFydCkge1xuICAgIGxldCBpID0gdGhpcy5pbmRleDtcbiAgICB3aGlsZSAoaSA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KGkpO1xuICAgICAgbGV0IGhleCA9IGdldEhleFZhbHVlKGNoKTtcbiAgICAgIGlmIChoZXggPT09IC0xKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4ID09PSBpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICBpZiAoaSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiBpc0lkZW50aWZpZXJTdGFydCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgdGhpcy5pbmRleCA9IGk7XG5cbiAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0KTtcbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4oc2xpY2UsIHBhcnNlSW50KHNsaWNlLnRleHQuc3Vic3RyKDIpLCAxNikpO1xuICB9XG5cbiAgc2NhbkJpbmFyeUxpdGVyYWwoc3RhcnQpIHtcbiAgICBsZXQgb2Zmc2V0ID0gdGhpcy5pbmRleCAtIHN0YXJ0O1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChjaCAhPT0gXCIwXCIgJiYgY2ggIT09IFwiMVwiKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IC0gc3RhcnQgPD0gb2Zmc2V0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiAoaXNJZGVudGlmaWVyU3RhcnQodGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KSlcbiAgICAgICAgfHwgaXNEZWNpbWFsRGlnaXQodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSwgcGFyc2VJbnQodGhpcy5nZXRTbGljZShzdGFydCkudGV4dC5zdWJzdHIob2Zmc2V0KSwgMiksIHRydWUpO1xuICB9XG5cbiAgc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCkge1xuICAgIHZhciBvZmZzZXQgPSB0aGlzLmluZGV4IC0gc3RhcnQ7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKCEoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgIH1cblxuICAgIGlmIChvZmZzZXQgPT09IDIgJiYgdGhpcy5pbmRleCAtIHN0YXJ0ID09PSAyKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiAoaXNJZGVudGlmaWVyU3RhcnQodGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KSlcbiAgICAgICAgfHwgaXNEZWNpbWFsRGlnaXQodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSwgcGFyc2VJbnQodGhpcy5nZXRTbGljZShzdGFydCkudGV4dC5zdWJzdHIob2Zmc2V0KSwgOCksIHRydWUpO1xuICB9XG5cbiAgc2Nhbk51bWVyaWNMaXRlcmFsKCkge1xuICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAvLyBhc3NlcnQoY2ggPT09IFwiLlwiIHx8IFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKVxuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICBpZiAoY2ggPT09IFwiMFwiKSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgaWYgKGNoID09PSBcInhcIiB8fCBjaCA9PT0gXCJYXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbkhleExpdGVyYWwoc3RhcnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcImJcIiB8fCBjaCA9PT0gXCJCXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2NhbkJpbmFyeUxpdGVyYWwoc3RhcnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIm9cIiB8fCBjaCA9PT0gXCJPXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCk7XG4gICAgICAgIH0gZWxzZSBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuT2N0YWxMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoICE9PSBcIi5cIikge1xuICAgICAgLy8gTXVzdCBiZSBcIjEnLi4nOSdcbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGUgPSAwO1xuICAgIGlmIChjaCA9PT0gXCIuXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICAgIH1cblxuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgZSsrO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVPRiBub3QgcmVhY2hlZCBoZXJlXG4gICAgaWYgKGNoID09PSBcImVcIiB8fCBjaCA9PT0gXCJFXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG5cbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgbGV0IG5lZyA9IGZhbHNlO1xuICAgICAgaWYgKGNoID09PSBcIitcIiB8fCBjaCA9PT0gXCItXCIpIHtcbiAgICAgICAgbmVnID0gY2ggPT09IFwiLVwiO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cblxuICAgICAgbGV0IGYgPSAwO1xuICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIGYgKj0gMTA7XG4gICAgICAgICAgZiArPSArY2g7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICBlICs9IG5lZyA/IGYgOiAtZjtcbiAgICB9XG5cbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gIH1cblxuICAvLyA3LjguNCBTdHJpbmcgTGl0ZXJhbHNcbiAgc2NhblN0cmluZ0xpdGVyYWwoKSB7XG4gICAgbGV0IHN0ciA9IFwiXCI7XG5cbiAgICBsZXQgcXVvdGUgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgLy8gIGFzc2VydCgocXVvdGUgPT09IFwiXFxcIlwiIHx8IHF1b3RlID09PSBcIlwiXCIpLCBcIlN0cmluZyBsaXRlcmFsIG11c3Qgc3RhcnRzIHdpdGggYSBxdW90ZVwiKVxuXG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4Kys7XG5cbiAgICBsZXQgb2N0YWwgPSBmYWxzZTtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIHJldHVybiBuZXcgU3RyaW5nTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLCBzdHIsIG9jdGFsKTtcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICBpZiAoIWlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXG5cIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcclwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFx0XCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidVwiOlxuICAgICAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICAgICAgbGV0IHJlc3RvcmUgPSB0aGlzLmluZGV4O1xuICAgICAgICAgICAgICBsZXQgdW5lc2NhcGVkO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHVuZXNjYXBlZCA9IGNoID09PSBcInVcIiA/IHRoaXMuc2NhbkhleEVzY2FwZTQoKSA6IHRoaXMuc2NhbkhleEVzY2FwZTIoKTtcbiAgICAgICAgICAgICAgaWYgKHVuZXNjYXBlZCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUodW5lc2NhcGVkKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFxiXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXGZcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcdTAwMEJcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikge1xuICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBsZXQgb2N0TGVuID0gMTtcbiAgICAgICAgICAgICAgICAvLyAzIGRpZ2l0cyBhcmUgb25seSBhbGxvd2VkIHdoZW4gc3RyaW5nIHN0YXJ0c1xuICAgICAgICAgICAgICAgIC8vIHdpdGggMCwgMSwgMiwgM1xuICAgICAgICAgICAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjNcIikge1xuICAgICAgICAgICAgICAgICAgb2N0TGVuID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGNvZGUgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlIChvY3RMZW4gPCAzICYmIFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICAgICAgICBjb2RlICo9IDg7XG4gICAgICAgICAgICAgICAgICBvY3RMZW4rKztcbiAgICAgICAgICAgICAgICAgIGNvZGUgKz0gY2ggLSBcIjBcIjtcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGlmIChjaCA9PT0gXCJcXHJcIiAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICB9XG5cbiAgc2NhblJlZ0V4cCgpIHtcblxuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgLy8gY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleClcblxuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIHN0ciArPSBcIi9cIjtcbiAgICB0aGlzLmluZGV4Kys7XG5cbiAgICBsZXQgdGVybWluYXRlZCA9IGZhbHNlO1xuICAgIGxldCBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2xhc3NNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiXVwiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiW1wiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGVybWluYXRlZCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpICYmIGNoICE9PSBcIlxcXFxcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIHN0ciArPSBjaDtcbiAgICB9XG4gICAgdGhpcy5sb29rYWhlYWRFbmQgPSB0aGlzLmluZGV4O1xuICAgIHJldHVybiBuZXcgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCksIHN0cik7XG4gIH1cblxuICBhZHZhbmNlKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5za2lwQ29tbWVudCgpO1xuICAgIHRoaXMubGFzdFdoaXRlc3BhY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0KTtcbiAgICB0aGlzLmxvb2thaGVhZFN0YXJ0ID1zdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBuZXcgRU9GVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgIH1cblxuICAgIGxldCBjaGFyQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG5cbiAgICBpZiAoY2hhckNvZGUgPCAweDgwKSB7XG4gICAgICBpZiAoUFVOQ1RVQVRPUl9TVEFSVFtjaGFyQ29kZV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKElERU5USUZJRVJfU1RBUlRbY2hhckNvZGVdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9sZXQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDAwMkUpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzRGVjaW1hbERpZ2l0KHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RyaW5nIGxpdGVyYWwgc3RhcnRzIHdpdGggc2luZ2xlIHF1b3RlIChVKzAwMjcpIG9yIGRvdWJsZSBxdW90ZSAoVSswMDIyKS5cbiAgICAgIGlmIChjaGFyQ29kZSA9PT0gMHgwMDI3IHx8IGNoYXJDb2RlID09PSAweDAwMjIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKDB4MDAzMCAvKiAnMCcgKi8gPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHgwMDM5IC8qICc5JyAqLykge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2xhc2ggKC8pIFUrMDAyRiBjYW4gYWxzbyBzdGFydCBhIHJlZ2V4LlxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaGFyQ29kZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbklkZW50aWZpZXIoKTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuICB9XG5cbiAgZW9mKCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRU9TO1xuICB9XG5cbiAgbGV4KCkge1xuICAgIGlmICh0aGlzLnByZXZUb2tlbiAhPT0gbnVsbCAmJiB0aGlzLnByZXZUb2tlbi50eXBlID09PSBUb2tlblR5cGUuRU9TKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcmV2VG9rZW47XG4gICAgfVxuICAgIHRoaXMucHJldlRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleCA9IHRoaXMubG9va2FoZWFkRW5kO1xuICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gZmFsc2U7XG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICB0aGlzLmxvb2thaGVhZEVuZCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCA9IHN0YXJ0O1xuICAgIHRoaXMudG9rZW5JbmRleCsrO1xuICAgIHJldHVybiB0aGlzLnByZXZUb2tlbjtcbiAgfVxufVxuIl19