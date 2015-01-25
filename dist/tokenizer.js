"use strict";

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var _classProps = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var getHexValue = require("./utils").getHexValue;
var isLineTerminator = require("./utils").isLineTerminator;
var isWhitespace = require("./utils").isWhitespace;
var isIdentifierStart = require("./utils").isIdentifierStart;
var isIdentifierPart = require("./utils").isIdentifierPart;
var isDecimalDigit = require("./utils").isDecimalDigit;
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

var Token = (function () {
  var Token = function Token(type, slice, octal) {
    this.type = type;
    this.slice = slice;
    this.octal = octal;
  };

  _classProps(Token, null, {
    value: {
      get: function () {}
    }
  });

  return Token;
})();

exports.Token = Token;
var IdentifierLikeToken = (function (Token) {
  var IdentifierLikeToken = function IdentifierLikeToken(type, slice) {
    Token.call(this, type, slice, false);
  };

  _extends(IdentifierLikeToken, Token);

  _classProps(IdentifierLikeToken, null, {
    value: {
      get: function () {
        return this.slice.text;
      }
    }
  });

  return IdentifierLikeToken;
})(Token);

exports.IdentifierLikeToken = IdentifierLikeToken;
var IdentifierToken = (function (IdentifierLikeToken) {
  var IdentifierToken = function IdentifierToken(slice) {
    IdentifierLikeToken.call(this, TokenType.IDENTIFIER, slice);
  };

  _extends(IdentifierToken, IdentifierLikeToken);

  return IdentifierToken;
})(IdentifierLikeToken);

exports.IdentifierToken = IdentifierToken;
var NullLiteralToken = (function (IdentifierLikeToken) {
  var NullLiteralToken = function NullLiteralToken(slice) {
    IdentifierLikeToken.call(this, TokenType.NULL_LITERAL, slice);
  };

  _extends(NullLiteralToken, IdentifierLikeToken);

  return NullLiteralToken;
})(IdentifierLikeToken);

exports.NullLiteralToken = NullLiteralToken;
var TrueLiteralToken = (function (IdentifierLikeToken) {
  var TrueLiteralToken = function TrueLiteralToken(slice) {
    IdentifierLikeToken.call(this, TokenType.TRUE_LITERAL, slice);
  };

  _extends(TrueLiteralToken, IdentifierLikeToken);

  return TrueLiteralToken;
})(IdentifierLikeToken);

exports.TrueLiteralToken = TrueLiteralToken;
var FalseLiteralToken = (function (IdentifierLikeToken) {
  var FalseLiteralToken = function FalseLiteralToken(slice) {
    IdentifierLikeToken.call(this, TokenType.FALSE_LITERAL, slice);
  };

  _extends(FalseLiteralToken, IdentifierLikeToken);

  return FalseLiteralToken;
})(IdentifierLikeToken);

exports.FalseLiteralToken = FalseLiteralToken;
var KeywordToken = (function (IdentifierLikeToken) {
  var KeywordToken = function KeywordToken(type, slice) {
    IdentifierLikeToken.call(this, type, slice);
  };

  _extends(KeywordToken, IdentifierLikeToken);

  return KeywordToken;
})(IdentifierLikeToken);

exports.KeywordToken = KeywordToken;
var PunctuatorToken = (function (Token) {
  var PunctuatorToken = function PunctuatorToken(type, slice) {
    Token.call(this, type, slice, false);
  };

  _extends(PunctuatorToken, Token);

  _classProps(PunctuatorToken, null, {
    value: {
      get: function () {
        return this.type.name;
      }
    }
  });

  return PunctuatorToken;
})(Token);

exports.PunctuatorToken = PunctuatorToken;
var RegularExpressionLiteralToken = (function (Token) {
  var RegularExpressionLiteralToken = function RegularExpressionLiteralToken(slice, value) {
    Token.call(this, TokenType.REGEXP, slice, false);
    this._value = value;
  };

  _extends(RegularExpressionLiteralToken, Token);

  _classProps(RegularExpressionLiteralToken, null, {
    value: {
      get: function () {
        return this._value;
      }
    }
  });

  return RegularExpressionLiteralToken;
})(Token);

exports.RegularExpressionLiteralToken = RegularExpressionLiteralToken;
var NumericLiteralToken = (function (Token) {
  var NumericLiteralToken = function NumericLiteralToken(slice, value, octal) {
    var _this = this;
    if (value === undefined) value = +slice.text;
    if (octal === undefined) octal = false;
    return (function () {
      Token.call(_this, TokenType.NUMBER, slice, octal);
      _this._value = value;
    })();
  };

  _extends(NumericLiteralToken, Token);

  _classProps(NumericLiteralToken, null, {
    value: {
      get: function () {
        return this._value.toString();
      }
    }
  });

  return NumericLiteralToken;
})(Token);

exports.NumericLiteralToken = NumericLiteralToken;
var StringLiteralToken = (function (Token) {
  var StringLiteralToken = function StringLiteralToken(slice, value, octal) {
    Token.call(this, TokenType.STRING, slice, octal);
    this._value = value;
  };

  _extends(StringLiteralToken, Token);

  _classProps(StringLiteralToken, null, {
    value: {
      get: function () {
        return this._value;
      }
    }
  });

  return StringLiteralToken;
})(Token);

exports.StringLiteralToken = StringLiteralToken;
var EOFToken = (function (Token) {
  var EOFToken = function EOFToken(slice) {
    Token.call(this, TokenType.EOS, slice, false);
  };

  _extends(EOFToken, Token);

  _classProps(EOFToken, null, {
    value: {
      get: function () {
        return "";
      }
    }
  });

  return EOFToken;
})(Token);

exports.EOFToken = EOFToken;
var JsError = function JsError(index, line, column, msg) {
  this.index = index;
  this.line = line;
  this.column = column;
  this.description = msg;
  this.message = "[" + line + ":" + column + "]: " + msg;
};

