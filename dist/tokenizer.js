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

        // istanbul ignore next
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
        for (var line = this.lineStarts.length - 1; line > 0; line--) {
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
              case 13:
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
            this.hasLineTerminatorBeforeNext = true;
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
            return TokenType.PERIOD;
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
          var ch2 = this.source.charAt(this.index + 1);
          if (ch1 === ch2) {
            if (this.index + 2 < this.source.length) {
              var ch3 = this.source.charAt(this.index + 2);
              if (ch1 === ">" && ch3 === ">") {
                // 4-character punctuator: >>>=
                if (this.index + 3 < this.source.length && this.source.charAt(this.index + 3) === "=") {
                  return TokenType.ASSIGN_SHR_UNSIGNED;
                }
                return TokenType.SHR_UNSIGNED;
              }

              if (ch1 === "<" && ch3 === "=") {
                return TokenType.ASSIGN_SHL;
              }

              if (ch1 === ">" && ch3 === "=") {
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
    scanOctalLiteral: {
      value: function scanOctalLiteral(start) {
        while (this.index < this.source.length) {
          var ch = this.source.charAt(this.index);
          if (!("0" <= ch && ch <= "7")) {
            break;
          }
          this.index++;
        }

        if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index)) || isDecimalDigit(this.source.charAt(this.index)))) {
          throw this.createILLEGAL();
        }

        return new NumericLiteralToken(this.getSlice(start), parseInt(this.getSlice(start).text.substr(1), 8), true);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FCQWlCK0csU0FBUzs7SUFBaEgsV0FBVyxVQUFYLFdBQVc7SUFBRSxnQkFBZ0IsVUFBaEIsZ0JBQWdCO0lBQUUsWUFBWSxVQUFaLFlBQVk7SUFBRSxpQkFBaUIsVUFBakIsaUJBQWlCO0lBQUUsZ0JBQWdCLFVBQWhCLGdCQUFnQjtJQUFFLGNBQWMsVUFBZCxjQUFjO0lBQ2hHLGFBQWEsV0FBTyxVQUFVLEVBQTlCLGFBQWE7QUFFZCxJQUFNLFVBQVUsV0FBVixVQUFVLEdBQUc7QUFDeEIsZ0JBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDakMsS0FBRyxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNwQixPQUFLLEVBQUUsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQzNCLFNBQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDMUIsYUFBVyxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMzQixnQkFBYyxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNqQyxZQUFVLEVBQUUsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQ2hDLGVBQWEsRUFBRSxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDL0IsbUJBQWlCLEVBQUUsRUFBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUM7QUFDOUMsYUFBVyxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMzQixjQUFZLEVBQUUsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQzdCLFNBQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7Q0FDM0IsQ0FBQzs7QUFFSyxJQUFNLFNBQVMsV0FBVCxTQUFTLEdBQUc7QUFDdkIsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN6QyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2hELFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDcEQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxhQUFXLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3RELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELGVBQWEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDekQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3ZELHFCQUFtQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUNqRSxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLGNBQVksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3RELFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdEQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM3QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzdDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQzNELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsVUFBUSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBQztBQUN2RCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ3JELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ3JELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0Ms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LENBQzFCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ2xILEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDckgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDcEgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdEYsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRW5DLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMs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M0csR0FBRyxDQUFDO09BQ2I7Ozs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDNUMsZUFBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUMzRyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7T0FDckM7Ozs7QUFFTSxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQ2pELGVBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FDM0csR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO09BQzdEOzs7O0FBRU0sY0FBVTthQUFBLG9CQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUU7Ozs7O0FBSzVCLFlBQUksRUFBRSxD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Q3ZCOzs7Ozs7U0FubENHLFNBQVM7OztxQkFBVCxTQUFTIiwiZmlsZSI6InNyYy90b2tlbml6ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG5pbXBvcnQge2dldEhleFZhbHVlLCBpc0xpbmVUZXJtaW5hdG9yLCBpc1doaXRlc3BhY2UsIGlzSWRlbnRpZmllclN0YXJ0LCBpc0lkZW50aWZpZXJQYXJ0LCBpc0RlY2ltYWxEaWdpdH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7RXJyb3JNZXNzYWdlc30gZnJvbSBcIi4vZXJyb3JzXCI7XG5cbmV4cG9ydCBjb25zdCBUb2tlbkNsYXNzID0ge1xuICBCb29sZWFuTGl0ZXJhbDoge25hbWU6IFwiQm9vbGVhblwifSxcbiAgRW9mOiB7bmFtZTogXCI8RW5kPlwifSxcbiAgSWRlbnQ6IHtuYW1lOiBcIklkZW50aWZpZXJcIn0sXG4gIEtleXdvcmQ6IHtuYW1lOiBcIktleXdvcmRcIn0sXG4gIE51bGxMaXRlcmFsOiB7bmFtZTogXCJOdWxsXCJ9LFxuICBOdW1lcmljTGl0ZXJhbDoge25hbWU6IFwiTnVtZXJpY1wifSxcbiAgUHVuY3R1YXRvcjoge25hbWU6IFwiUHVuY3R1YXRvclwifSxcbiAgU3RyaW5nTGl0ZXJhbDoge25hbWU6IFwiU3RyaW5nXCJ9LFxuICBSZWd1bGFyRXhwcmVzc2lvbjoge25hbWU6IFwiUmVndWxhckV4cHJlc3Npb25cIn0sXG4gIExpbmVDb21tZW50OiB7bmFtZTogXCJMaW5lXCJ9LFxuICBCbG9ja0NvbW1lbnQ6IHtuYW1lOiBcIkJsb2NrXCJ9LFxuICBJbGxlZ2FsOiB7bmFtZTogXCJJbGxlZ2FsXCJ9XG59O1xuXG5leHBvcnQgY29uc3QgVG9rZW5UeXBlID0ge1xuICBFT1M6IHtrbGFzczogVG9rZW5DbGFzcy5Fb2YsIG5hbWU6IFwiRU9TXCJ9LFxuICBMUEFSRU46IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIihcIn0sXG4gIFJQQVJFTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKVwifSxcbiAgTEJSQUNLOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJbXCJ9LFxuICBSQlJBQ0s6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl1cIn0sXG4gIExCUkFDRToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwie1wifSxcbiAgUkJSQUNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ9XCJ9LFxuICBDT0xPTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiOlwifSxcbiAgU0VNSUNPTE9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI7XCJ9LFxuICBQRVJJT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi5cIn0sXG4gIENPTkRJVElPTkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI/XCJ9LFxuICBJTkM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIisrXCJ9LFxuICBERUM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi0tXCJ9LFxuICBBU1NJR046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj1cIn0sXG4gIEFTU0lHTl9CSVRfT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInw9XCJ9LFxuICBBU1NJR05fQklUX1hPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXj1cIn0sXG4gIEFTU0lHTl9CSVRfQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImPVwifSxcbiAgQVNTSUdOX1NITDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPDw9XCJ9LFxuICBBU1NJR05fU0hSOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj1cIn0sXG4gIEFTU0lHTl9TSFJfVU5TSUdORUQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+Pj1cIn0sXG4gIEFTU0lHTl9BREQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIis9XCJ9LFxuICBBU1NJR05fU1VCOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItPVwifSxcbiAgQVNTSUdOX01VTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKj1cIn0sXG4gIEFTU0lHTl9ESVY6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi89XCJ9LFxuICBBU1NJR05fTU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIlPVwifSxcbiAgQ09NTUE6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIixcIn0sXG4gIE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8fFwifSxcbiAgQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImJlwifSxcbiAgQklUX09SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8XCJ9LFxuICBCSVRfWE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJeXCJ9LFxuICBCSVRfQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImXCJ9LFxuICBTSEw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw8XCJ9LFxuICBTSFI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+XCJ9LFxuICBTSFJfVU5TSUdORUQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+PlwifSxcbiAgQUREOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrXCJ9LFxuICBTVUI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi1cIn0sXG4gIE1VTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKlwifSxcbiAgRElWOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIvXCJ9LFxuICBNT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiVcIn0sXG4gIEVROiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9PVwifSxcbiAgTkU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiE9XCJ9LFxuICBFUV9TVFJJQ1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj09PVwifSxcbiAgTkVfU1RSSUNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIhPT1cIn0sXG4gIExUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8XCJ9LFxuICBHVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPlwifSxcbiAgTFRFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PVwifSxcbiAgR1RFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+PVwifSxcbiAgSU5TVEFOQ0VPRjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaW5zdGFuY2VvZlwifSxcbiAgSU46IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImluXCJ9LFxuICBOT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiFcIn0sXG4gIEJJVF9OT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn5cIn0sXG4gIERFTEVURToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVsZXRlXCJ9LFxuICBUWVBFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInR5cGVvZlwifSxcbiAgVk9JRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidm9pZFwifSxcbiAgQlJFQUs6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImJyZWFrXCJ9LFxuICBDQVNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXNlXCJ9LFxuICBDQVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2F0Y2hcIn0sXG4gIENPTlRJTlVFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb250aW51ZVwifSxcbiAgREVCVUdHRVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlYnVnZ2VyXCJ9LFxuICBERUZBVUxUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkZWZhdWx0XCJ9LFxuICBETzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZG9cIn0sXG4gIEVMU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImVsc2VcIn0sXG4gIEZJTkFMTFk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZpbmFsbHlcIn0sXG4gIEZPUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZm9yXCJ9LFxuICBGVU5DVElPTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZnVuY3Rpb25cIn0sXG4gIElGOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpZlwifSxcbiAgTkVXOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJuZXdcIn0sXG4gIFJFVFVSTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwicmV0dXJuXCJ9LFxuICBTV0lUQ0g6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInN3aXRjaFwifSxcbiAgVEhJUzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidGhpc1wifSxcbiAgVEhST1c6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRocm93XCJ9LFxuICBUUlk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRyeVwifSxcbiAgVkFSOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ2YXJcIn0sXG4gIFdISUxFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ3aGlsZVwifSxcbiAgV0lUSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwid2l0aFwifSxcbiAgTlVMTF9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuTnVsbExpdGVyYWwsIG5hbWU6IFwibnVsbFwifSxcbiAgVFJVRV9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuQm9vbGVhbkxpdGVyYWwsIG5hbWU6IFwidHJ1ZVwifSxcbiAgRkFMU0VfTElURVJBTDoge2tsYXNzOiBUb2tlbkNsYXNzLkJvb2xlYW5MaXRlcmFsLCBuYW1lOiBcImZhbHNlXCJ9LFxuICBOVU1CRVI6IHtrbGFzczogVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFNUUklORzoge2tsYXNzOiBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWwsIG5hbWU6IFwiXCJ9LFxuICBSRUdFWFA6IHtrbGFzczogVG9rZW5DbGFzcy5SZWd1bGFyRXhwcmVzc2lvbiwgbmFtZTogXCJcIn0sXG4gIElERU5USUZJRVI6IHtrbGFzczogVG9rZW5DbGFzcy5JZGVudCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9SRVNFUlZFRF9XT1JEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiXCJ9LFxuICBDT05TVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY29uc3RcIn0sXG4gIExFVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwibGV0XCJ9LFxuICBJTExFR0FMOiB7a2xhc3M6IFRva2VuQ2xhc3MuSWxsZWdhbCwgbmFtZTogXCJcIn1cbn07XG5cbmNvbnN0IFRUID0gVG9rZW5UeXBlO1xuY29uc3QgSSA9IFRULklMTEVHQUw7XG5jb25zdCBGID0gZmFsc2U7XG5jb25zdCBUID0gdHJ1ZTtcblxuY29uc3QgT05FX0NIQVJfUFVOQ1RVQVRPUiA9IFtcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTk9ULCBJLCBJLCBJLFxuICBUVC5NT0QsIFRULkJJVF9BTkQsIEksIFRULkxQQVJFTiwgVFQuUlBBUkVOLCBUVC5NVUwsIFRULkFERCwgVFQuQ09NTUEsIFRULlNVQiwgVFQuUEVSSU9ELCBUVC5ESVYsIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIFRULkNPTE9OLCBUVC5TRU1JQ09MT04sIFRULkxULCBUVC5BU1NJR04sIFRULkdULCBUVC5DT05ESVRJT05BTCwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNLLCBJLCBUVC5SQlJBQ0ssIFRULkJJVF9YT1IsIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIFRULkxCUkFDRSwgVFQuQklUX09SLCBUVC5SQlJBQ0UsIFRULkJJVF9OT1RdO1xuXG5jb25zdCBQVU5DVFVBVE9SX1NUQVJUID0gW1xuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBGLCBGLCBULCBULFxuICBGLCBULCBULCBULCBULCBULCBULCBGLCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBGXTtcblxuY29uc3QgSURFTlRJRklFUl9TVEFSVCA9IFtcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgRiwgRixcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCxcbiAgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgRiwgVCwgRiwgRiwgVCwgRiwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCxcbiAgVCwgVCwgVCwgVCwgVCwgVCwgRiwgRiwgRiwgRiwgRl07XG5cbmV4cG9ydCBjbGFzcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlLCBvY3RhbCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5zbGljZSA9IHNsaWNlO1xuICAgIHRoaXMub2N0YWwgPSBvY3RhbDtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpZmllckxpa2VUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnNsaWNlLnRleHQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIElkZW50aWZpZXJUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5JREVOVElGSUVSLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bGxMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuTlVMTF9MSVRFUkFMLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRydWVMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuVFJVRV9MSVRFUkFMLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZhbHNlTGl0ZXJhbFRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkZBTFNFX0xJVEVSQUwsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5d29yZFRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQdW5jdHVhdG9yVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlLm5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuUkVHRVhQLCBzbGljZSwgZmFsc2UpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUgPSArc2xpY2UudGV4dCwgb2N0YWwgPSBmYWxzZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5OVU1CRVIsIHNsaWNlLCBvY3RhbCk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUsIG9jdGFsKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLlNUUklORywgc2xpY2UsIG9jdGFsKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRU9GVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkVPUywgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSnNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoaW5kZXgsIGxpbmUsIGNvbHVtbiwgbXNnKSB7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IG1zZztcbiAgICB0aGlzLm1lc3NhZ2UgPSBgWyR7bGluZX06JHtjb2x1bW59XTogJHttc2d9YDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdFxuY2xhc3MgVG9rZW5pemVyIHtcbiAgY29uc3RydWN0b3Ioc291cmNlKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgdGhpcy5pbmRleCA9IDA7XG4gICAgdGhpcy5saW5lU3RhcnRzID0gWzBdO1xuICAgIHRoaXMubG9va2FoZWFkU3RhcnQgPSAwO1xuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG4gICAgdGhpcy5sb29rYWhlYWRFbmQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIHRoaXMuc3RyaWN0ID0gZmFsc2U7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLnByZXZUb2tlbiA9IG51bGw7XG4gICAgdGhpcy50b2tlbkluZGV4ID0gMDtcbiAgICB0aGlzLmxpbmVTdGFydHMgPSBbMF07XG4gIH1cblxuICB0cmFja0JhY2tMaW5lTnVtYmVyKHBvc2l0aW9uKSB7XG4gICAgZm9yIChsZXQgbGluZSA9IHRoaXMubGluZVN0YXJ0cy5sZW5ndGggLSAxOyBsaW5lID4gMDsgbGluZS0tKSB7XG4gICAgICBpZiAoKHBvc2l0aW9uID49IHRoaXMuZ2V0TGluZVN0YXJ0KGxpbmUpKSkge1xuICAgICAgICByZXR1cm4gbGluZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBjcmVhdGVJTExFR0FMKCkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9JTExFR0FMX1RPS0VOKTtcbiAgfVxuXG4gIGNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pIHtcbiAgICBzd2l0Y2ggKHRva2VuLnR5cGUua2xhc3MpIHtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5Fb2Y6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9FT1MpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLk51bWVyaWNMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTlVNQkVSKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5TdHJpbmdMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1RSSU5HKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5JZGVudDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lERU5USUZJRVIpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLktleXdvcmQ6XG4gICAgICAgIGlmICgodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi5zbGljZS50ZXh0KTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5QdW5jdHVhdG9yOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnR5cGUubmFtZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi52YWx1ZSk7XG4gIH1cblxuICBjcmVhdGVFcnJvcihtZXNzYWdlLCBhcmcpIHtcbiAgICBsZXQgbXNnID0gbWVzc2FnZS5yZXBsYWNlKC97KFxcZCspfS9nLCAoKSA9PiBhcmcpO1xuICAgIGxldCBpbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IGxpbmUgPSB0aGlzLnRyYWNrQmFja0xpbmVOdW1iZXIoaW5kZXgpO1xuICAgIHJldHVybiBuZXcgSnNFcnJvcihpbmRleCwgbGluZSArIDEsIGluZGV4IC0gdGhpcy5nZXRMaW5lU3RhcnQobGluZSkgKyAxLCBtc2cpO1xuICB9XG5cbiAgY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIG1lc3NhZ2UsIGFyZykge1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csICgpID0+IGFyZyk7XG4gICAgbGV0IGluZGV4ID0gdG9rZW4uc2xpY2Uuc3RhcnQ7XG4gICAgbGV0IGxpbmUgPSB0aGlzLnRyYWNrQmFja0xpbmVOdW1iZXIoaW5kZXgpO1xuICAgIHJldHVybiBuZXcgSnNFcnJvcihpbmRleCwgbGluZSArIDEsIGluZGV4IC0gdGhpcy5nZXRMaW5lU3RhcnQobGluZSkgKyAxLCBtc2cpO1xuICB9XG5cbiAgZ2V0TGluZVN0YXJ0KGxpbmUpIHtcbiAgICByZXR1cm4gdGhpcy5saW5lU3RhcnRzW2xpbmVdO1xuICB9XG5cbiAgc3RhdGljIGNzZTIoaWQsIGNoMSwgY2gyKSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyO1xuICB9XG5cbiAgc3RhdGljIGNzZTMoaWQsIGNoMSwgY2gyLCBjaDMpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDM7XG4gIH1cblxuICBzdGF0aWMgY3NlNChpZCwgY2gxLCBjaDIsIGNoMywgY2g0KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0O1xuICB9XG5cbiAgc3RhdGljIGNzZTUoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCwgY2g1KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0ICYmIGlkLmNoYXJBdCg1KVxuICAgICAgICA9PT0gY2g1O1xuICB9XG5cbiAgc3RhdGljIGNzZTYoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCwgY2g1LCBjaDYpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDUgJiYgaWQuY2hhckF0KDYpID09PSBjaDY7XG4gIH1cblxuICBzdGF0aWMgY3NlNyhpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUsIGNoNiwgY2g3KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0ICYmIGlkLmNoYXJBdCg1KVxuICAgICAgICA9PT0gY2g1ICYmIGlkLmNoYXJBdCg2KSA9PT0gY2g2ICYmIGlkLmNoYXJBdCg3KSA9PT0gY2g3O1xuICB9XG5cbiAgc3RhdGljIGdldEtleXdvcmQoaWQsIHN0cmljdCkge1xuICAgIC8vIFwiY29uc3RcIiBpcyBzcGVjaWFsaXplZCBhcyBLZXl3b3JkIGluIFY4LlxuICAgIC8vIFwieWllbGRcIiBhbmQgXCJsZXRcIiBhcmUgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBTcGlkZXJNb25rZXkgYW5kIEVTLm5leHQuXG4gICAgLy8gU29tZSBvdGhlcnMgYXJlIGZyb20gZnV0dXJlIHJlc2VydmVkIHdvcmRzLlxuXG4gICAgaWYgKGlkLmxlbmd0aCA9PT0gMSB8fCBpZC5sZW5ndGggPiAxMCkge1xuICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTExFR0FMO1xuICAgIH1cblxuICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgc3dpdGNoIChpZC5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMSkpIHtcbiAgICAgICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklGO1xuICAgICAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU47XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKGlkLmNoYXJBdCgxKSA9PT0gXCJvXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ETztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImFcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVkFSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJvXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZPUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiZVwiLCBcIndcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORVc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcInJcIiwgXCJ5XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVFJZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImxcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJlXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRCA6IFRva2VuVHlwZS5MRVQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJoXCIsIFwiaVwiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5USElTO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJsXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FTFNFO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJuXCIsIFwidVwiLCBcIm1cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiYVwiLCBcInNcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0FTRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwib1wiLCBcImlcIiwgXCJkXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVk9JRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ3XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiaVwiLCBcInRcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuV0lUSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwid1wiOiAvLyBXSElMRVxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImhcIiwgXCJpXCIsIFwibFwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5XSElMRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJiXCI6IC8vIEJSRUFLXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiclwiLCBcImVcIiwgXCJhXCIsIFwia1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkJSRUFLO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjogLy8gQ0FUQ0hcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJhXCIsIFwidFwiLCBcImNcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0FUQ0g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcIm9cIiwgXCJuXCIsIFwic1wiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DT05TVDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwibFwiLCBcImFcIiwgXCJzXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjogLy8gVEhST1dcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiclwiLCBcIm9cIiwgXCJ3XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVEhST1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwieVwiOiAvLyBZSUVMRFxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImlcIiwgXCJlXCIsIFwibFwiLCBcImRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQgOiBUb2tlblR5cGUuSUxMRUdBTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzXCI6IC8vIFNVUEVSXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwidVwiLCBcInBcIiwgXCJlXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwiZVwiLCBcInRcIiwgXCJ1XCIsIFwiclwiLCBcIm5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5SRVRVUk47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInlcIiwgXCJwXCIsIFwiZVwiLCBcIm9cIiwgXCJmXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVFlQRU9GO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJlXCIsIFwibFwiLCBcImVcIiwgXCJ0XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFTEVURTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwid1wiLCBcImlcIiwgXCJ0XCIsIFwiY1wiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TV0lUQ0g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBUb2tlbml6ZXIuY3NlNShpZCwgXCJ0XCIsIFwiYVwiLCBcInRcIiwgXCJpXCIsIFwiY1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwieFwiLCBcInBcIiwgXCJvXCIsIFwiclwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwibVwiLCBcInBcIiwgXCJvXCIsIFwiclwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwXCI6XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIFRva2VuaXplci5jc2U1KGlkLCBcInVcIiwgXCJiXCIsIFwibFwiLCBcImlcIiwgXCJjXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJkXCI6IC8vIGRlZmF1bHRcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJlXCIsIFwiZlwiLCBcImFcIiwgXCJ1XCIsIFwibFwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUZBVUxUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjogLy8gZmluYWxseVxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcImlcIiwgXCJuXCIsIFwiYVwiLCBcImxcIiwgXCJsXCIsIFwieVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZJTkFMTFk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOiAvLyBleHRlbmRzXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwieFwiLCBcInRcIiwgXCJlXCIsIFwiblwiLCBcImRcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwicFwiOlxuICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICAgICAgICBpZiAoXCJwcml2YXRlXCIgPT09IHMgfHwgXCJwYWNrYWdlXCIgPT09IHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwidVwiLCBcIm5cIiwgXCJjXCIsIFwidFwiLCBcImlcIiwgXCJvXCIsIFwiblwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVTkNUSU9OO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJvXCIsIFwiblwiLCBcInRcIiwgXCJpXCIsIFwiblwiLCBcInVcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ09OVElOVUU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcImVcIiwgXCJiXCIsIFwidVwiLCBcImdcIiwgXCJnXCIsIFwiZVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUJVR0dFUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgOTpcbiAgICAgICAgaWYgKHN0cmljdCAmJiAoaWQuY2hhckF0KDApID09PSBcInBcIiB8fCBpZC5jaGFyQXQoMCkgPT09IFwiaVwiKSkge1xuICAgICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgICAgaWYgKFwicHJvdGVjdGVkXCIgPT09IHMgfHwgXCJpbnRlcmZhY2VcIiA9PT0gcykge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMDpcbiAgICAgIHtcbiAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgaWYgKFwiaW5zdGFuY2VvZlwiID09PSBzKSB7XG4gICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTlNUQU5DRU9GO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBcImltcGxlbWVudHNcIiA9PT0gcykge1xuICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBUb2tlblR5cGUuSUxMRUdBTDtcbiAgfVxuXG4gIHNraXBTaW5nbGVMaW5lQ29tbWVudChvZmZzZXQpIHtcbiAgICB0aGlzLmluZGV4ICs9IG9mZnNldDtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICovXG4gICAgICBsZXQgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICBpZiAoY2hDb2RlID09PSAweDAwMEQgLyogXCJcXHJcIiAqLyAmJiB0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleClcbiAgICAgICAgICAgID09PSAweDAwMEEgLypcIlxcblwiICovKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2tpcE11bHRpTGluZUNvbW1lbnQoKSB7XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIGxldCBsZW5ndGggPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgbGVuZ3RoKSB7XG4gICAgICBsZXQgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjaENvZGUgPCAweDgwKSB7XG4gICAgICAgIHN3aXRjaCAoY2hDb2RlKSB7XG4gICAgICAgICAgY2FzZSA0MjogIC8vIFwiKlwiXG4gICAgICAgICAgICAvLyBCbG9jayBjb21tZW50IGVuZHMgd2l0aCBcIiovJy5cbiAgICAgICAgICAgIGlmIChpICsgMSA8IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQoaSArIDEpID09PSBcIi9cIikge1xuICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gaSArIDI7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTA6ICAvLyBcIlxcblwiXG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTM6IC8vIFwiXFxyXCI6XG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaSA8IGxlbmd0aCAtIDEgJiYgdGhpcy5zb3VyY2UuY2hhckF0KGkgKyAxKSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSAweDIwMjggfHwgY2hDb2RlID09PSAweDIwMjkpIHtcbiAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICBpKys7XG4gICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmluZGV4ID0gaTtcbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgfVxuXG5cbiAgc2tpcENvbW1lbnQoKSB7XG4gICAgbGV0IGlzTGluZVN0YXJ0ID0gdGhpcy5pbmRleCA9PT0gMDtcbiAgICBsZXQgbGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGlzV2hpdGVzcGFjZShjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAoY2hDb2RlID09PSAxMyAvKiBcIlxcclwiICovICYmIHRoaXMuaW5kZXggPCBsZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNDcgLyogXCIvXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgICBpZiAoY2hDb2RlID09PSA0NyAvKiBcIi9cIiAqLykge1xuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDIpO1xuICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDQyIC8qIFwiKlwiICovKSB7XG4gICAgICAgICAgdGhpcy5za2lwTXVsdGlMaW5lQ29tbWVudCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVN0YXJ0ICYmIGNoQ29kZSA9PT0gNDUgLyogXCItXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFUrMDAzRSBpcyBcIj4nXG4gICAgICAgIGlmICgodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCItXCIpICYmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpID09PSBcIj5cIikpIHtcbiAgICAgICAgICAvLyBcIi0tPlwiIGlzIGEgc2luZ2xlLWxpbmUgY29tbWVudFxuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNjAgLyogXCI8XCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyA0IDw9IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIiFcIiAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpXG4gICAgICAgICAgICA9PT0gXCItXCJcbiAgICAgICAgICAgICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykgPT09IFwiLVwiKSB7XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoNCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNjYW5IZXhFc2NhcGU0KCkge1xuICAgIGlmICh0aGlzLmluZGV4ICsgNCA+IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjEgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpO1xuICAgIGlmIChyMSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIyID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSk7XG4gICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjMgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpKTtcbiAgICBpZiAocjMgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByNCA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykpO1xuICAgIGlmIChyNCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgdGhpcy5pbmRleCArPSA0O1xuICAgIHJldHVybiByMSA8PCAxMiB8IHIyIDw8IDggfCByMyA8PCA0IHwgcjQ7XG4gIH1cblxuICBzY2FuSGV4RXNjYXBlMigpIHtcbiAgICBpZiAodGhpcy5pbmRleCArIDIgPiB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIxID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKTtcbiAgICBpZiAocjEgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMiA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpO1xuICAgIGlmIChyMiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIHJldHVybiByMSA8PCA0IHwgcjI7XG4gIH1cblxuICBnZXRFc2NhcGVkSWRlbnRpZmllcigpIHtcbiAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgbGV0IGlkID0gXCJcIjtcblxuICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwidVwiKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgbGV0IGljaCA9IHRoaXMuc2NhbkhleEVzY2FwZTQoKTtcbiAgICAgIGlmIChpY2ggPCAwIHx8IGljaCA9PT0gMHgwMDVDIC8qIFwiXFxcXFwiICovICB8fCAhaXNJZGVudGlmaWVyU3RhcnQoaWNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpY2gpO1xuICAgIH1cbiAgICBpZCArPSBjaDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSAmJiBjaCAhPT0gXCJcXFxcXCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwidVwiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWNoID0gdGhpcy5zY2FuSGV4RXNjYXBlNCgpO1xuICAgICAgICBpZiAoaWNoIDwgMCB8fCBpY2ggPT09IDB4MDA1QyAvKiBcIlxcXFxcIiAqLyB8fCAhaXNJZGVudGlmaWVyUGFydChpY2gpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGljaCk7XG4gICAgICB9XG4gICAgICBpZCArPSBjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBnZXRJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIGxldCBsID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5pbmRleDtcbiAgICB3aGlsZSAoaSA8IGwpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdChpKTtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgLy8gR28gYmFjayBhbmQgdHJ5IHRoZSBoYXJkIG9uZS5cbiAgICAgICAgdGhpcy5pbmRleCA9IHN0YXJ0O1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRFc2NhcGVkSWRlbnRpZmllcigpO1xuICAgICAgfSBlbHNlIGlmIChpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmluZGV4ID0gaTtcbiAgICByZXR1cm4gdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIHRoaXMuaW5kZXgpO1xuICB9XG5cbiAgc2NhbklkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIC8vIEJhY2tzbGFzaCAoVSswMDVDKSBzdGFydHMgYW4gZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgbGV0IGlkID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcXFxcIiA/IHRoaXMuZ2V0RXNjYXBlZElkZW50aWZpZXIoKSA6IHRoaXMuZ2V0SWRlbnRpZmllcigpO1xuXG4gICAgLy8gVGhlcmUgaXMgbm8ga2V5d29yZCBvciBsaXRlcmFsIHdpdGggb25seSBvbmUgY2hhcmFjdGVyLlxuICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICBsZXQgc2xpY2UgPSB7dGV4dDogaWQsIHN0YXJ0LCBlbmQ6IHRoaXMuaW5kZXh9O1xuICAgIGlmICgoaWQubGVuZ3RoID09PSAxKSkge1xuICAgICAgcmV0dXJuIG5ldyBJZGVudGlmaWVyVG9rZW4oc2xpY2UpO1xuICAgIH1cblxuICAgIGxldCBzdWJUeXBlID0gVG9rZW5pemVyLmdldEtleXdvcmQoaWQsIHRoaXMuc3RyaWN0KTtcbiAgICBpZiAoc3ViVHlwZSAhPT0gVG9rZW5UeXBlLklMTEVHQUwpIHtcbiAgICAgIHJldHVybiBuZXcgS2V5d29yZFRva2VuKHN1YlR5cGUsIHNsaWNlKTtcbiAgICB9XG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSA0KSB7XG4gICAgICBpZiAoXCJudWxsXCIgPT09IGlkKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVsbExpdGVyYWxUb2tlbihzbGljZSk7XG4gICAgICB9IGVsc2UgaWYgKFwidHJ1ZVwiID09PSBpZCkge1xuICAgICAgICByZXR1cm4gbmV3IFRydWVMaXRlcmFsVG9rZW4oc2xpY2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpZC5sZW5ndGggPT09IDUgJiYgXCJmYWxzZVwiID09PSBpZCkge1xuICAgICAgcmV0dXJuIG5ldyBGYWxzZUxpdGVyYWxUb2tlbihzbGljZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJZGVudGlmaWVyVG9rZW4oc2xpY2UpO1xuICB9XG5cbiAgZ2V0U2xpY2Uoc3RhcnQpIHtcbiAgICByZXR1cm4ge3RleHQ6IHRoaXMuc291cmNlLnNsaWNlKHN0YXJ0LCB0aGlzLmluZGV4KSwgc3RhcnQ6IHN0YXJ0LCBlbmQ6IHRoaXMuaW5kZXh9O1xuICB9XG5cbiAgc2NhblB1bmN0dWF0b3JIZWxwZXIoKSB7XG4gICAgbGV0IGNoMSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcblxuICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAvLyBDaGVjayBmb3IgbW9zdCBjb21tb24gc2luZ2xlLWNoYXJhY3RlciBwdW5jdHVhdG9ycy5cbiAgICAgIGNhc2UgXCIuXCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MUEFSRU47XG4gICAgICBjYXNlIFwiKVwiOlxuICAgICAgY2FzZSBcIjtcIjpcbiAgICAgIGNhc2UgXCIsXCI6XG4gICAgICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuTEJSQUNFO1xuICAgICAgY2FzZSBcIn1cIjpcbiAgICAgIGNhc2UgXCJbXCI6XG4gICAgICBjYXNlIFwiXVwiOlxuICAgICAgY2FzZSBcIjpcIjpcbiAgICAgIGNhc2UgXCI/XCI6XG4gICAgICBjYXNlIFwiflwiOlxuICAgICAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBcIj1cIiAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIj1cIikge1xuICAgICAgICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAgICAgICBjYXNlIFwiPVwiOlxuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRX1NUUklDVDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRO1xuICAgICAgICAgICAgY2FzZSBcIiFcIjpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORV9TVFJJQ1Q7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORTtcbiAgICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9PUjtcbiAgICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0FERDtcbiAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NVQjtcbiAgICAgICAgICAgIGNhc2UgXCIqXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX01VTDtcbiAgICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTFRFO1xuICAgICAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5HVEU7XG4gICAgICAgICAgICBjYXNlIFwiL1wiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9ESVY7XG4gICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9NT0Q7XG4gICAgICAgICAgICBjYXNlIFwiXlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfWE9SO1xuICAgICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDtcbiAgICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBicmVhazsgLy9mYWlsZWRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaDIgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgaWYgKGNoMSA9PT0gY2gyKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIGxldCBjaDMgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpO1xuICAgICAgICAgIGlmIChjaDEgPT09IFwiPlwiICYmIGNoMyA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAgIC8vIDQtY2hhcmFjdGVyIHB1bmN0dWF0b3I6ID4+Pj1cbiAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMyA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSFJfVU5TSUdORUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNIUl9VTlNJR05FRDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2gxID09PSBcIjxcIiAmJiBjaDMgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSEw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI+XCIgJiYgY2gzID09PSBcIj1cIikge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hSO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBPdGhlciAyLWNoYXJhY3RlciBwdW5jdHVhdG9yczogKysgLS0gPDwgPj4gJiYgfHxcbiAgICAgICAgc3dpdGNoIChjaDEpIHtcbiAgICAgICAgICBjYXNlIFwiK1wiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTkM7XG4gICAgICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVDO1xuICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNITDtcbiAgICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSFI7XG4gICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQU5EO1xuICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk9SO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhazsgLy9mYWlsZWRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgfVxuXG4gIC8vIDcuNyBQdW5jdHVhdG9yc1xuICBzY2FuUHVuY3R1YXRvcigpIHtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIGxldCBzdWJUeXBlID0gdGhpcy5zY2FuUHVuY3R1YXRvckhlbHBlcigpO1xuICAgIHRoaXMuaW5kZXggKz0gc3ViVHlwZS5uYW1lLmxlbmd0aDtcbiAgICByZXR1cm4gbmV3IFB1bmN0dWF0b3JUb2tlbihzdWJUeXBlLCB0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gIH1cblxuICBzY2FuSGV4TGl0ZXJhbChzdGFydCkge1xuICAgIGxldCBpID0gdGhpcy5pbmRleDtcbiAgICB3aGlsZSAoaSA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KGkpO1xuICAgICAgbGV0IGhleCA9IGdldEhleFZhbHVlKGNoKTtcbiAgICAgIGlmIChoZXggPT09IC0xKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4ID09PSBpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICBpZiAoaSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiBpc0lkZW50aWZpZXJTdGFydCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgdGhpcy5pbmRleCA9IGk7XG5cbiAgICBsZXQgc2xpY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0KTtcbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4oc2xpY2UsIHBhcnNlSW50KHNsaWNlLnRleHQuc3Vic3RyKDIpLCAxNikpO1xuICB9XG5cbiAgc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCkge1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoIShcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgKGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCkpXG4gICAgICAgIHx8IGlzRGVjaW1hbERpZ2l0KHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCksIHBhcnNlSW50KHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLnRleHQuc3Vic3RyKDEpLCA4KSwgdHJ1ZSk7XG4gIH1cblxuICBzY2FuTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgIC8vIGFzc2VydChjaCA9PT0gXCIuXCIgfHwgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpXG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIGlmIChjaCA9PT0gXCIwXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICBpZiAoY2ggPT09IFwieFwiIHx8IGNoID09PSBcIlhcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuSGV4TGl0ZXJhbChzdGFydCk7XG4gICAgICAgIH0gZWxzZSBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuT2N0YWxMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoICE9PSBcIi5cIikge1xuICAgICAgLy8gTXVzdCBiZSBcIjEnLi4nOSdcbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGUgPSAwO1xuICAgIGlmIChjaCA9PT0gXCIuXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICAgIH1cblxuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgZSsrO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVPRiBub3QgcmVhY2hlZCBoZXJlXG4gICAgaWYgKGNoID09PSBcImVcIiB8fCBjaCA9PT0gXCJFXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG5cbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgbGV0IG5lZyA9IGZhbHNlO1xuICAgICAgaWYgKGNoID09PSBcIitcIiB8fCBjaCA9PT0gXCItXCIpIHtcbiAgICAgICAgbmVnID0gY2ggPT09IFwiLVwiO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cblxuICAgICAgbGV0IGYgPSAwO1xuICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIGYgKj0gMTA7XG4gICAgICAgICAgZiArPSArY2g7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICBlICs9IG5lZyA/IGYgOiAtZjtcbiAgICB9XG5cbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gIH1cblxuICAvLyA3LjguNCBTdHJpbmcgTGl0ZXJhbHNcbiAgc2NhblN0cmluZ0xpdGVyYWwoKSB7XG4gICAgbGV0IHN0ciA9IFwiXCI7XG5cbiAgICBsZXQgcXVvdGUgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgLy8gIGFzc2VydCgocXVvdGUgPT09IFwiXFxcIlwiIHx8IHF1b3RlID09PSBcIlwiXCIpLCBcIlN0cmluZyBsaXRlcmFsIG11c3Qgc3RhcnRzIHdpdGggYSBxdW90ZVwiKVxuXG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4Kys7XG5cbiAgICBsZXQgb2N0YWwgPSBmYWxzZTtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIHJldHVybiBuZXcgU3RyaW5nTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLCBzdHIsIG9jdGFsKTtcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICBpZiAoIWlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXG5cIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcclwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFx0XCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidVwiOlxuICAgICAgICAgICAgY2FzZSBcInhcIjpcbiAgICAgICAgICAgICAgbGV0IHJlc3RvcmUgPSB0aGlzLmluZGV4O1xuICAgICAgICAgICAgICBsZXQgdW5lc2NhcGVkO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHVuZXNjYXBlZCA9IGNoID09PSBcInVcIiA/IHRoaXMuc2NhbkhleEVzY2FwZTQoKSA6IHRoaXMuc2NhbkhleEVzY2FwZTIoKTtcbiAgICAgICAgICAgICAgaWYgKHVuZXNjYXBlZCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUodW5lc2NhcGVkKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gcmVzdG9yZTtcbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImJcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFxiXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXGZcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcdTAwMEJcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikge1xuICAgICAgICAgICAgICAgIG9jdGFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBsZXQgb2N0TGVuID0gMTtcbiAgICAgICAgICAgICAgICAvLyAzIGRpZ2l0cyBhcmUgb25seSBhbGxvd2VkIHdoZW4gc3RyaW5nIHN0YXJ0c1xuICAgICAgICAgICAgICAgIC8vIHdpdGggMCwgMSwgMiwgM1xuICAgICAgICAgICAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjNcIikge1xuICAgICAgICAgICAgICAgICAgb2N0TGVuID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGNvZGUgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlIChvY3RMZW4gPCAzICYmIFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICAgICAgICBjb2RlICo9IDg7XG4gICAgICAgICAgICAgICAgICBvY3RMZW4rKztcbiAgICAgICAgICAgICAgICAgIGNvZGUgKz0gY2ggLSBcIjBcIjtcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIGlmIChjaCA9PT0gXCJcXHJcIiAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICB9XG5cbiAgc2NhblJlZ0V4cCgpIHtcblxuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgLy8gY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleClcblxuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIHN0ciArPSBcIi9cIjtcbiAgICB0aGlzLmluZGV4Kys7XG5cbiAgICBsZXQgdGVybWluYXRlZCA9IGZhbHNlO1xuICAgIGxldCBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgLy8gRUNNQS0yNjIgNy44LjVcbiAgICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2xhc3NNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiXVwiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoY2ggPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiW1wiKSB7XG4gICAgICAgICAgICBjbGFzc01hcmtlciA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGVybWluYXRlZCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpICYmIGNoICE9PSBcIlxcXFxcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIHN0ciArPSBjaDtcbiAgICB9XG4gICAgdGhpcy5sb29rYWhlYWRFbmQgPSB0aGlzLmluZGV4O1xuICAgIHJldHVybiBuZXcgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCksIHN0cik7XG4gIH1cblxuICBhZHZhbmNlKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5za2lwQ29tbWVudCgpO1xuICAgIHRoaXMubGFzdFdoaXRlc3BhY2UgPSB0aGlzLmdldFNsaWNlKHN0YXJ0KTtcbiAgICB0aGlzLmxvb2thaGVhZFN0YXJ0ID1zdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBuZXcgRU9GVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgIH1cblxuICAgIGxldCBjaGFyQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG5cbiAgICBpZiAoY2hhckNvZGUgPCAweDgwKSB7XG4gICAgICBpZiAoUFVOQ1RVQVRPUl9TVEFSVFtjaGFyQ29kZV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKElERU5USUZJRVJfU1RBUlRbY2hhckNvZGVdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERvdCAoLikgVSswMDJFIGNhbiBhbHNvIHN0YXJ0IGEgZmxvYXRpbmctcG9sZXQgbnVtYmVyLCBoZW5jZSB0aGUgbmVlZFxuICAgICAgLy8gdG8gY2hlY2sgdGhlIG5leHQgY2hhcmFjdGVyLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDAwMkUpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzRGVjaW1hbERpZ2l0KHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblB1bmN0dWF0b3IoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RyaW5nIGxpdGVyYWwgc3RhcnRzIHdpdGggc2luZ2xlIHF1b3RlIChVKzAwMjcpIG9yIGRvdWJsZSBxdW90ZSAoVSswMDIyKS5cbiAgICAgIGlmIChjaGFyQ29kZSA9PT0gMHgwMDI3IHx8IGNoYXJDb2RlID09PSAweDAwMjIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhblN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKDB4MDAzMCAvKiAnMCcgKi8gPD0gY2hhckNvZGUgJiYgY2hhckNvZGUgPD0gMHgwMDM5IC8qICc5JyAqLykge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2xhc2ggKC8pIFUrMDAyRiBjYW4gYWxzbyBzdGFydCBhIHJlZ2V4LlxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaGFyQ29kZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbklkZW50aWZpZXIoKTtcbiAgICAgIH1cblxuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuICB9XG5cbiAgZW9mKCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRU9TO1xuICB9XG5cbiAgbGV4KCkge1xuICAgIGlmICh0aGlzLnByZXZUb2tlbiAhPT0gbnVsbCAmJiB0aGlzLnByZXZUb2tlbi50eXBlID09PSBUb2tlblR5cGUuRU9TKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcmV2VG9rZW47XG4gICAgfVxuICAgIHRoaXMucHJldlRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleCA9IHRoaXMubG9va2FoZWFkRW5kO1xuICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gZmFsc2U7XG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICB0aGlzLmxvb2thaGVhZEVuZCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCA9IHN0YXJ0O1xuICAgIHRoaXMudG9rZW5JbmRleCsrO1xuICAgIHJldHVybiB0aGlzLnByZXZUb2tlbjtcbiAgfVxufVxuIl19