exports.JsError = JsError;
var Tokenizer = (function () {
  var Tokenizer = function Tokenizer(source) {
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
  };

  Tokenizer.prototype.trackBackLineNumber = function (position) {
    for (var line = this.lineStarts.length - 1; line >= 0; line--) {
      if ((position >= this.getLineStart(line))) {
        return line;
      }
    }
    return 0;
  };

  Tokenizer.prototype.createILLEGAL = function () {
    return this.createError(ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN);
  };

  Tokenizer.prototype.createUnexpected = function (token) {
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
        if ((token.type === TokenType.FUTURE_RESERVED_WORD)) {
          return this.createError(ErrorMessages.UNEXPECTED_RESERVED_WORD);
        }
        if ((token.type === TokenType.FUTURE_STRICT_RESERVED_WORD)) {
          return this.createError(ErrorMessages.STRICT_RESERVED_WORD);
        }
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.slice.text);
      case TokenClass.Punctuator:
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
      default:
        break;
    }
    return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.value || token.type.name);
  };

  Tokenizer.prototype.createError = function (message, arg) {
    var msg = message.replace(/{(\d+)}/g, function () {
      return arg;
    });
    var index = this.index;
    var line = this.trackBackLineNumber(index);
    return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
  };

  Tokenizer.prototype.createErrorWithToken = function (token, message, arg) {
    var msg = message.replace(/{(\d+)}/g, function () {
      return arg;
    });
    var index = token.slice.start;
    var line = this.trackBackLineNumber(index);
    return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
  };

  Tokenizer.prototype.getLineStart = function (line) {
    return this.lineStarts[line];
  };

  Tokenizer.cse2 = function (id, ch1, ch2) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2;
  };

  Tokenizer.cse3 = function (id, ch1, ch2, ch3) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3;
  };

  Tokenizer.cse4 = function (id, ch1, ch2, ch3, ch4) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4;
  };

  Tokenizer.cse5 = function (id, ch1, ch2, ch3, ch4, ch5) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5;
  };

  Tokenizer.cse6 = function (id, ch1, ch2, ch3, ch4, ch5, ch6) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6;
  };

  Tokenizer.cse7 = function (id, ch1, ch2, ch3, ch4, ch5, ch6, ch7) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6 && id.charAt(7) === ch7;
  };

  Tokenizer.getKeyword = function (id, strict) {
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
          case "w": // WHILE
            if (Tokenizer.cse4(id, "h", "i", "l", "e")) {
              return TokenType.WHILE;
            }
            break;
          case "b": // BREAK
            if (Tokenizer.cse4(id, "r", "e", "a", "k")) {
              return TokenType.BREAK;
            }
            break;
          case "c": // CATCH
            if (Tokenizer.cse4(id, "a", "t", "c", "h")) {
              return TokenType.CATCH;
            } else if (Tokenizer.cse4(id, "o", "n", "s", "t")) {
              return TokenType.CONST;
            } else if (Tokenizer.cse4(id, "l", "a", "s", "s")) {
              return TokenType.FUTURE_RESERVED_WORD;
            }
            break;
          case "t": // THROW
            if (Tokenizer.cse4(id, "h", "r", "o", "w")) {
              return TokenType.THROW;
            }
            break;
          case "y": // YIELD
            if (Tokenizer.cse4(id, "i", "e", "l", "d")) {
              return strict ? TokenType.FUTURE_STRICT_RESERVED_WORD : TokenType.ILLEGAL;
            }
            break;
          case "s": // SUPER
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
          case "d": // default
            if (Tokenizer.cse6(id, "e", "f", "a", "u", "l", "t")) {
              return TokenType.DEFAULT;
            }
            break;
          case "f": // finally
            if (Tokenizer.cse6(id, "i", "n", "a", "l", "l", "y")) {
              return TokenType.FINALLY;
            }
            break;
          case "e": // extends
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
  };

  Tokenizer.prototype.skipSingleLineComment = function (offset) {
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
  };

  Tokenizer.prototype.skipMultiLineComment = function () {
    this.index += 2;
    var length = this.source.length;
    var i = this.index;
    while (i < length) {
      var chCode = this.source.charCodeAt(i);
      if (chCode < 128) {
        switch (chCode) {
          case 42: // "*"
            // Block comment ends with "*/'.
            if (i + 1 < length && this.source.charAt(i + 1) === "/") {
              this.index = i + 2;
              return;
            }
            i++;
            break;
          case 10: // "\n"
            this.hasLineTerminatorBeforeNext = true;
            i++;
            this.lineStarts.push(this.index);
            break;
          case 12: // "\r":
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
  };

  Tokenizer.prototype.skipComment = function () {
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
        if ((this.source.charAt(this.index + 1) === "-") && (this.source.charAt(this.index + 2) === ">")) {
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
  };

  Tokenizer.prototype.scanHexEscape4 = function () {
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
  };

  Tokenizer.prototype.scanHexEscape2 = function () {
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
  };

  Tokenizer.prototype.getEscapedIdentifier = function () {
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
  };

  Tokenizer.prototype.getIdentifier = function () {
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
  };

  Tokenizer.prototype.scanIdentifier = function () {
    var start = this.index;

    // Backslash (U+005C) starts an escaped character.
    var id = this.source.charAt(this.index) === "\\" ? this.getEscapedIdentifier() : this.getIdentifier();

    // There is no keyword or literal with only one character.
    // Thus, it must be an identifier.
    var slice = { text: id, start: start, end: this.index };
    if ((id.length === 1)) {
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
  };

  Tokenizer.prototype.getSlice = function (start) {
    return { text: this.source.slice(start, this.index), start: start, end: this.index };
  };

  Tokenizer.prototype.scanPunctuatorHelper = function () {
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
  };

  Tokenizer.prototype.scanPunctuator = function () {
    var start = this.index;
    var subType = this.scanPunctuatorHelper();
    this.index += subType.name.length;
    return new PunctuatorToken(subType, this.getSlice(start));
  };

  Tokenizer.prototype.scanHexLiteral = function (start) {
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
  };

  Tokenizer.prototype.scanOctalLiteral = function (start) {
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
  };

  Tokenizer.prototype.scanNumericLiteral = function () {
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
  };

  Tokenizer.prototype.scanStringLiteral = function () {
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
  };

  Tokenizer.prototype.scanRegExp = function () {
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
  };

  Tokenizer.prototype.advance = function () {
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
  };

  Tokenizer.prototype.eof = function () {
    return this.lookahead.type === TokenType.EOS;
  };

  Tokenizer.prototype.lex = function () {
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
  };

  return Tokenizer;
})();

exports["default"] = Tokenizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCUSxXQUFXLHNCQUFYLFdBQVc7SUFBRSxnQkFBZ0Isc0JBQWhCLGdCQUFnQjtJQUFFLFlBQVksc0JBQVosWUFBWTtJQUFFLGlCQUFpQixzQkFBakIsaUJBQWlCO0lBQUUsZ0JBQWdCLHNCQUFoQixnQkFBZ0I7SUFBRSxjQUFjLHNCQUFkLGNBQWM7SUFDaEcsYUFBYSx1QkFBYixhQUFhO0FBRWQsSUFBTSxVQUFVLFdBQVYsVUFBVSxHQUFHO0FBQ3hCLGdCQUFjLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ2pDLEtBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDcEIsT0FBSyxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUMzQixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQzFCLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsZ0JBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDakMsWUFBVSxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUNoQyxlQUFhLEVBQUUsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQy9CLG1CQUFpQixFQUFFLEVBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFDO0FBQzlDLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsY0FBWSxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUM3QixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0NBQzNCLENBQUM7O0FBRUssSUFBTSxTQUFTLFdBQVQsU0FBUyxHQUFHO0FBQ3ZCLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekMsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsYUFBVyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUN0RCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxlQUFhLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3pELGdCQUFjLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzFELGdCQUFjLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzFELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdkQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxxQkFBbUIsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDakUsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDaEQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxjQUFZLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3pELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsV0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN0RCxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3RELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDN0MsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM3QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBQztBQUMzRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxV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LENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNsSCxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNySCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3BILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRXRGLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUVuQyxJQUFNLGdCQUFnQixHQUFHLENBQ3ZCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxD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QUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO0dBQzdFOztBQS9FRyxXQUFTLENBaUZOLElBQUksR0FBQSxVQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDbEMsV0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztHQUNyRzs7QUFuRkcsV0FBUyxDQXFGTixJQUFJLEdBQUEsVUFBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUN2QyxXQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQzNHLEdBQUcsQ0FBQztHQUNiOztBQXhGRyxXQUFTLENBMEZOLElBQUksR0FBQSxVQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUM1QyxXQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQzNHLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztHQUNyQzs7QUE3RkcsV0FBUyxDQStGTixJQUFJLEdBQUEsVUFBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQ2pELFdBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FDM0csR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO0dBQzdEOztBQWxHRyxXQUFTLENBb0dOLFVBQVUsR0FBQSxVQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUU7Ozs7O0FBSzVCLFFBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUU7QUFDckMsYUFBTyxTQUFTLENBQUMsT0FBTyxDQUFDO0tBQzFCO0FBQ0QsWUFBUSxFQUFFLENBQUMsTUFBTTtBQUNmLFdBQUssQ0FBQztBQUNKLGdCQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLGVBQUssR0FBRztBQUNOLG9CQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLG1CQUFLLEdBQUc7QUFDTix1QkFBTyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQUEsQUFDdEIsbUJBQUssR0FBRztBQUNOLHVCQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFBQSxBQUN0QjtBQUNFLHNCQUFNO0FBQUEsYUFDVDtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUN4QixxQkFBTyxTQUFTLENBQUMsRUFBRSxDQUFDO2FBQ3JCO0FBQ0Qsa0JBQU07QUFBQSxBQUNSO0FBQ0Usa0JBQU07QUFBQSxTQUNUO0FBQ0QsY0FBTTtBQUFBLEFBQ1IsV0FBSyxDQUFDO0FBQ0osZ0JBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbEIsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLHFCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7YUFDdEI7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLHFCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7YUFDdEI7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLHFCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7YUFDdEI7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLHFCQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7YUFDdEI7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hDLHFCQUFPLE1BQU0sR0FBRyxTQUFTLENBQUMsMkJBQTJCLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQzthQUN2RTtBQUNELGtCQUFNO0FBQUEsQUFDUjtBQUNFLGtCQUFNO0FBQUEsU0FDVDtBQUNELGNBQU07QUFBQSxBQUNSLFdBQUssQ0FBQztBQUNKLGdCQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLGVBQUssR0FBRztBQUNOLGdCQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDckMscUJBQU8sU0FBUyxDQUFDLElBQUksQ0FBQzthQUN2QjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3JDLHFCQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7YUFDdkIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDNUMscUJBQU8sU0FBUyxDQUFDLG9CQUFvQixDQUFDO2FBQ3ZDO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssR0FBRztBQUNOLGdCQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDckMscUJBQU8sU0FBUyxDQUFDLElBQUksQ0FBQzthQUN2QjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3JDLHFCQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUM7YUFDdkI7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNyQyxxQkFBTyxTQUFTLENBQUMsSUFBSSxDQUFDO2FBQ3ZCO0FBQ0Qsa0JBQU07QUFBQSxBQUNSO0FBQ0Usa0JBQU07QUFBQSxTQUNUO0FBQ0QsY0FBTTtBQUFBLEFBQ1IsV0FBSyxDQUFDO0FBQ0osZ0JBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbEIsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDMUMscUJBQU8sU0FBUyxDQUFDLEtBQUssQ0FBQzthQUN4QjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMxQyxxQkFBTyxTQUFTLENBQUMsS0FBSyxDQUFDO2FBQ3hCO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssR0FBRztBQUNOLGdCQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzFDLHFCQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUM7YUFDeEIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2pELHFCQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUM7YUFDeEIsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2pELHFCQUFPLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQzthQUN2QztBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMxQyxxQkFBTyxTQUFTLENBQUMsS0FBSyxDQUFDO2FBQ3hCO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssR0FBRztBQUNOLGdCQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzFDLHFCQUFPLE1BQU0sR0FBRyxTQUFTLENBQUMsMkJBQTJCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQzthQUMzRTtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMxQyxxQkFBTyxTQUFTLENBQUMsb0JBQW9CLENBQUM7YUFDdkM7QUFDRCxrQkFBTTtBQUFBLEFBQ1I7QUFDRSxrQkFBTTtBQUFBLFNBQ1Q7QUFDRCxjQUFNO0FBQUEsQUFDUixXQUFLLENBQUM7QUFDSixnQkFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNsQixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MscUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQzthQUN6QjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MscUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQzthQUN6QjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MscUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQzthQUN6QjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MscUJBQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQzthQUN6QixNQUFNLElBQUksTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNoRSxxQkFBTyxTQUFTLENBQUMsMkJBQTJCLENBQUM7YUFDOUM7QUFDRCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQy9DLHFCQUFPLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQzthQUN2QztBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0MscUJBQU8sU0FBUyxDQUFDLG9CQUFvQixDQUFDO2FBQ3ZDO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssR0FBRztBQUNOLGdCQUFJLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDekQscUJBQU8sU0FBUyxDQUFDLDJCQUEyQixDQUFDO2FBQzlDO0FBQ0Qsa0JBQU07QUFBQSxBQUNSO0FBQ0Usa0JBQU07QUFBQSxTQUNUO0FBQ0QsY0FBTTtBQUFBLEFBQ1IsV0FBSyxDQUFDO0FBQ0osZ0JBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbEIsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNwRCxxQkFBTyxTQUFTLENBQUMsT0FBTyxDQUFDO2FBQzFCO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssR0FBRztBQUNOLGdCQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDcEQscUJBQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQzthQUMxQjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3BELHFCQUFPLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQzthQUN2QztBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxNQUFNLEVBQUU7QUFDVixrQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsa0JBQUksU0FBUyxLQUFLLENBQUMsSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFO0FBQ3RDLHVCQUFPLFNBQVMsQ0FBQywyQkFBMkIsQ0FBQztlQUM5QzthQUNGO0FBQ0Qsa0JBQU07QUFBQSxBQUNSO0FBQ0Usa0JBQU07QUFBQSxTQUNUO0FBQ0QsY0FBTTtBQUFBLEFBQ1IsV0FBSyxDQUFDO0FBQ0osZ0JBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDbEIsZUFBSyxHQUFHO0FBQ04sZ0JBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDekQscUJBQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQzthQUMzQjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLEdBQUc7QUFDTixnQkFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUN6RCxxQkFBTyxTQUFTLENBQUMsUUFBUSxDQUFDO2FBQzNCO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssR0FBRztBQUNOLGdCQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ3pELHFCQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUM7YUFDM0I7QUFDRCxrQkFBTTtBQUFBLEFBQ1I7QUFDRSxrQkFBTTtBQUFBLFNBQ1Q7QUFDRCxjQUFNO0FBQUEsQUFDUixXQUFLLENBQUM7QUFDSixZQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7QUFDNUQsY0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsY0FBSSxXQUFXLEtBQUssQ0FBQyxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUU7QUFDMUMsbUJBQU8sU0FBUyxDQUFDLDJCQUEyQixDQUFDO1dBQzlDO1NBQ0Y7QUFDRCxjQUFNO0FBQUEsQUFDUixXQUFLLEVBQUU7QUFDUDtBQUNFLGNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGNBQUksWUFBWSxLQUFLLENBQUMsRUFBRTtBQUN0QixtQkFBTyxTQUFTLENBQUMsVUFBVSxDQUFDO1dBQzdCLE1BQU0sSUFBSSxNQUFNLElBQUksWUFBWSxLQUFLLENBQUMsRUFBRTtBQUN2QyxtQkFBTyxTQUFTLENBQUMsMkJBQTJCLENBQUM7V0FDOUM7U0FDRjtBQUNDLGNBQU07QUFBQSxBQUNSO0FBQ0UsY0FBTTtBQUFBLEtBQ1Q7QUFDRCxXQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUM7R0FDMUI7O0FBN1ZHLFdBQVMsV0ErVmIscUJBQXFCLEdBQUEsVUFBQyxNQUFNLEVBQUU7QUFDNUIsUUFBSSxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUM7QUFDckIsV0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFOzs7O0FBSXRDLFVBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoRCxVQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixVQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzVCLFlBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7QUFDeEMsWUFBSSxNQUFNLEtBQUssRUFBTSxXQUFBLElBQWUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQ2pHLEVBQU0sVUFBQSxFQUFZO0FBQ3hCLGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNkO0FBQ0QsWUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLGVBQU87T0FDUjtLQUNGO0dBQ0Y7O0FBalhHLFdBQVMsV0FtWGIsb0JBQW9CLEdBQUEsWUFBRztBQUNyQixRQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztBQUNoQixRQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNoQyxRQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ25CLFdBQU8sQ0FBQyxHQUFHLE1BQU0sRUFBRTtBQUNqQixVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QyxVQUFJLE1BQU0sR0FBRyxHQUFJLEVBQUU7QUFDakIsZ0JBQVEsTUFBTTtBQUNaLGVBQUssRUFBRTs7QUFFTCxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3ZELGtCQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkIscUJBQU87YUFDUjtBQUNELGFBQUMsRUFBRSxDQUFDO0FBQ0osa0JBQU07QUFBQSxBQUNSLGVBQUssRUFBRTtBQUNMLGdCQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDO0FBQ3hDLGFBQUMsRUFBRSxDQUFDO0FBQ0osZ0JBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxFQUFFO0FBQ0wsZ0JBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7QUFDeEMsZ0JBQUksQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtBQUN4RCxlQUFDLEVBQUUsQ0FBQzthQUNMO0FBQ0QsYUFBQyxFQUFFLENBQUM7QUFDSixnQkFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLGtCQUFNO0FBQUEsQUFDUjtBQUNFLGFBQUMsRUFBRSxDQUFDO0FBQUEsU0FDUDtPQUNGLE1BQU0sSUFBSSxNQUFNLEtBQUssSUFBTSxJQUFJLE1BQU0sS0FBSyxJQUFNLEVBQUU7QUFDakQsU0FBQyxFQUFFLENBQUM7QUFDSixZQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDbEMsTUFBTTtBQUNMLFNBQUMsRUFBRSxDQUFDO09BQ0w7S0FDRjtBQUNELFFBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsVUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7R0FDNUI7O0FBNVpHLFdBQVMsV0ErWmIsV0FBVyxHQUFBLFlBQUc7QUFDWixRQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztBQUNuQyxRQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQzs7QUFFaEMsV0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRTtBQUMxQixVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEQsVUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDeEIsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO09BQ2QsTUFBTSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ25DLFlBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUM7QUFDeEMsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsWUFBSSxNQUFNLEtBQUssRUFBRSxXQUFBLElBQWUsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtBQUM5RixjQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDZDtBQUNELFlBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxtQkFBVyxHQUFHLElBQUksQ0FBQztPQUNwQixNQUFNLElBQUksTUFBTSxLQUFLLEVBQUUsVUFBQSxFQUFZO0FBQ2xDLFlBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFO0FBQzVCLGdCQUFNO1NBQ1A7QUFDRCxjQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNoRCxZQUFJLE1BQU0sS0FBSyxFQUFFLFVBQUEsRUFBWTtBQUMzQixjQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIscUJBQVcsR0FBRyxJQUFJLENBQUM7U0FDcEIsTUFBTSxJQUFJLE1BQU0sS0FBSyxFQUFFLFVBQUEsRUFBWTtBQUNsQyxjQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUM3QixNQUFNO0FBQ0wsZ0JBQU07U0FDUDtPQUNGLE1BQU0sSUFBSSxXQUFXLElBQUksTUFBTSxLQUFLLEVBQUUsVUFBQSxFQUFZO0FBQ2pELFlBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFO0FBQzVCLGdCQUFNO1NBQ1A7O0FBRUQsWUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFOztBQUVoRyxjQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0IsTUFBTTtBQUNMLGdCQUFNO1NBQ1A7T0FDRixNQUFNLElBQUksTUFBTSxLQUFLLEVBQUUsVUFBQSxFQUFZO0FBQ2xDLFlBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQ3hHLEdBQUcsSUFDSixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNqRCxjQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0IsTUFBTTtBQUNMLGdCQUFNO1NBQ1A7T0FDRixNQUFNO0FBQ0wsY0FBTTtPQUNQO0tBQ0Y7R0FDRjs7QUFuZEcsV0FBUyxXQXFkYixjQUFjLEdBQUEsWUFBRztBQUNmLFFBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdkMsYUFBTyxDQUFDLENBQUMsQ0FBQztLQUNYO0FBQ0QsUUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3JELFFBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2IsYUFBTyxDQUFDLENBQUMsQ0FBQztLQUNYO0FBQ0QsUUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxRQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNiLGFBQU8sQ0FBQyxDQUFDLENBQUM7S0FDWDtBQUNELFFBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsUUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDYixhQUFPLENBQUMsQ0FBQyxDQUFDO0tBQ1g7QUFDRCxRQUFJLEVBQUUsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELFFBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ2IsYUFBTyxDQUFDLENBQUMsQ0FBQztLQUNYO0FBQ0QsUUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7QUFDaEIsV0FBTyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7R0FDMUM7O0FBM2VHLFdBQVMsV0E2ZWIsY0FBYyxHQUFBLFlBQUc7QUFDZixRQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3ZDLGFBQU8sQ0FBQyxDQUFDLENBQUM7S0FDWDtBQUNELFFBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNyRCxRQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNiLGFBQU8sQ0FBQyxDQUFDLENBQUM7S0FDWDtBQUNELFFBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsUUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDYixhQUFPLENBQUMsQ0FBQyxDQUFDO0tBQ1g7QUFDRCxRQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztBQUNoQixXQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0dBQ3JCOztBQTNmRyxXQUFTLFdBNmZiLG9CQUFvQixHQUFBLFlBQUc7QUFDckIsUUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLFFBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLFFBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNwQyxZQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztLQUM1Qjs7QUFFRCxRQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7O0FBRVosUUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO0FBQ2YsVUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQzFDLGNBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO09BQzVCO0FBQ0QsVUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsVUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3BDLGNBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO09BQzVCO0FBQ0QsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2hDLFVBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxHQUFHLEtBQUssRUFBTSxXQUFBLElBQWdCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDcEUsY0FBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7T0FDNUI7QUFDRCxRQUFFLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMvQjtBQUNELE1BQUUsSUFBSSxFQUFFLENBQUM7O0FBRVQsV0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLFFBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEMsVUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO0FBQ3RELGNBQU07T0FDUDtBQUNELFVBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLFVBQUksRUFBRSxLQUFLLElBQUksRUFBRTtBQUNmLFlBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNwQyxnQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDNUI7QUFDRCxZQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDMUMsZ0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzVCO0FBQ0QsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsWUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3BDLGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1QjtBQUNELFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNoQyxZQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFLLEVBQU0sV0FBQSxJQUFlLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDbEUsZ0JBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzVCO0FBQ0QsVUFBRSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDL0I7QUFDRCxRQUFFLElBQUksRUFBRSxDQUFDO0tBQ1Y7O0FBRUQsV0FBTyxFQUFFLENBQUM7R0FDWDs7QUFqakJHLFdBQVMsV0FtakJiLGFBQWEsR0FBQSxZQUFHO0FBQ2QsUUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN2QixRQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixRQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMzQixRQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ25CLFdBQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNaLFVBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLFVBQUksRUFBRSxLQUFLLElBQUksRUFBRTs7QUFFZixZQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNuQixlQUFPLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO09BQ3BDLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDN0MsU0FBQyxFQUFFLENBQUM7T0FDTCxNQUFNO0FBQ0wsY0FBTTtPQUNQO0tBQ0Y7QUFDRCxRQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLFdBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUM3Qzs7QUF0a0JHLFdBQVMsV0F3a0JiLGNBQWMsR0FBQSxZQUFHO0FBQ2YsUUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzs7O0FBR3ZCLFFBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOzs7O0FBSXRHLFFBQUksS0FBSyxHQUFHLEVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFDLENBQUM7QUFDL0MsUUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDckIsYUFBTyxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNuQzs7QUFFRCxRQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDcEQsUUFBSSxPQUFPLEtBQUssU0FBUyxDQUFDLE9BQU8sRUFBRTtBQUNqQyxhQUFPLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN6Qzs7QUFFRCxRQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ25CLFVBQUksTUFBTSxLQUFLLEVBQUUsRUFBRTtBQUNqQixlQUFPLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDcEMsTUFBTSxJQUFJLE1BQU0sS0FBSyxFQUFFLEVBQUU7QUFDeEIsZUFBTyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ3BDO0tBQ0Y7O0FBRUQsUUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssRUFBRSxFQUFFO0FBQ3JDLGFBQU8sSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNyQzs7QUFFRCxXQUFPLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQ25DOztBQXZtQkcsV0FBUyxXQXltQmIsUUFBUSxHQUFBLFVBQUMsS0FBSyxFQUFFO0FBQ2QsV0FBTyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUMsQ0FBQztHQUNwRjs7QUEzbUJHLFdBQVMsV0E2bUJiLG9CQUFvQixHQUFBLFlBQUc7QUFDckIsUUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUV6QyxZQUFRLEdBQUc7O0FBRVQsV0FBSyxHQUFHO0FBQ04sZUFBTyxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsQUFDMUIsV0FBSyxHQUFHO0FBQ04sZUFBTyxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsQUFDMUIsV0FBSyxHQUFHLEVBQUM7QUFDVCxXQUFLLEdBQUcsRUFBQztBQUNULFdBQUssR0FBRztBQUNOLGVBQU8sbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDaEQsV0FBSyxHQUFHO0FBQ04sZUFBTyxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsQUFDMUIsV0FBSyxHQUFHLEVBQUM7QUFDVCxXQUFLLEdBQUcsRUFBQztBQUNULFdBQUssR0FBRyxFQUFDO0FBQ1QsV0FBSyxHQUFHLEVBQUM7QUFDVCxXQUFLLEdBQUcsRUFBQztBQUNULFdBQUssR0FBRztBQUNOLGVBQU8sbUJBQW1CLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDaEQ7O0FBRUUsWUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNyRixrQkFBUSxHQUFHO0FBQ1QsaUJBQUssR0FBRztBQUNOLGtCQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3JGLHVCQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7ZUFDNUI7QUFDRCxxQkFBTyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQUEsQUFDdEIsaUJBQUssR0FBRztBQUNOLGtCQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQ3JGLHVCQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7ZUFDNUI7QUFDRCxxQkFBTyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQUEsQUFDdEIsaUJBQUssR0FBRztBQUNOLHFCQUFPLFNBQVMsQ0FBQyxhQUFhLENBQUM7QUFBQSxBQUNqQyxpQkFBSyxHQUFHO0FBQ04scUJBQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUFBLEFBQzlCLGlCQUFLLEdBQUc7QUFDTixxQkFBTyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQUEsQUFDOUIsaUJBQUssR0FBRztBQUNOLHFCQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFBQSxBQUM5QixpQkFBSyxHQUFHO0FBQ04scUJBQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUFBLEFBQ3ZCLGlCQUFLLEdBQUc7QUFDTixxQkFBTyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQUEsQUFDdkIsaUJBQUssR0FBRztBQUNOLHFCQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFBQSxBQUM5QixpQkFBSyxHQUFHO0FBQ04scUJBQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUFBLEFBQzlCLGlCQUFLLEdBQUc7QUFDTixxQkFBTyxTQUFTLENBQUMsY0FBYyxDQUFDO0FBQUEsQUFDbEMsaUJBQUssR0FBRztBQUNOLHFCQUFPLFNBQVMsQ0FBQyxjQUFjLENBQUM7QUFBQSxBQUNsQztBQUNFLG9CQUFNO0FBQUEsV0FDVDtTQUNGO0FBQUEsS0FDSjs7QUFFRCxRQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3ZDLFVBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDN0MsVUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFO0FBQ2YsWUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUN2QyxjQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzdDLGNBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFOztBQUU5QixnQkFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNyRixxQkFBTyxTQUFTLENBQUMsbUJBQW1CLENBQUM7YUFDdEM7QUFDRCxtQkFBTyxTQUFTLENBQUMsWUFBWSxDQUFDO1dBQy9COztBQUVELGNBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFO0FBQzlCLG1CQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUM7V0FDN0I7O0FBRUQsY0FBSSxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUU7QUFDOUIsbUJBQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztXQUM3QjtTQUNGOztBQUVELGdCQUFRLEdBQUc7QUFDVCxlQUFLLEdBQUc7QUFDTixtQkFBTyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQUEsQUFDdkIsZUFBSyxHQUFHO0FBQ04sbUJBQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUFBLEFBQ3ZCLGVBQUssR0FBRztBQUNOLG1CQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFBQSxBQUN2QixlQUFLLEdBQUc7QUFDTixtQkFBTyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQUEsQUFDdkIsZUFBSyxHQUFHO0FBQ04sbUJBQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUFBLEFBQ3ZCLGVBQUssR0FBRztBQUNOLG1CQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFBQSxBQUN0QjtBQUNFLGtCQUFNO0FBQUEsU0FDVDtPQUNGO0tBQ0Y7O0FBRUQsV0FBTyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDL0M7O0FBcnRCRyxXQUFTLFdBd3RCYixjQUFjLEdBQUEsWUFBRztBQUNmLFFBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDdkIsUUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDMUMsUUFBSSxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUNsQyxXQUFPLElBQUksZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7R0FDM0Q7O0FBN3RCRyxXQUFTLFdBK3RCYixjQUFjLEdBQUEsVUFBQyxLQUFLLEVBQUU7QUFDcEIsUUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNuQixXQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUM3QixVQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixVQUFJLEdBQUcsR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDMUIsVUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDZCxjQUFNO09BQ1A7QUFDRCxPQUFDLEVBQUUsQ0FBQztLQUNMOztBQUVELFFBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUU7QUFDcEIsWUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7S0FDNUI7O0FBRUQsUUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUMxRSxZQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztLQUM1Qjs7QUFFRCxRQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzs7QUFFZixRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLFdBQU8sSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDM0U7O0FBdHZCRyxXQUFTLFdBd3ZCYixnQkFBZ0IsR0FBQSxVQUFDLEtBQUssRUFBRTtBQUN0QixXQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdEMsVUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLFVBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFO0FBQzdCLGNBQU07T0FDUDtBQUNELFVBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUNkOztBQUVELFFBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUN0RixjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUN0RCxZQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztLQUM1Qjs7QUFFRCxXQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQzlHOztBQXZ3QkcsV0FBUyxXQXl3QmIsa0JBQWtCLEdBQUEsWUFBRztBQUNuQixRQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRXhDLFFBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7O0FBRXZCLFFBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUNkLFVBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLFVBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNuQyxVQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLFlBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO0FBQzVCLGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGlCQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUNqQyxpQkFBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckM7T0FDRixNQUFNO0FBQ0wsZUFBTyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztPQUN0RDtLQUNGLE1BQU0sSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFOztBQUVyQixRQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLGFBQU8sR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzdCLFlBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLFlBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNyQyxpQkFBTyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN0RDtBQUNELFVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDckM7S0FDRjs7QUFFRCxRQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDVixRQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDZCxVQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixVQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDckMsZUFBTyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztPQUN0RDs7QUFFRCxRQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLGFBQU8sR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzdCLFNBQUMsRUFBRSxDQUFDO0FBQ0osWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsWUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLGlCQUFPLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ3REO0FBQ0QsVUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNyQztLQUNGOzs7QUFHRCxRQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTtBQUM1QixVQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixVQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDckMsY0FBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7T0FDNUI7O0FBRUQsUUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNwQyxVQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7QUFDaEIsVUFBSSxFQUFFLEtBQUssR0FBRyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDNUIsV0FBRyxHQUFHLEVBQUUsS0FBSyxHQUFHLENBQUM7QUFDakIsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsWUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLGdCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUM1QjtBQUNELFVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDckM7O0FBRUQsVUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1YsVUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDMUIsZUFBTyxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLEVBQUU7QUFDN0IsV0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNSLFdBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUNULGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGNBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNyQyxrQkFBTTtXQUNQO0FBQ0QsWUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNyQztPQUNGLE1BQU07QUFDTCxjQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztPQUM1QjtBQUNELE9BQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ25COztBQUVELFFBQUksaUJBQWlCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3ZDLFlBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0tBQzVCOztBQUVELFdBQU8sSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7R0FDdEQ7O0FBajJCRyxXQUFTLFdBbzJCYixpQkFBaUIsR0FBQSxZQUFHO0FBQ2xCLFFBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQzs7QUFFYixRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7OztBQUczQyxRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7QUFFYixRQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDbEIsV0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLFVBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxVQUFJLEVBQUUsS0FBSyxLQUFLLEVBQUU7QUFDaEIsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsZUFBTyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ2pFLE1BQU0sSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO0FBQ3RCLFlBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLFlBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtBQUNyQyxnQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7U0FDNUI7QUFDRCxVQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLFlBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDdkMsa0JBQVEsRUFBRTtBQUNSLGlCQUFLLEdBQUc7QUFDTixpQkFBRyxJQUFJLElBQUksQ0FBQztBQUNaLGtCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixvQkFBTTtBQUFBLEFBQ1IsaUJBQUssR0FBRztBQUNOLGlCQUFHLElBQUksSUFBSSxDQUFDO0FBQ1osa0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLG9CQUFNO0FBQUEsQUFDUixpQkFBSyxHQUFHO0FBQ04saUJBQUcsSUFBSSxJQUFJLENBQUM7QUFDWixrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isb0JBQU07QUFBQSxBQUNSLGlCQUFLLEdBQUcsRUFBQztBQUNULGlCQUFLLEdBQUc7QUFDTixrQkFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN6QixrQkFBSSxTQUFTLFlBQUEsQ0FBQztBQUNkLGtCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixrQkFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3BDLHNCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztlQUM1QjtBQUNELHVCQUFTLEdBQUcsRUFBRSxLQUFLLEdBQUcsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZFLGtCQUFJLFNBQVMsSUFBSSxDQUFDLEVBQUU7QUFDbEIsbUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2VBQ3ZDLE1BQU07QUFDTCxvQkFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7QUFDckIsbUJBQUcsSUFBSSxFQUFFLENBQUM7QUFDVixvQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2VBQ2Q7QUFDRCxvQkFBTTtBQUFBLEFBQ1IsaUJBQUssR0FBRztBQUNOLGlCQUFHLElBQUksSUFBSSxDQUFDO0FBQ1osa0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLG9CQUFNO0FBQUEsQUFDUixpQkFBSyxHQUFHO0FBQ04saUJBQUcsSUFBSSxJQUFJLENBQUM7QUFDWixrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isb0JBQU07QUFBQSxBQUNSLGlCQUFLLEdBQUc7QUFDTixpQkFBRyxJQUFJLFFBQVEsQ0FBQztBQUNoQixrQkFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2Isb0JBQU07QUFBQSxBQUNSO0FBQ0Usa0JBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLHFCQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2Isb0JBQUksTUFBTSxHQUFHLENBQUMsQ0FBQzs7O0FBR2Ysb0JBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzFCLHdCQUFNLEdBQUcsQ0FBQyxDQUFDO2lCQUNaO0FBQ0Qsb0JBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNiLHVCQUFPLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFO0FBQzNDLHNCQUFJLElBQUksQ0FBQyxDQUFDO0FBQ1Ysd0JBQU0sRUFBRSxDQUFDO0FBQ1Qsc0JBQUksSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLHNCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixzQkFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3JDLDBCQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzttQkFDNUI7QUFDRCxvQkFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDckM7QUFDRCxtQkFBRyxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7ZUFDbEMsTUFBTTtBQUNMLG1CQUFHLElBQUksRUFBRSxDQUFDO0FBQ1Ysb0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztlQUNkO0FBQUEsV0FDSjtTQUNGLE1BQU07QUFDTCxjQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDO0FBQ3hDLGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGNBQUksRUFBRSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQzFELGdCQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7V0FDZDtTQUNGO09BQ0YsTUFBTSxJQUFJLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM3QyxjQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztPQUM1QixNQUFNO0FBQ0wsV0FBRyxJQUFJLEVBQUUsQ0FBQztBQUNWLFlBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztPQUNkO0tBQ0Y7O0FBRUQsVUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7R0FDNUI7O0FBOThCRyxXQUFTLFdBZzlCYixVQUFVLEdBQUEsWUFBRztBQUVYLFFBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7OztBQUd2QixRQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixPQUFHLElBQUksR0FBRyxDQUFDO0FBQ1gsUUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUViLFFBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN2QixRQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDeEIsV0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLFVBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxVQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDZixXQUFHLElBQUksRUFBRSxDQUFDO0FBQ1YsWUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsVUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFcEMsWUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDdEMsZ0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztTQUM1RDtBQUNELFdBQUcsSUFBSSxFQUFFLENBQUM7QUFDVixZQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7T0FDZCxNQUFNLElBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzdDLGNBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztPQUM1RCxNQUFNO0FBQ0wsWUFBSSxXQUFXLEVBQUU7QUFDZixjQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDZCx1QkFBVyxHQUFHLEtBQUssQ0FBQztXQUNyQjtTQUNGLE1BQU07QUFDTCxjQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDZCxzQkFBVSxHQUFHLElBQUksQ0FBQztBQUNsQixlQUFHLElBQUksRUFBRSxDQUFDO0FBQ1YsZ0JBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNiLGtCQUFNO1dBQ1AsTUFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7QUFDckIsdUJBQVcsR0FBRyxJQUFJLENBQUM7V0FDcEI7U0FDRjtBQUNELFdBQUcsSUFBSSxFQUFFLENBQUM7QUFDVixZQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7T0FDZDtLQUNGOztBQUVELFFBQUksQ0FBQyxVQUFVLEVBQUU7QUFDZixZQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7S0FDNUQ7O0FBRUQsV0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RDLFVBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxVQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDdEQsY0FBTTtPQUNQO0FBQ0QsVUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsU0FBRyxJQUFJLEVBQUUsQ0FBQztLQUNYO0FBQ0QsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQy9CLFdBQU8sSUFBSSw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQ3JFOztBQTNnQ0csV0FBUyxXQTZnQ2IsT0FBTyxHQUFBLFlBQUc7QUFDUixRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNuQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0MsUUFBSSxDQUFDLGNBQWMsR0FBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzs7QUFFeEMsUUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3BDLGFBQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQzNDOztBQUVELFFBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFbEQsUUFBSSxRQUFRLEdBQUcsR0FBSSxFQUFFO0FBQ25CLFVBQUksZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDOUIsZUFBTyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7T0FDOUI7O0FBRUQsVUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM5QixlQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztPQUM5Qjs7OztBQUlELFVBQUksUUFBUSxLQUFLLEVBQU0sRUFBRTtBQUN2QixZQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDN0YsaUJBQU8sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7U0FDbEM7QUFDRCxlQUFPLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztPQUM5Qjs7O0FBR0QsVUFBSSxRQUFRLEtBQUssRUFBTSxJQUFJLFFBQVEsS0FBSyxFQUFNLEVBQUU7QUFDOUMsZUFBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztPQUNqQzs7QUFFRCxVQUFJLEVBQU0sY0FBYyxRQUFRLElBQUksUUFBUSxJQUFJLEVBQU0sVUFBQSxFQUFZO0FBQ2hFLGVBQU8sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7T0FDbEM7OztBQUdELFlBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0tBQzVCLE1BQU07QUFDTCxVQUFJLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQy9CLGVBQU8sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO09BQzlCOztBQUVELFlBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0tBQzVCO0dBQ0Y7O0FBN2pDRyxXQUFTLFdBK2pDYixHQUFHLEdBQUEsWUFBRztBQUNKLFdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQztHQUM5Qzs7QUFqa0NHLFdBQVMsV0Fta0NiLEdBQUcsR0FBQSxZQUFHO0FBQ0osUUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxFQUFFO0FBQ3BFLGFBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztLQUN2QjtBQUNELFFBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUNoQyxRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDM0MsUUFBSSxDQUFDLDJCQUEyQixHQUFHLEtBQUssQ0FBQztBQUN6QyxRQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxRQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDL0IsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDbkIsUUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2xCLFdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztHQUN2Qjs7U0Eva0NHLFNBQVM7OztxQkFBVCxTQUFTIiwiZmlsZSI6InNyYy90b2tlbml6ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXG5pbXBvcnQge2dldEhleFZhbHVlLCBpc0xpbmVUZXJtaW5hdG9yLCBpc1doaXRlc3BhY2UsIGlzSWRlbnRpZmllclN0YXJ0LCBpc0lkZW50aWZpZXJQYXJ0LCBpc0RlY2ltYWxEaWdpdH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7RXJyb3JNZXNzYWdlc30gZnJvbSBcIi4vZXJyb3JzXCI7XG5cbmV4cG9ydCBjb25zdCBUb2tlbkNsYXNzID0ge1xuICBCb29sZWFuTGl0ZXJhbDoge25hbWU6IFwiQm9vbGVhblwifSxcbiAgRW9mOiB7bmFtZTogXCI8RW5kPlwifSxcbiAgSWRlbnQ6IHtuYW1lOiBcIklkZW50aWZpZXJcIn0sXG4gIEtleXdvcmQ6IHtuYW1lOiBcIktleXdvcmRcIn0sXG4gIE51bGxMaXRlcmFsOiB7bmFtZTogXCJOdWxsXCJ9LFxuICBOdW1lcmljTGl0ZXJhbDoge25hbWU6IFwiTnVtZXJpY1wifSxcbiAgUHVuY3R1YXRvcjoge25hbWU6IFwiUHVuY3R1YXRvclwifSxcbiAgU3RyaW5nTGl0ZXJhbDoge25hbWU6IFwiU3RyaW5nXCJ9LFxuICBSZWd1bGFyRXhwcmVzc2lvbjoge25hbWU6IFwiUmVndWxhckV4cHJlc3Npb25cIn0sXG4gIExpbmVDb21tZW50OiB7bmFtZTogXCJMaW5lXCJ9LFxuICBCbG9ja0NvbW1lbnQ6IHtuYW1lOiBcIkJsb2NrXCJ9LFxuICBJbGxlZ2FsOiB7bmFtZTogXCJJbGxlZ2FsXCJ9XG59O1xuXG5leHBvcnQgY29uc3QgVG9rZW5UeXBlID0ge1xuICBFT1M6IHtrbGFzczogVG9rZW5DbGFzcy5Fb2YsIG5hbWU6IFwiRU9TXCJ9LFxuICBMUEFSRU46IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIihcIn0sXG4gIFJQQVJFTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKVwifSxcbiAgTEJSQUNLOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJbXCJ9LFxuICBSQlJBQ0s6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl1cIn0sXG4gIExCUkFDRToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwie1wifSxcbiAgUkJSQUNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ9XCJ9LFxuICBDT0xPTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiOlwifSxcbiAgU0VNSUNPTE9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI7XCJ9LFxuICBQRVJJT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi5cIn0sXG4gIENPTkRJVElPTkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI/XCJ9LFxuICBJTkM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIisrXCJ9LFxuICBERUM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi0tXCJ9LFxuICBBU1NJR046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj1cIn0sXG4gIEFTU0lHTl9CSVRfT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInw9XCJ9LFxuICBBU1NJR05fQklUX1hPUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXj1cIn0sXG4gIEFTU0lHTl9CSVRfQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImPVwifSxcbiAgQVNTSUdOX1NITDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPDw9XCJ9LFxuICBBU1NJR05fU0hSOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+Pj1cIn0sXG4gIEFTU0lHTl9TSFJfVU5TSUdORUQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+Pj1cIn0sXG4gIEFTU0lHTl9BREQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIis9XCJ9LFxuICBBU1NJR05fU1VCOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCItPVwifSxcbiAgQVNTSUdOX01VTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKj1cIn0sXG4gIEFTU0lHTl9ESVY6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi89XCJ9LFxuICBBU1NJR05fTU9EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIlPVwifSxcbiAgQ09NTUE6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIixcIn0sXG4gIE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8fFwifSxcbiAgQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImJlwifSxcbiAgQklUX09SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ8XCJ9LFxuICBCSVRfWE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJeXCJ9LFxuICBCSVRfQU5EOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCImXCJ9LFxuICBTSEw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw8XCJ9LFxuICBTSFI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+XCJ9LFxuICBTSFJfVU5TSUdORUQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+PlwifSxcbiAgQUREOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIrXCJ9LFxuICBTVUI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi1cIn0sXG4gIE1VTDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKlwifSxcbiAgRElWOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIvXCJ9LFxuICBNT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiVcIn0sXG4gIEVROiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI9PVwifSxcbiAgTkU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiE9XCJ9LFxuICBFUV9TVFJJQ1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj09PVwifSxcbiAgTkVfU1RSSUNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIhPT1cIn0sXG4gIExUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8XCJ9LFxuICBHVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPlwifSxcbiAgTFRFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PVwifSxcbiAgR1RFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+PVwifSxcbiAgSU5TVEFOQ0VPRjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaW5zdGFuY2VvZlwifSxcbiAgSU46IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImluXCJ9LFxuICBOT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiFcIn0sXG4gIEJJVF9OT1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn5cIn0sXG4gIERFTEVURToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVsZXRlXCJ9LFxuICBUWVBFT0Y6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInR5cGVvZlwifSxcbiAgVk9JRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidm9pZFwifSxcbiAgQlJFQUs6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImJyZWFrXCJ9LFxuICBDQVNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXNlXCJ9LFxuICBDQVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY2F0Y2hcIn0sXG4gIENPTlRJTlVFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb250aW51ZVwifSxcbiAgREVCVUdHRVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlYnVnZ2VyXCJ9LFxuICBERUZBVUxUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkZWZhdWx0XCJ9LFxuICBETzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZG9cIn0sXG4gIEVMU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImVsc2VcIn0sXG4gIEZJTkFMTFk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImZpbmFsbHlcIn0sXG4gIEZPUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZm9yXCJ9LFxuICBGVU5DVElPTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZnVuY3Rpb25cIn0sXG4gIElGOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpZlwifSxcbiAgTkVXOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJuZXdcIn0sXG4gIFJFVFVSTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwicmV0dXJuXCJ9LFxuICBTV0lUQ0g6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInN3aXRjaFwifSxcbiAgVEhJUzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidGhpc1wifSxcbiAgVEhST1c6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRocm93XCJ9LFxuICBUUlk6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInRyeVwifSxcbiAgVkFSOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ2YXJcIn0sXG4gIFdISUxFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ3aGlsZVwifSxcbiAgV0lUSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwid2l0aFwifSxcbiAgTlVMTF9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuTnVsbExpdGVyYWwsIG5hbWU6IFwibnVsbFwifSxcbiAgVFJVRV9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuQm9vbGVhbkxpdGVyYWwsIG5hbWU6IFwidHJ1ZVwifSxcbiAgRkFMU0VfTElURVJBTDoge2tsYXNzOiBUb2tlbkNsYXNzLkJvb2xlYW5MaXRlcmFsLCBuYW1lOiBcImZhbHNlXCJ9LFxuICBOVU1CRVI6IHtrbGFzczogVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFNUUklORzoge2tsYXNzOiBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWwsIG5hbWU6IFwiXCJ9LFxuICBSRUdFWFA6IHtrbGFzczogVG9rZW5DbGFzcy5SZWd1bGFyRXhwcmVzc2lvbiwgbmFtZTogXCJcIn0sXG4gIElERU5USUZJRVI6IHtrbGFzczogVG9rZW5DbGFzcy5JZGVudCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9SRVNFUlZFRF9XT1JEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJcIn0sXG4gIEZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiXCJ9LFxuICBDT05TVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiY29uc3RcIn0sXG4gIExFVDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwibGV0XCJ9LFxuICBJTExFR0FMOiB7a2xhc3M6IFRva2VuQ2xhc3MuSWxsZWdhbCwgbmFtZTogXCJcIn1cbn07XG5cbmNvbnN0IFRUID0gVG9rZW5UeXBlO1xuY29uc3QgSSA9IFRULklMTEVHQUw7XG5jb25zdCBGID0gZmFsc2U7XG5jb25zdCBUID0gdHJ1ZTtcblxuY29uc3QgT05FX0NIQVJfUFVOQ1RVQVRPUiA9IFtcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTk9ULCBJLCBJLCBJLFxuICBUVC5NT0QsIFRULkJJVF9BTkQsIEksIFRULkxQQVJFTiwgVFQuUlBBUkVOLCBUVC5NVUwsIFRULkFERCwgVFQuQ09NTUEsIFRULlNVQiwgVFQuUEVSSU9ELCBUVC5ESVYsIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIFRULkNPTE9OLCBUVC5TRU1JQ09MT04sIFRULkxULCBUVC5BU1NJR04sIFRULkdULCBUVC5DT05ESVRJT05BTCwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNLLCBJLCBUVC5SQlJBQ0ssIFRULkJJVF9YT1IsIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksXG4gIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIEksIFRULkxCUkFDRSwgVFQuQklUX09SLCBUVC5SQlJBQ0UsIFRULkJJVF9OT1RdO1xuXG5jb25zdCBQVU5DVFVBVE9SX1NUQVJUID0gW1xuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBGLCBGLCBULCBULFxuICBGLCBULCBULCBULCBULCBULCBULCBGLCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBULCBULCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBGXTtcblxuY29uc3QgSURFTlRJRklFUl9TVEFSVCA9IFtcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgRiwgRixcbiAgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgRiwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCxcbiAgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgRiwgVCwgRiwgRiwgVCwgRiwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCwgVCxcbiAgVCwgVCwgVCwgVCwgVCwgVCwgRiwgRiwgRiwgRiwgRl07XG5cbmV4cG9ydCBjbGFzcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlLCBvY3RhbCkge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5zbGljZSA9IHNsaWNlO1xuICAgIHRoaXMub2N0YWwgPSBvY3RhbDtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpZmllckxpa2VUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnNsaWNlLnRleHQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIElkZW50aWZpZXJUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5JREVOVElGSUVSLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bGxMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuTlVMTF9MSVRFUkFMLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRydWVMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuVFJVRV9MSVRFUkFMLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZhbHNlTGl0ZXJhbFRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkZBTFNFX0xJVEVSQUwsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS2V5d29yZFRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQdW5jdHVhdG9yVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHR5cGUsIHNsaWNlKSB7XG4gICAgc3VwZXIodHlwZSwgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlLm5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuUkVHRVhQLCBzbGljZSwgZmFsc2UpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOdW1lcmljTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUgPSArc2xpY2UudGV4dCwgb2N0YWwgPSBmYWxzZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5OVU1CRVIsIHNsaWNlLCBvY3RhbCk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyaW5nTGl0ZXJhbFRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSwgdmFsdWUsIG9jdGFsKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLlNUUklORywgc2xpY2UsIG9jdGFsKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRU9GVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLkVPUywgc2xpY2UsIGZhbHNlKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSnNFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGluZGV4LCBsaW5lLCBjb2x1bW4sIG1zZykge1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICB0aGlzLmxpbmUgPSBsaW5lO1xuICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuICAgIHRoaXMuZGVzY3JpcHRpb24gPSBtc2c7XG4gICAgdGhpcy5tZXNzYWdlID0gYFske2xpbmV9OiR7Y29sdW1ufV06ICR7bXNnfWA7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHRcbmNsYXNzIFRva2VuaXplciB7XG4gIGNvbnN0cnVjdG9yKHNvdXJjZSkge1xuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIHRoaXMubGluZVN0YXJ0cyA9IFswXTtcbiAgICB0aGlzLmxvb2thaGVhZFN0YXJ0ID0gMDtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuICAgIHRoaXMubG9va2FoZWFkRW5kID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4ID0gMDtcbiAgICB0aGlzLnN0cmljdCA9IGZhbHNlO1xuICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gZmFsc2U7XG4gICAgdGhpcy5wcmV2VG9rZW4gPSBudWxsO1xuICAgIHRoaXMudG9rZW5JbmRleCA9IDA7XG4gICAgdGhpcy5saW5lU3RhcnRzID0gWzBdO1xuICB9XG5cbiAgdHJhY2tCYWNrTGluZU51bWJlcihwb3NpdGlvbikge1xuICAgIGZvciAobGV0IGxpbmUgPSB0aGlzLmxpbmVTdGFydHMubGVuZ3RoIC0gMTsgbGluZSA+PSAwOyBsaW5lLS0pIHtcbiAgICAgIGlmICgocG9zaXRpb24gPj0gdGhpcy5nZXRMaW5lU3RhcnQobGluZSkpKSB7XG4gICAgICAgIHJldHVybiBsaW5lO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGNyZWF0ZUlMTEVHQUwoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lMTEVHQUxfVE9LRU4pO1xuICB9XG5cbiAgY3JlYXRlVW5leHBlY3RlZCh0b2tlbikge1xuICAgIHN3aXRjaCAodG9rZW4udHlwZS5rbGFzcykge1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLkVvZjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0VPUyk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuTnVtZXJpY0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9OVU1CRVIpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9TVFJJTkcpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLklkZW50OlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfSURFTlRJRklFUik7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuS2V5d29yZDpcbiAgICAgICAgaWYgKCh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnNsaWNlLnRleHQpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLlB1bmN0dWF0b3I6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4udHlwZS5uYW1lKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnZhbHVlIHx8IHRva2VuLnR5cGUubmFtZSk7XG4gIH1cblxuICBjcmVhdGVFcnJvcihtZXNzYWdlLCBhcmcpIHtcbiAgICBsZXQgbXNnID0gbWVzc2FnZS5yZXBsYWNlKC97KFxcZCspfS9nLCAoKSA9PiBhcmcpO1xuICAgIGxldCBpbmRleCA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IGxpbmUgPSB0aGlzLnRyYWNrQmFja0xpbmVOdW1iZXIoaW5kZXgpO1xuICAgIHJldHVybiBuZXcgSnNFcnJvcihpbmRleCwgbGluZSArIDEsIGluZGV4IC0gdGhpcy5nZXRMaW5lU3RhcnQobGluZSkgKyAxLCBtc2cpO1xuICB9XG5cbiAgY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIG1lc3NhZ2UsIGFyZykge1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csICgpID0+IGFyZyk7XG4gICAgbGV0IGluZGV4ID0gdG9rZW4uc2xpY2Uuc3RhcnQ7XG4gICAgbGV0IGxpbmUgPSB0aGlzLnRyYWNrQmFja0xpbmVOdW1iZXIoaW5kZXgpO1xuICAgIHJldHVybiBuZXcgSnNFcnJvcihpbmRleCwgbGluZSArIDEsIGluZGV4IC0gdGhpcy5nZXRMaW5lU3RhcnQobGluZSkgKyAxLCBtc2cpO1xuICB9XG5cbiAgZ2V0TGluZVN0YXJ0KGxpbmUpIHtcbiAgICByZXR1cm4gdGhpcy5saW5lU3RhcnRzW2xpbmVdO1xuICB9XG5cbiAgc3RhdGljIGNzZTIoaWQsIGNoMSwgY2gyKSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyO1xuICB9XG5cbiAgc3RhdGljIGNzZTMoaWQsIGNoMSwgY2gyLCBjaDMpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDM7XG4gIH1cblxuICBzdGF0aWMgY3NlNChpZCwgY2gxLCBjaDIsIGNoMywgY2g0KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0O1xuICB9XG5cbiAgc3RhdGljIGNzZTUoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCwgY2g1KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0ICYmIGlkLmNoYXJBdCg1KVxuICAgICAgICA9PT0gY2g1O1xuICB9XG5cbiAgc3RhdGljIGNzZTYoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCwgY2g1LCBjaDYpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDUgJiYgaWQuY2hhckF0KDYpID09PSBjaDY7XG4gIH1cblxuICBzdGF0aWMgY3NlNyhpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUsIGNoNiwgY2g3KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0ICYmIGlkLmNoYXJBdCg1KVxuICAgICAgICA9PT0gY2g1ICYmIGlkLmNoYXJBdCg2KSA9PT0gY2g2ICYmIGlkLmNoYXJBdCg3KSA9PT0gY2g3O1xuICB9XG5cbiAgc3RhdGljIGdldEtleXdvcmQoaWQsIHN0cmljdCkge1xuICAgIC8vIFwiY29uc3RcIiBpcyBzcGVjaWFsaXplZCBhcyBLZXl3b3JkIGluIFY4LlxuICAgIC8vIFwieWllbGRcIiBhbmQgXCJsZXRcIiBhcmUgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBTcGlkZXJNb25rZXkgYW5kIEVTLm5leHQuXG4gICAgLy8gU29tZSBvdGhlcnMgYXJlIGZyb20gZnV0dXJlIHJlc2VydmVkIHdvcmRzLlxuXG4gICAgaWYgKGlkLmxlbmd0aCA9PT0gMSB8fCBpZC5sZW5ndGggPiAxMCkge1xuICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTExFR0FMO1xuICAgIH1cbiAgICBzd2l0Y2ggKGlkLmxlbmd0aCkge1xuICAgICAgY2FzZSAyOlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgxKSkge1xuICAgICAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSUY7XG4gICAgICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTjtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoaWQuY2hhckF0KDEpID09PSBcIm9cIikge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRPO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiYVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5WQVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcIm9cIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRk9SO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJlXCIsIFwid1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5FVztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiclwiLCBcInlcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UUlk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwibFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImVcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEIDogVG9rZW5UeXBlLkxFVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNDpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImhcIiwgXCJpXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRISVM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImxcIiwgXCJzXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVMU0U7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcIm5cIiwgXCJ1XCIsIFwibVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJhXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DQVNFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJvXCIsIFwiaVwiLCBcImRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5WT0lEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIndcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJpXCIsIFwidFwiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5XSVRIO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA1OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ3XCI6IC8vIFdISUxFXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiaFwiLCBcImlcIiwgXCJsXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLldISUxFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImJcIjogLy8gQlJFQUtcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJyXCIsIFwiZVwiLCBcImFcIiwgXCJrXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQlJFQUs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOiAvLyBDQVRDSFxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImFcIiwgXCJ0XCIsIFwiY1wiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DQVRDSDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwib1wiLCBcIm5cIiwgXCJzXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNPTlNUO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJsXCIsIFwiYVwiLCBcInNcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOiAvLyBUSFJPV1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImhcIiwgXCJyXCIsIFwib1wiLCBcIndcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5USFJPVztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ5XCI6IC8vIFlJRUxEXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiaVwiLCBcImVcIiwgXCJsXCIsIFwiZFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRCA6IFRva2VuVHlwZS5JTExFR0FMO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInNcIjogLy8gU1VQRVJcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJ1XCIsIFwicFwiLCBcImVcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDY6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJlXCIsIFwidFwiLCBcInVcIiwgXCJyXCIsIFwiblwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlJFVFVSTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwieVwiLCBcInBcIiwgXCJlXCIsIFwib1wiLCBcImZcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5UWVBFT0Y7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcImVcIiwgXCJsXCIsIFwiZVwiLCBcInRcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVMRVRFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJ3XCIsIFwiaVwiLCBcInRcIiwgXCJjXCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNXSVRDSDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIFRva2VuaXplci5jc2U1KGlkLCBcInRcIiwgXCJhXCIsIFwidFwiLCBcImlcIiwgXCJjXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJ4XCIsIFwicFwiLCBcIm9cIiwgXCJyXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImlcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJtXCIsIFwicFwiLCBcIm9cIiwgXCJyXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBcIjpcbiAgICAgICAgICAgIGlmIChzdHJpY3QgJiYgVG9rZW5pemVyLmNzZTUoaWQsIFwidVwiLCBcImJcIiwgXCJsXCIsIFwiaVwiLCBcImNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDc6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImRcIjogLy8gZGVmYXVsdFxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcImVcIiwgXCJmXCIsIFwiYVwiLCBcInVcIiwgXCJsXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFRkFVTFQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZlwiOiAvLyBmaW5hbGx5XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwiaVwiLCBcIm5cIiwgXCJhXCIsIFwibFwiLCBcImxcIiwgXCJ5XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRklOQUxMWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6IC8vIGV4dGVuZHNcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJ4XCIsIFwidFwiLCBcImVcIiwgXCJuXCIsIFwiZFwiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwXCI6XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgICAgICAgIGlmIChcInByaXZhdGVcIiA9PT0gcyB8fCBcInBhY2thZ2VcIiA9PT0gcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDg6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJ1XCIsIFwiblwiLCBcImNcIiwgXCJ0XCIsIFwiaVwiLCBcIm9cIiwgXCJuXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVOQ1RJT047XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcIm9cIiwgXCJuXCIsIFwidFwiLCBcImlcIiwgXCJuXCIsIFwidVwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DT05USU5VRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwiZVwiLCBcImJcIiwgXCJ1XCIsIFwiZ1wiLCBcImdcIiwgXCJlXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFQlVHR0VSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA5OlxuICAgICAgICBpZiAoc3RyaWN0ICYmIChpZC5jaGFyQXQoMCkgPT09IFwicFwiIHx8IGlkLmNoYXJBdCgwKSA9PT0gXCJpXCIpKSB7XG4gICAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgICBpZiAoXCJwcm90ZWN0ZWRcIiA9PT0gcyB8fCBcImludGVyZmFjZVwiID09PSBzKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDEwOlxuICAgICAge1xuICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICBpZiAoXCJpbnN0YW5jZW9mXCIgPT09IHMpIHtcbiAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOU1RBTkNFT0Y7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RyaWN0ICYmIFwiaW1wbGVtZW50c1wiID09PSBzKSB7XG4gICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIFRva2VuVHlwZS5JTExFR0FMO1xuICB9XG5cbiAgc2tpcFNpbmdsZUxpbmVDb21tZW50KG9mZnNldCkge1xuICAgIHRoaXMuaW5kZXggKz0gb2Zmc2V0O1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAvKipcbiAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgKi9cbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2hDb2RlKSkge1xuICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgIGlmIChjaENvZGUgPT09IDB4MDAwRCAvKiBcIlxcclwiICovICYmIHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KVxuICAgICAgICAgICAgPT09IDB4MDAwQSAvKlwiXFxuXCIgKi8pIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBza2lwTXVsdGlMaW5lQ29tbWVudCgpIHtcbiAgICB0aGlzLmluZGV4ICs9IDI7XG4gICAgbGV0IGxlbmd0aCA9IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuaW5kZXg7XG4gICAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNoQ29kZSA8IDB4ODApIHtcbiAgICAgICAgc3dpdGNoIChjaENvZGUpIHtcbiAgICAgICAgICBjYXNlIDQyOiAgLy8gXCIqXCJcbiAgICAgICAgICAgIC8vIEJsb2NrIGNvbW1lbnQgZW5kcyB3aXRoIFwiKi8nLlxuICAgICAgICAgICAgaWYgKGkgKyAxIDwgbGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdChpICsgMSkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXggPSBpICsgMjtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMDogIC8vIFwiXFxuXCJcbiAgICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMjogLy8gXCJcXHJcIjpcbiAgICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChpIDwgbGVuZ3RoIC0gMSAmJiB0aGlzLnNvdXJjZS5jaGFyQXQoaSArIDEpID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDB4MjAyOCB8fCBjaENvZGUgPT09IDB4MjAyOSkge1xuICAgICAgICBpKys7XG4gICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmluZGV4ID0gaTtcbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgfVxuXG5cbiAgc2tpcENvbW1lbnQoKSB7XG4gICAgbGV0IGlzTGluZVN0YXJ0ID0gdGhpcy5pbmRleCA9PT0gMDtcbiAgICBsZXQgbGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGxldCBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGlzV2hpdGVzcGFjZShjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAoY2hDb2RlID09PSAxMyAvKiBcIlxcclwiICovICYmIHRoaXMuaW5kZXggPCBsZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNDcgLyogXCIvXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCArIDEpO1xuICAgICAgICBpZiAoY2hDb2RlID09PSA0NyAvKiBcIi9cIiAqLykge1xuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDIpO1xuICAgICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDQyIC8qIFwiKlwiICovKSB7XG4gICAgICAgICAgdGhpcy5za2lwTXVsdGlMaW5lQ29tbWVudCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVN0YXJ0ICYmIGNoQ29kZSA9PT0gNDUgLyogXCItXCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyID49IGxlbmd0aCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFUrMDAzRSBpcyBcIj4nXG4gICAgICAgIGlmICgodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCItXCIpICYmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpID09PSBcIj5cIikpIHtcbiAgICAgICAgICAvLyBcIi0tPlwiIGlzIGEgc2luZ2xlLWxpbmUgY29tbWVudFxuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNjAgLyogXCI8XCIgKi8pIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyA0IDw9IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIiFcIiAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpXG4gICAgICAgICAgICA9PT0gXCItXCJcbiAgICAgICAgICAgICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykgPT09IFwiLVwiKSB7XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoNCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNjYW5IZXhFc2NhcGU0KCkge1xuICAgIGlmICh0aGlzLmluZGV4ICsgNCA+IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjEgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpO1xuICAgIGlmIChyMSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIyID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSk7XG4gICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjMgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpKTtcbiAgICBpZiAocjMgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByNCA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykpO1xuICAgIGlmIChyNCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgdGhpcy5pbmRleCArPSA0O1xuICAgIHJldHVybiByMSA8PCAxMiB8IHIyIDw8IDggfCByMyA8PCA0IHwgcjQ7XG4gIH1cblxuICBzY2FuSGV4RXNjYXBlMigpIHtcbiAgICBpZiAodGhpcy5pbmRleCArIDIgPiB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIxID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKTtcbiAgICBpZiAocjEgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMiA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpO1xuICAgIGlmIChyMiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIHJldHVybiByMSA8PCA0IHwgcjI7XG4gIH1cblxuICBnZXRFc2NhcGVkSWRlbnRpZmllcigpIHtcbiAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgbGV0IGlkID0gXCJcIjtcblxuICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwidVwiKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgbGV0IGljaCA9IHRoaXMuc2NhbkhleEVzY2FwZTQoKTtcbiAgICAgIGlmIChpY2ggPCAwIHx8IGljaCA9PT0gMHgwMDVDIC8qIFwiXFxcXFwiICovICB8fCAhaXNJZGVudGlmaWVyU3RhcnQoaWNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpY2gpO1xuICAgIH1cbiAgICBpZCArPSBjaDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSAmJiBjaCAhPT0gXCJcXFxcXCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgIT09IFwidVwiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaWNoID0gdGhpcy5zY2FuSGV4RXNjYXBlNCgpO1xuICAgICAgICBpZiAoaWNoIDwgMCB8fCBpY2ggPT09IDB4MDA1QyAvKiBcIlxcXFxcIiAqLyB8fCAhaXNJZGVudGlmaWVyUGFydChpY2gpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGljaCk7XG4gICAgICB9XG4gICAgICBpZCArPSBjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gaWQ7XG4gIH1cblxuICBnZXRJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCsrO1xuICAgIGxldCBsID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5pbmRleDtcbiAgICB3aGlsZSAoaSA8IGwpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdChpKTtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgLy8gR28gYmFjayBhbmQgdHJ5IHRoZSBoYXJkIG9uZS5cbiAgICAgICAgdGhpcy5pbmRleCA9IHN0YXJ0O1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRFc2NhcGVkSWRlbnRpZmllcigpO1xuICAgICAgfSBlbHNlIGlmIChpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmluZGV4ID0gaTtcbiAgICByZXR1cm4gdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIHRoaXMuaW5kZXgpO1xuICB9XG5cbiAgc2NhbklkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIC8vIEJhY2tzbGFzaCAoVSswMDVDKSBzdGFydHMgYW4gZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgbGV0IGlkID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcXFxcIiA/IHRoaXMuZ2V0RXNjYXBlZElkZW50aWZpZXIoKSA6IHRoaXMuZ2V0SWRlbnRpZmllcigpO1xuXG4gICAgLy8gVGhlcmUgaXMgbm8ga2V5d29yZCBvciBsaXRlcmFsIHdpdGggb25seSBvbmUgY2hhcmFjdGVyLlxuICAgIC8vIFRodXMsIGl0IG11c3QgYmUgYW4gaWRlbnRpZmllci5cbiAgICBsZXQgc2xpY2UgPSB7dGV4dDogaWQsIHN0YXJ0LCBlbmQ6IHRoaXMuaW5kZXh9O1xuICAgIGlmICgoaWQubGVuZ3RoID09PSAxKSkge1xuICAgICAgcmV0dXJuIG5ldyBJZGVudGlmaWVyVG9rZW4oc2xpY2UpO1xuICAgIH1cblxuICAgIGxldCBzdWJUeXBlID0gVG9rZW5pemVyLmdldEtleXdvcmQoaWQsIHRoaXMuc3RyaWN0KTtcbiAgICBpZiAoc3ViVHlwZSAhPT0gVG9rZW5UeXBlLklMTEVHQUwpIHtcbiAgICAgIHJldHVybiBuZXcgS2V5d29yZFRva2VuKHN1YlR5cGUsIHNsaWNlKTtcbiAgICB9XG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSA0KSB7XG4gICAgICBpZiAoXCJudWxsXCIgPT09IGlkKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVsbExpdGVyYWxUb2tlbihzbGljZSk7XG4gICAgICB9IGVsc2UgaWYgKFwidHJ1ZVwiID09PSBpZCkge1xuICAgICAgICByZXR1cm4gbmV3IFRydWVMaXRlcmFsVG9rZW4oc2xpY2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpZC5sZW5ndGggPT09IDUgJiYgXCJmYWxzZVwiID09PSBpZCkge1xuICAgICAgcmV0dXJuIG5ldyBGYWxzZUxpdGVyYWxUb2tlbihzbGljZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBJZGVudGlmaWVyVG9rZW4oc2xpY2UpO1xuICB9XG5cbiAgZ2V0U2xpY2Uoc3RhcnQpIHtcbiAgICByZXR1cm4ge3RleHQ6IHRoaXMuc291cmNlLnNsaWNlKHN0YXJ0LCB0aGlzLmluZGV4KSwgc3RhcnQ6IHN0YXJ0LCBlbmQ6IHRoaXMuaW5kZXh9O1xuICB9XG5cbiAgc2NhblB1bmN0dWF0b3JIZWxwZXIoKSB7XG4gICAgbGV0IGNoMSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcblxuICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAvLyBDaGVjayBmb3IgbW9zdCBjb21tb24gc2luZ2xlLWNoYXJhY3RlciBwdW5jdHVhdG9ycy5cbiAgICAgIGNhc2UgXCIuXCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MUEFSRU47XG4gICAgICBjYXNlIFwiKVwiOlxuICAgICAgY2FzZSBcIjtcIjpcbiAgICAgIGNhc2UgXCIsXCI6XG4gICAgICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuTEJSQUNFO1xuICAgICAgY2FzZSBcIn1cIjpcbiAgICAgIGNhc2UgXCJbXCI6XG4gICAgICBjYXNlIFwiXVwiOlxuICAgICAgY2FzZSBcIjpcIjpcbiAgICAgIGNhc2UgXCI/XCI6XG4gICAgICBjYXNlIFwiflwiOlxuICAgICAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBcIj1cIiAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIj1cIikge1xuICAgICAgICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAgICAgICBjYXNlIFwiPVwiOlxuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRX1NUUklDVDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRO1xuICAgICAgICAgICAgY2FzZSBcIiFcIjpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORV9TVFJJQ1Q7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORTtcbiAgICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9PUjtcbiAgICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0FERDtcbiAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NVQjtcbiAgICAgICAgICAgIGNhc2UgXCIqXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX01VTDtcbiAgICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTFRFO1xuICAgICAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5HVEU7XG4gICAgICAgICAgICBjYXNlIFwiL1wiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9ESVY7XG4gICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9NT0Q7XG4gICAgICAgICAgICBjYXNlIFwiXlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfWE9SO1xuICAgICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGJyZWFrOyAvL2ZhaWxlZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoMiA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSk7XG4gICAgICBpZiAoY2gxID09PSBjaDIpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IGNoMyA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMik7XG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI+XCIgJiYgY2gzID09PSBcIj5cIikge1xuICAgICAgICAgICAgLy8gNC1jaGFyYWN0ZXIgcHVuY3R1YXRvcjogPj4+PVxuICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAzIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NIUl9VTlNJR05FRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hSX1VOU0lHTkVEO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjaDEgPT09IFwiPFwiICYmIGNoMyA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NITDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2gxID09PSBcIj5cIiAmJiBjaDMgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSFI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyIDItY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiArKyAtLSA8PCA+PiAmJiB8fFxuICAgICAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOQztcbiAgICAgICAgICBjYXNlIFwiLVwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUM7XG4gICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hMO1xuICAgICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNIUjtcbiAgICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BTkQ7XG4gICAgICAgICAgY2FzZSBcInxcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuT1I7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrOyAvL2ZhaWxlZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICB9XG5cbiAgLy8gNy43IFB1bmN0dWF0b3JzXG4gIHNjYW5QdW5jdHVhdG9yKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IHN1YlR5cGUgPSB0aGlzLnNjYW5QdW5jdHVhdG9ySGVscGVyKCk7XG4gICAgdGhpcy5pbmRleCArPSBzdWJUeXBlLm5hbWUubGVuZ3RoO1xuICAgIHJldHVybiBuZXcgUHVuY3R1YXRvclRva2VuKHN1YlR5cGUsIHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgfVxuXG4gIHNjYW5IZXhMaXRlcmFsKHN0YXJ0KSB7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBsZXQgaGV4ID0gZ2V0SGV4VmFsdWUoY2gpO1xuICAgICAgaWYgKGhleCA9PT0gLTEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPT09IGkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZGV4ID0gaTtcblxuICAgIGxldCBzbGljZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQpO1xuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbihzbGljZSwgcGFyc2VJbnQoc2xpY2UudGV4dC5zdWJzdHIoMiksIDE2KSk7XG4gIH1cblxuICBzY2FuT2N0YWxMaXRlcmFsKHN0YXJ0KSB7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmICghKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiAoaXNJZGVudGlmaWVyU3RhcnQodGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KSlcbiAgICAgICAgfHwgaXNEZWNpbWFsRGlnaXQodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSwgcGFyc2VJbnQodGhpcy5nZXRTbGljZShzdGFydCkudGV4dC5zdWJzdHIoMSksIDgpLCB0cnVlKTtcbiAgfVxuXG4gIHNjYW5OdW1lcmljTGl0ZXJhbCgpIHtcbiAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgLy8gYXNzZXJ0KGNoID09PSBcIi5cIiB8fCBcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIilcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgaWYgKGNoID09PSBcIjBcIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIGlmIChjaCA9PT0gXCJ4XCIgfHwgY2ggPT09IFwiWFwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5IZXhMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgfSBlbHNlIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5PY3RhbExpdGVyYWwoc3RhcnQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggIT09IFwiLlwiKSB7XG4gICAgICAvLyBNdXN0IGJlIFwiMScuLic5J1xuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgZSA9IDA7XG4gICAgaWYgKGNoID09PSBcIi5cIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgICAgfVxuXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICBlKys7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRU9GIG5vdCByZWFjaGVkIGhlcmVcbiAgICBpZiAoY2ggPT09IFwiZVwiIHx8IGNoID09PSBcIkVcIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cblxuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBsZXQgbmVnID0gZmFsc2U7XG4gICAgICBpZiAoY2ggPT09IFwiK1wiIHx8IGNoID09PSBcIi1cIikge1xuICAgICAgICBuZWcgPSBjaCA9PT0gXCItXCI7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBsZXQgZiA9IDA7XG4gICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgICAgZiAqPSAxMDtcbiAgICAgICAgICBmICs9ICtjaDtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIGUgKz0gbmVnID8gZiA6IC1mO1xuICAgIH1cblxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgfVxuXG4gIC8vIDcuOC40IFN0cmluZyBMaXRlcmFsc1xuICBzY2FuU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcblxuICAgIGxldCBxdW90ZSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAvLyAgYXNzZXJ0KChxdW90ZSA9PT0gXCJcXFwiXCIgfHwgcXVvdGUgPT09IFwiXCJcIiksIFwiU3RyaW5nIGxpdGVyYWwgbXVzdCBzdGFydHMgd2l0aCBhIHF1b3RlXCIpXG5cbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXgrKztcblxuICAgIGxldCBvY3RhbCA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IHF1b3RlKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCksIHN0ciwgb2N0YWwpO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIGlmICghaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcblwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFxyXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXHRcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgICAgICBjYXNlIFwieFwiOlxuICAgICAgICAgICAgICBsZXQgcmVzdG9yZSA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICAgIGxldCB1bmVzY2FwZWQ7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdW5lc2NhcGVkID0gY2ggPT09IFwidVwiID8gdGhpcy5zY2FuSGV4RXNjYXBlNCgpIDogdGhpcy5zY2FuSGV4RXNjYXBlMigpO1xuICAgICAgICAgICAgICBpZiAodW5lc2NhcGVkID49IDApIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1bmVzY2FwZWQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYlwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXGJcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcZlwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFx1MDAwQlwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICAgICAgb2N0YWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGxldCBvY3RMZW4gPSAxO1xuICAgICAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAgICAgLy8gd2l0aCAwLCAxLCAyLCAzXG4gICAgICAgICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiM1wiKSB7XG4gICAgICAgICAgICAgICAgICBvY3RMZW4gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgY29kZSA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG9jdExlbiA8IDMgJiYgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgICAgICAgICAgIGNvZGUgKj0gODtcbiAgICAgICAgICAgICAgICAgIG9jdExlbisrO1xuICAgICAgICAgICAgICAgICAgY29kZSArPSBjaCAtIFwiMFwiO1xuICAgICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKGNoID09PSBcIlxcclwiICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gIH1cblxuICBzY2FuUmVnRXhwKCkge1xuXG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAvLyBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KVxuXG4gICAgbGV0IHN0ciA9IFwiXCI7XG4gICAgc3RyICs9IFwiL1wiO1xuICAgIHRoaXMuaW5kZXgrKztcblxuICAgIGxldCB0ZXJtaW5hdGVkID0gZmFsc2U7XG4gICAgbGV0IGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICAvLyBFQ01BLTI2MiA3LjguNVxuICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjbGFzc01hcmtlcikge1xuICAgICAgICAgIGlmIChjaCA9PT0gXCJdXCIpIHtcbiAgICAgICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChjaCA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgIHRlcm1pbmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJbXCIpIHtcbiAgICAgICAgICAgIGNsYXNzTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0ZXJtaW5hdGVkKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkgJiYgY2ggIT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgc3RyICs9IGNoO1xuICAgIH1cbiAgICB0aGlzLmxvb2thaGVhZEVuZCA9IHRoaXMuaW5kZXg7XG4gICAgcmV0dXJuIG5ldyBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSwgc3RyKTtcbiAgfVxuXG4gIGFkdmFuY2UoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLnNraXBDb21tZW50KCk7XG4gICAgdGhpcy5sYXN0V2hpdGVzcGFjZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQpO1xuICAgIHRoaXMubG9va2FoZWFkU3RhcnQgPXN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG5ldyBFT0ZUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgfVxuXG4gICAgbGV0IGNoYXJDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcblxuICAgIGlmIChjaGFyQ29kZSA8IDB4ODApIHtcbiAgICAgIGlmIChQVU5DVFVBVE9SX1NUQVJUW2NoYXJDb2RlXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoSURFTlRJRklFUl9TVEFSVFtjaGFyQ29kZV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbklkZW50aWZpZXIoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRG90ICguKSBVKzAwMkUgY2FuIGFsc28gc3RhcnQgYSBmbG9hdGluZy1wb2xldCBudW1iZXIsIGhlbmNlIHRoZSBuZWVkXG4gICAgICAvLyB0byBjaGVjayB0aGUgbmV4dCBjaGFyYWN0ZXIuXG4gICAgICBpZiAoY2hhckNvZGUgPT09IDB4MDAyRSkge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgaXNEZWNpbWFsRGlnaXQodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdHJpbmcgbGl0ZXJhbCBzdGFydHMgd2l0aCBzaW5nbGUgcXVvdGUgKFUrMDAyNykgb3IgZG91YmxlIHF1b3RlIChVKzAwMjIpLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDAwMjcgfHwgY2hhckNvZGUgPT09IDB4MDAyMikge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoMHgwMDMwIC8qICcwJyAqLyA8PSBjaGFyQ29kZSAmJiBjaGFyQ29kZSA8PSAweDAwMzkgLyogJzknICovKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5OdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTbGFzaCAoLykgVSswMDJGIGNhbiBhbHNvIHN0YXJ0IGEgcmVnZXguXG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoYXJDb2RlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuSWRlbnRpZmllcigpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG4gIH1cblxuICBlb2YoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5FT1M7XG4gIH1cblxuICBsZXgoKSB7XG4gICAgaWYgKHRoaXMucHJldlRva2VuICE9PSBudWxsICYmIHRoaXMucHJldlRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5FT1MpIHtcbiAgICAgIHJldHVybiB0aGlzLnByZXZUb2tlbjtcbiAgICB9XG4gICAgdGhpcy5wcmV2VG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4ID0gdGhpcy5sb29rYWhlYWRFbmQ7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuICAgIHRoaXMubG9va2FoZWFkRW5kID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4ID0gc3RhcnQ7XG4gICAgdGhpcy50b2tlbkluZGV4Kys7XG4gICAgcmV0dXJuIHRoaXMucHJldlRva2VuO1xuICB9XG59XG4iXX0=