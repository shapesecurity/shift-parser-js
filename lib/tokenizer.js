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

  Tokenizer.prototype.scanBinaryLiteral = function (start) {
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
  };

  Tokenizer.prototype.scanOctalLiteral = function (start) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCUSxXQUFXLHNCQUFYLFdBQVc7SUFBRSxnQkFBZ0Isc0JBQWhCLGdCQUFnQjtJQUFFLFlBQVksc0JBQVosWUFBWTtJQUFFLGlCQUFpQixzQkFBakIsaUJBQWlCO0lBQUUsZ0JBQWdCLHNCQUFoQixnQkFBZ0I7SUFBRSxjQUFjLHNCQUFkLGNBQWM7SUFDaEcsYUFBYSx1QkFBYixhQUFhO0FBRWQsSUFBTSxVQUFVLFdBQVYsVUFBVSxHQUFHO0FBQ3hCLGdCQUFjLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ2pDLEtBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDcEIsT0FBSyxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUMzQixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQzFCLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsZ0JBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDakMsWUFBVSxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUNoQyxlQUFhLEVBQUUsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQy9CLG1CQUFpQixFQUFFLEVBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFDO0FBQzlDLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsY0FBWSxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUM3QixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0NBQzNCLENBQUM7O0FBRUssSUFBTSxTQUFTLFdBQVQsU0FBUyxHQUFHO0FBQ3ZCLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekMsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsYUFBVyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUN0RCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxlQUFhLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3pELGdCQUFjLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzFELGdCQUFjLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzFELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdkQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxxQkFBbUIsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDakUsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDaEQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxjQUFZLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3pELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsV0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN0RCxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3RELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDN0MsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM3QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBQztBQUMzRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNsRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxVQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFDO0FBQ3ZELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBQztBQUNyRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMzQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxjQUFZLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQzNELGNBQVksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDOUQsZUFBYSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNoRSxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ3ZELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDL0Msc0JBQW9CLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQzNELDZCQUEyQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztBQUNsRSxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsU0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztDQUMvQyxDQUFDOztBQUVGLElBQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQztBQUNyQixJQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDO0FBQ3JCLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNoQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRWYsSUFBTSxtQkFBbUIsR0FBRyxDQUMxQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNsSCxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNySCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3BILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRXRGLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUVuQyxJQUFNLGdCQUFnQixHQUFHLENBQ3ZCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxD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QUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO0dBQzdFOztBQS9FRyxXQUFTLENBaUZOLElBQUksR0FBQSxVQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDbEMsV0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztHQUNyRzs7QUFuRkcsV0FBUyxDQXFGTixJQUFJLEdBQUEsVUFBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUN2QyxXQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQzNHLEdBQUcsQ0FBQztHQUNiOztBQXhGRyxXQUFTLENBMEZOLElBQUksR0FBQSxVQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUM1QyxXQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtB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LENBQUMsY0FBYyxFQUFFLENBQUM7T0FDOUI7O0FBRUQsWUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7S0FDNUI7R0FDRjs7QUFobUNHLFdBQVMsV0FrbUNiLEdBQUcsR0FBQSxZQUFHO0FBQ0osV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0dBQzlDOztBQXBtQ0csV0FBUyxXQXNtQ2IsR0FBRyxHQUFBLFlBQUc7QUFDSixRQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxHQUFHLEVBQUU7QUFDcEUsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0tBQ3ZCO0FBQ0QsUUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQ2hDLFFBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztBQUMzQyxRQUFJLENBQUMsMkJBQTJCLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLFFBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUMvQixRQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNuQixRQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDbEIsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0dBQ3ZCOztTQWxuQ0csU0FBUzs7O3FCQUFULFNBQVMiLCJmaWxlIjoic3JjL3Rva2VuaXplci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cbmltcG9ydCB7Z2V0SGV4VmFsdWUsIGlzTGluZVRlcm1pbmF0b3IsIGlzV2hpdGVzcGFjZSwgaXNJZGVudGlmaWVyU3RhcnQsIGlzSWRlbnRpZmllclBhcnQsIGlzRGVjaW1hbERpZ2l0fSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuZXhwb3J0IGNvbnN0IFRva2VuQ2xhc3MgPSB7XG4gIEJvb2xlYW5MaXRlcmFsOiB7bmFtZTogXCJCb29sZWFuXCJ9LFxuICBFb2Y6IHtuYW1lOiBcIjxFbmQ+XCJ9LFxuICBJZGVudDoge25hbWU6IFwiSWRlbnRpZmllclwifSxcbiAgS2V5d29yZDoge25hbWU6IFwiS2V5d29yZFwifSxcbiAgTnVsbExpdGVyYWw6IHtuYW1lOiBcIk51bGxcIn0sXG4gIE51bWVyaWNMaXRlcmFsOiB7bmFtZTogXCJOdW1lcmljXCJ9LFxuICBQdW5jdHVhdG9yOiB7bmFtZTogXCJQdW5jdHVhdG9yXCJ9LFxuICBTdHJpbmdMaXRlcmFsOiB7bmFtZTogXCJTdHJpbmdcIn0sXG4gIFJlZ3VsYXJFeHByZXNzaW9uOiB7bmFtZTogXCJSZWd1bGFyRXhwcmVzc2lvblwifSxcbiAgTGluZUNvbW1lbnQ6IHtuYW1lOiBcIkxpbmVcIn0sXG4gIEJsb2NrQ29tbWVudDoge25hbWU6IFwiQmxvY2tcIn0sXG4gIElsbGVnYWw6IHtuYW1lOiBcIklsbGVnYWxcIn1cbn07XG5cbmV4cG9ydCBjb25zdCBUb2tlblR5cGUgPSB7XG4gIEVPUzoge2tsYXNzOiBUb2tlbkNsYXNzLkVvZiwgbmFtZTogXCJFT1NcIn0sXG4gIExQQVJFTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKFwifSxcbiAgUlBBUkVOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIpXCJ9LFxuICBMQlJBQ0s6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIltcIn0sXG4gIFJCUkFDSzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXVwifSxcbiAgTEJSQUNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ7XCJ9LFxuICBSQlJBQ0U6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn1cIn0sXG4gIENPTE9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI6XCJ9LFxuICBTRU1JQ09MT046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjtcIn0sXG4gIFBFUklPRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLlwifSxcbiAgQ09ORElUSU9OQUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj9cIn0sXG4gIElOQzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKytcIn0sXG4gIERFQzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLS1cIn0sXG4gIEFTU0lHTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPVwifSxcbiAgQVNTSUdOX0JJVF9PUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifD1cIn0sXG4gIEFTU0lHTl9CSVRfWE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJePVwifSxcbiAgQVNTSUdOX0JJVF9BTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiY9XCJ9LFxuICBBU1NJR05fU0hMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PD1cIn0sXG4gIEFTU0lHTl9TSFI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+PVwifSxcbiAgQVNTSUdOX1NIUl9VTlNJR05FRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj4+PVwifSxcbiAgQVNTSUdOX0FERDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKz1cIn0sXG4gIEFTU0lHTl9TVUI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi09XCJ9LFxuICBBU1NJR05fTVVMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIqPVwifSxcbiAgQVNTSUdOX0RJVjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLz1cIn0sXG4gIEFTU0lHTl9NT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiU9XCJ9LFxuICBDT01NQToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLFwifSxcbiAgT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInx8XCJ9LFxuICBBTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiYmXCJ9LFxuICBCSVRfT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInxcIn0sXG4gIEJJVF9YT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl5cIn0sXG4gIEJJVF9BTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiZcIn0sXG4gIFNITDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPDxcIn0sXG4gIFNIUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj5cIn0sXG4gIFNIUl9VTlNJR05FRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj4+XCJ9LFxuICBBREQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIitcIn0sXG4gIFNVQjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLVwifSxcbiAgTVVMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIqXCJ9LFxuICBESVY6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi9cIn0sXG4gIE1PRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJVwifSxcbiAgRVE6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj09XCJ9LFxuICBORToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIT1cIn0sXG4gIEVRX1NUUklDVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPT09XCJ9LFxuICBORV9TVFJJQ1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiE9PVwifSxcbiAgTFQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjxcIn0sXG4gIEdUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+XCJ9LFxuICBMVEU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw9XCJ9LFxuICBHVEU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj49XCJ9LFxuICBJTlNUQU5DRU9GOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpbnN0YW5jZW9mXCJ9LFxuICBJTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaW5cIn0sXG4gIE5PVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIVwifSxcbiAgQklUX05PVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiflwifSxcbiAgREVMRVRFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkZWxldGVcIn0sXG4gIFRZUEVPRjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidHlwZW9mXCJ9LFxuICBWT0lEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ2b2lkXCJ9LFxuICBCUkVBSzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiYnJlYWtcIn0sXG4gIENBU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNhc2VcIn0sXG4gIENBVENIOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXRjaFwifSxcbiAgQ09OVElOVUU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNvbnRpbnVlXCJ9LFxuICBERUJVR0dFUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVidWdnZXJcIn0sXG4gIERFRkFVTFQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlZmF1bHRcIn0sXG4gIERPOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkb1wifSxcbiAgRUxTRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZWxzZVwifSxcbiAgRklOQUxMWToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZmluYWxseVwifSxcbiAgRk9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJmb3JcIn0sXG4gIEZVTkNUSU9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJmdW5jdGlvblwifSxcbiAgSUY6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImlmXCJ9LFxuICBORVc6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm5ld1wifSxcbiAgUkVUVVJOOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJyZXR1cm5cIn0sXG4gIFNXSVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwic3dpdGNoXCJ9LFxuICBUSElTOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0aGlzXCJ9LFxuICBUSFJPVzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidGhyb3dcIn0sXG4gIFRSWToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidHJ5XCJ9LFxuICBWQVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInZhclwifSxcbiAgV0hJTEU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIndoaWxlXCJ9LFxuICBXSVRIOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ3aXRoXCJ9LFxuICBOVUxMX0xJVEVSQUw6IHtrbGFzczogVG9rZW5DbGFzcy5OdWxsTGl0ZXJhbCwgbmFtZTogXCJudWxsXCJ9LFxuICBUUlVFX0xJVEVSQUw6IHtrbGFzczogVG9rZW5DbGFzcy5Cb29sZWFuTGl0ZXJhbCwgbmFtZTogXCJ0cnVlXCJ9LFxuICBGQUxTRV9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuQm9vbGVhbkxpdGVyYWwsIG5hbWU6IFwiZmFsc2VcIn0sXG4gIE5VTUJFUjoge2tsYXNzOiBUb2tlbkNsYXNzLk51bWVyaWNMaXRlcmFsLCBuYW1lOiBcIlwifSxcbiAgU1RSSU5HOiB7a2xhc3M6IFRva2VuQ2xhc3MuU3RyaW5nTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFJFR0VYUDoge2tsYXNzOiBUb2tlbkNsYXNzLlJlZ3VsYXJFeHByZXNzaW9uLCBuYW1lOiBcIlwifSxcbiAgSURFTlRJRklFUjoge2tsYXNzOiBUb2tlbkNsYXNzLklkZW50LCBuYW1lOiBcIlwifSxcbiAgRlVUVVJFX1JFU0VSVkVEX1dPUkQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIlwifSxcbiAgRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJcIn0sXG4gIENPTlNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb25zdFwifSxcbiAgTEVUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJsZXRcIn0sXG4gIElMTEVHQUw6IHtrbGFzczogVG9rZW5DbGFzcy5JbGxlZ2FsLCBuYW1lOiBcIlwifVxufTtcblxuY29uc3QgVFQgPSBUb2tlblR5cGU7XG5jb25zdCBJID0gVFQuSUxMRUdBTDtcbmNvbnN0IEYgPSBmYWxzZTtcbmNvbnN0IFQgPSB0cnVlO1xuXG5jb25zdCBPTkVfQ0hBUl9QVU5DVFVBVE9SID0gW1xuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5OT1QsIEksIEksIEksXG4gIFRULk1PRCwgVFQuQklUX0FORCwgSSwgVFQuTFBBUkVOLCBUVC5SUEFSRU4sIFRULk1VTCwgVFQuQURELCBUVC5DT01NQSwgVFQuU1VCLCBUVC5QRVJJT0QsIFRULkRJViwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgVFQuQ09MT04sIFRULlNFTUlDT0xPTiwgVFQuTFQsIFRULkFTU0lHTiwgVFQuR1QsIFRULkNPTkRJVElPTkFMLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLFxuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5MQlJBQ0ssIEksIFRULlJCUkFDSywgVFQuQklUX1hPUiwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNFLCBUVC5CSVRfT1IsIFRULlJCUkFDRSwgVFQuQklUX05PVF07XG5cbmNvbnN0IFBVTkNUVUFUT1JfU1RBUlQgPSBbXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIEYsIEYsIFQsIFQsXG4gIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIEZdO1xuXG5jb25zdCBJREVOVElGSUVSX1NUQVJUID0gW1xuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULFxuICBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBGLCBULCBGLCBGLCBULCBGLCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULFxuICBULCBULCBULCBULCBULCBULCBGLCBGLCBGLCBGLCBGXTtcblxuZXhwb3J0IGNsYXNzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UsIG9jdGFsKSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnNsaWNlID0gc2xpY2U7XG4gICAgdGhpcy5vY3RhbCA9IG9jdGFsO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJZGVudGlmaWVyTGlrZVRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCBzbGljZSkge1xuICAgIHN1cGVyKHR5cGUsIHNsaWNlLCBmYWxzZSk7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2xpY2UudGV4dDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpZmllclRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLklERU5USUZJRVIsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVsbExpdGVyYWxUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5OVUxMX0xJVEVSQUwsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVHJ1ZUxpdGVyYWxUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5UUlVFX0xJVEVSQUwsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRmFsc2VMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuRkFMU0VfTElURVJBTCwgc2xpY2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBLZXl3b3JkVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFB1bmN0dWF0b3JUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGUubmFtZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5SRUdFWFAsIHNsaWNlLCBmYWxzZSk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bWVyaWNMaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSA9ICtzbGljZS50ZXh0LCBvY3RhbCA9IGZhbHNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLk5VTUJFUiwgc2xpY2UsIG9jdGFsKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZS50b1N0cmluZygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdMaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSwgb2N0YWwpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuU1RSSU5HLCBzbGljZSwgb2N0YWwpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFT0ZUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuRU9TLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBKc0Vycm9yIHtcbiAgY29uc3RydWN0b3IoaW5kZXgsIGxpbmUsIGNvbHVtbiwgbXNnKSB7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IG1zZztcbiAgICB0aGlzLm1lc3NhZ2UgPSBgWyR7bGluZX06JHtjb2x1bW59XTogJHttc2d9YDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdFxuY2xhc3MgVG9rZW5pemVyIHtcbiAgY29uc3RydWN0b3Ioc291cmNlKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgdGhpcy5pbmRleCA9IDA7XG4gICAgdGhpcy5saW5lU3RhcnRzID0gWzBdO1xuICAgIHRoaXMubG9va2FoZWFkU3RhcnQgPSAwO1xuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG4gICAgdGhpcy5sb29rYWhlYWRFbmQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXggPSAwO1xuICAgIHRoaXMuc3RyaWN0ID0gZmFsc2U7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLnByZXZUb2tlbiA9IG51bGw7XG4gICAgdGhpcy50b2tlbkluZGV4ID0gMDtcbiAgICB0aGlzLmxpbmVTdGFydHMgPSBbMF07XG4gIH1cblxuICB0cmFja0JhY2tMaW5lTnVtYmVyKHBvc2l0aW9uKSB7XG4gICAgZm9yIChsZXQgbGluZSA9IHRoaXMubGluZVN0YXJ0cy5sZW5ndGggLSAxOyBsaW5lID49IDA7IGxpbmUtLSkge1xuICAgICAgaWYgKChwb3NpdGlvbiA+PSB0aGlzLmdldExpbmVTdGFydChsaW5lKSkpIHtcbiAgICAgICAgcmV0dXJuIGxpbmU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgY3JlYXRlSUxMRUdBTCgpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfSUxMRUdBTF9UT0tFTik7XG4gIH1cblxuICBjcmVhdGVVbmV4cGVjdGVkKHRva2VuKSB7XG4gICAgc3dpdGNoICh0b2tlbi50eXBlLmtsYXNzKSB7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuRW9mOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfRU9TKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX05VTUJFUik7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuU3RyaW5nTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NUUklORyk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuSWRlbnQ6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9JREVOVElGSUVSKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5LZXl3b3JkOlxuICAgICAgICBpZiAoKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRCkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfUkVTRVJWRURfV09SRCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4uc2xpY2UudGV4dCk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuUHVuY3R1YXRvcjpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi50eXBlLm5hbWUpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4udmFsdWUgfHwgdG9rZW4udHlwZS5uYW1lKTtcbiAgfVxuXG4gIGNyZWF0ZUVycm9yKG1lc3NhZ2UsIGFyZykge1xuICAgIGxldCBtc2cgPSBtZXNzYWdlLnJlcGxhY2UoL3soXFxkKyl9L2csICgpID0+IGFyZyk7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5pbmRleDtcbiAgICBsZXQgbGluZSA9IHRoaXMudHJhY2tCYWNrTGluZU51bWJlcihpbmRleCk7XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKGluZGV4LCBsaW5lICsgMSwgaW5kZXggLSB0aGlzLmdldExpbmVTdGFydChsaW5lKSArIDEsIG1zZyk7XG4gIH1cblxuICBjcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgbWVzc2FnZSwgYXJnKSB7XG4gICAgbGV0IG1zZyA9IG1lc3NhZ2UucmVwbGFjZSgveyhcXGQrKX0vZywgKCkgPT4gYXJnKTtcbiAgICBsZXQgaW5kZXggPSB0b2tlbi5zbGljZS5zdGFydDtcbiAgICBsZXQgbGluZSA9IHRoaXMudHJhY2tCYWNrTGluZU51bWJlcihpbmRleCk7XG4gICAgcmV0dXJuIG5ldyBKc0Vycm9yKGluZGV4LCBsaW5lICsgMSwgaW5kZXggLSB0aGlzLmdldExpbmVTdGFydChsaW5lKSArIDEsIG1zZyk7XG4gIH1cblxuICBnZXRMaW5lU3RhcnQobGluZSkge1xuICAgIHJldHVybiB0aGlzLmxpbmVTdGFydHNbbGluZV07XG4gIH1cblxuICBzdGF0aWMgY3NlMihpZCwgY2gxLCBjaDIpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDI7XG4gIH1cblxuICBzdGF0aWMgY3NlMyhpZCwgY2gxLCBjaDIsIGNoMykge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMztcbiAgfVxuXG4gIHN0YXRpYyBjc2U0KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQ7XG4gIH1cblxuICBzdGF0aWMgY3NlNShpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDU7XG4gIH1cblxuICBzdGF0aWMgY3NlNihpZCwgY2gxLCBjaDIsIGNoMywgY2g0LCBjaDUsIGNoNikge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSlcbiAgICAgICAgPT09IGNoNSAmJiBpZC5jaGFyQXQoNikgPT09IGNoNjtcbiAgfVxuXG4gIHN0YXRpYyBjc2U3KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSwgY2g2LCBjaDcpIHtcbiAgICByZXR1cm4gaWQuY2hhckF0KDEpID09PSBjaDEgJiYgaWQuY2hhckF0KDIpID09PSBjaDIgJiYgaWQuY2hhckF0KDMpID09PSBjaDMgJiYgaWQuY2hhckF0KDQpID09PSBjaDQgJiYgaWQuY2hhckF0KDUpXG4gICAgICAgID09PSBjaDUgJiYgaWQuY2hhckF0KDYpID09PSBjaDYgJiYgaWQuY2hhckF0KDcpID09PSBjaDc7XG4gIH1cblxuICBzdGF0aWMgZ2V0S2V5d29yZChpZCwgc3RyaWN0KSB7XG4gICAgLy8gXCJjb25zdFwiIGlzIHNwZWNpYWxpemVkIGFzIEtleXdvcmQgaW4gVjguXG4gICAgLy8gXCJ5aWVsZFwiIGFuZCBcImxldFwiIGFyZSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIFNwaWRlck1vbmtleSBhbmQgRVMubmV4dC5cbiAgICAvLyBTb21lIG90aGVycyBhcmUgZnJvbSBmdXR1cmUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSAxIHx8IGlkLmxlbmd0aCA+IDEwKSB7XG4gICAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gICAgfVxuICAgIHN3aXRjaCAoaWQubGVuZ3RoKSB7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcImlcIjpcbiAgICAgICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDEpKSB7XG4gICAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JRjtcbiAgICAgICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChpZC5jaGFyQXQoMSkgPT09IFwib1wiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRE87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJhXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlZBUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwib1wiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GT1I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImVcIiwgXCJ3XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTkVXO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJyXCIsIFwieVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRSWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJsXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiZVwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQgOiBUb2tlblR5cGUuTEVUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA0OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiaFwiLCBcImlcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVEhJUztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwibFwiLCBcInNcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRUxTRTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiblwiLCBcInVcIiwgXCJtXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiY1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImFcIiwgXCJzXCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNBU0U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcIm9cIiwgXCJpXCIsIFwiZFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlZPSUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwid1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UzKGlkLCBcImlcIiwgXCJ0XCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLldJVEg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDU6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcIndcIjogLy8gV0hJTEVcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiaVwiLCBcImxcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuV0hJTEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiYlwiOiAvLyBCUkVBS1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcInJcIiwgXCJlXCIsIFwiYVwiLCBcImtcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5CUkVBSztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6IC8vIENBVENIXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiYVwiLCBcInRcIiwgXCJjXCIsIFwiaFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNBVENIO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJvXCIsIFwiblwiLCBcInNcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ09OU1Q7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImxcIiwgXCJhXCIsIFwic1wiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ0XCI6IC8vIFRIUk9XXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiaFwiLCBcInJcIiwgXCJvXCIsIFwid1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRIUk9XO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInlcIjogLy8gWUlFTERcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJpXCIsIFwiZVwiLCBcImxcIiwgXCJkXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzdHJpY3QgPyBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEIDogVG9rZW5UeXBlLklMTEVHQUw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwic1wiOiAvLyBTVVBFUlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcInVcIiwgXCJwXCIsIFwiZVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiclwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcImVcIiwgXCJ0XCIsIFwidVwiLCBcInJcIiwgXCJuXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuUkVUVVJOO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJ5XCIsIFwicFwiLCBcImVcIiwgXCJvXCIsIFwiZlwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlRZUEVPRjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJkXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwiZVwiLCBcImxcIiwgXCJlXCIsIFwidFwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUxFVEU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwic1wiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIndcIiwgXCJpXCIsIFwidFwiLCBcImNcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU1dJVENIO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgVG9rZW5pemVyLmNzZTUoaWQsIFwidFwiLCBcImFcIiwgXCJ0XCIsIFwiaVwiLCBcImNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInhcIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcIm1cIiwgXCJwXCIsIFwib1wiLCBcInJcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwicFwiOlxuICAgICAgICAgICAgaWYgKHN0cmljdCAmJiBUb2tlbml6ZXIuY3NlNShpZCwgXCJ1XCIsIFwiYlwiLCBcImxcIiwgXCJpXCIsIFwiY1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNzpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiZFwiOiAvLyBkZWZhdWx0XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwiZVwiLCBcImZcIiwgXCJhXCIsIFwidVwiLCBcImxcIiwgXCJ0XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVGQVVMVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmXCI6IC8vIGZpbmFsbHlcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJpXCIsIFwiblwiLCBcImFcIiwgXCJsXCIsIFwibFwiLCBcInlcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GSU5BTExZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjogLy8gZXh0ZW5kc1xuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcInhcIiwgXCJ0XCIsIFwiZVwiLCBcIm5cIiwgXCJkXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInBcIjpcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgICAgICAgaWYgKFwicHJpdmF0ZVwiID09PSBzIHx8IFwicGFja2FnZVwiID09PSBzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgODpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiZlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcInVcIiwgXCJuXCIsIFwiY1wiLCBcInRcIiwgXCJpXCIsIFwib1wiLCBcIm5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVU5DVElPTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwib1wiLCBcIm5cIiwgXCJ0XCIsIFwiaVwiLCBcIm5cIiwgXCJ1XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkNPTlRJTlVFO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJlXCIsIFwiYlwiLCBcInVcIiwgXCJnXCIsIFwiZ1wiLCBcImVcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuREVCVUdHRVI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIGlmIChzdHJpY3QgJiYgKGlkLmNoYXJBdCgwKSA9PT0gXCJwXCIgfHwgaWQuY2hhckF0KDApID09PSBcImlcIikpIHtcbiAgICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICAgIGlmIChcInByb3RlY3RlZFwiID09PSBzIHx8IFwiaW50ZXJmYWNlXCIgPT09IHMpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTA6XG4gICAgICB7XG4gICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgIGlmIChcImluc3RhbmNlb2ZcIiA9PT0gcykge1xuICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU5TVEFOQ0VPRjtcbiAgICAgICAgfSBlbHNlIGlmIChzdHJpY3QgJiYgXCJpbXBsZW1lbnRzXCIgPT09IHMpIHtcbiAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gVG9rZW5UeXBlLklMTEVHQUw7XG4gIH1cblxuICBza2lwU2luZ2xlTGluZUNvbW1lbnQob2Zmc2V0KSB7XG4gICAgdGhpcy5pbmRleCArPSBvZmZzZXQ7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAqL1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaENvZGUpKSB7XG4gICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gMHgwMDBEIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpXG4gICAgICAgICAgICA9PT0gMHgwMDBBIC8qXCJcXG5cIiAqLykge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNraXBNdWx0aUxpbmVDb21tZW50KCkge1xuICAgIHRoaXMuaW5kZXggKz0gMjtcbiAgICBsZXQgbGVuZ3RoID0gdGhpcy5zb3VyY2UubGVuZ3RoO1xuICAgIGxldCBpID0gdGhpcy5pbmRleDtcbiAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY2hDb2RlIDwgMHg4MCkge1xuICAgICAgICBzd2l0Y2ggKGNoQ29kZSkge1xuICAgICAgICAgIGNhc2UgNDI6ICAvLyBcIipcIlxuICAgICAgICAgICAgLy8gQmxvY2sgY29tbWVudCBlbmRzIHdpdGggXCIqLycuXG4gICAgICAgICAgICBpZiAoaSArIDEgPCBsZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KGkgKyAxKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCA9IGkgKyAyO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDEwOiAgLy8gXCJcXG5cIlxuICAgICAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDEyOiAvLyBcIlxcclwiOlxuICAgICAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGkgPCBsZW5ndGggLSAxICYmIHRoaXMuc291cmNlLmNoYXJBdChpICsgMSkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gMHgyMDI4IHx8IGNoQ29kZSA9PT0gMHgyMDI5KSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICB9XG5cblxuICBza2lwQ29tbWVudCgpIHtcbiAgICBsZXQgaXNMaW5lU3RhcnQgPSB0aGlzLmluZGV4ID09PSAwO1xuICAgIGxldCBsZW5ndGggPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoQ29kZSA9IHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoaXNXaGl0ZXNwYWNlKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmIChjaENvZGUgPT09IDEzIC8qIFwiXFxyXCIgKi8gJiYgdGhpcy5pbmRleCA8IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5lU3RhcnRzLnB1c2godGhpcy5pbmRleCk7XG4gICAgICAgIGlzTGluZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSA0NyAvKiBcIi9cIiAqLykge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDEgPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4ICsgMSk7XG4gICAgICAgIGlmIChjaENvZGUgPT09IDQ3IC8qIFwiL1wiICovKSB7XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoMik7XG4gICAgICAgICAgaXNMaW5lU3RhcnQgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGNoQ29kZSA9PT0gNDIgLyogXCIqXCIgKi8pIHtcbiAgICAgICAgICB0aGlzLnNraXBNdWx0aUxpbmVDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lU3RhcnQgJiYgY2hDb2RlID09PSA0NSAvKiBcIi1cIiAqLykge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVSswMDNFIGlzIFwiPidcbiAgICAgICAgaWYgKCh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIi1cIikgJiYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPlwiKSkge1xuICAgICAgICAgIC8vIFwiLS0+XCIgaXMgYSBzaW5nbGUtbGluZSBjb21tZW50XG4gICAgICAgICAgdGhpcy5za2lwU2luZ2xlTGluZUNvbW1lbnQoMyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSA2MCAvKiBcIjxcIiAqLykge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDQgPD0gbGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiIVwiICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMilcbiAgICAgICAgICAgID09PSBcIi1cIlxuICAgICAgICAgICAgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSA9PT0gXCItXCIpIHtcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCg0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2NhbkhleEVzY2FwZTQoKSB7XG4gICAgaWYgKHRoaXMuaW5kZXggKyA0ID4gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMSA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSk7XG4gICAgaWYgKHIxID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjIgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpKTtcbiAgICBpZiAocjIgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMyA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikpO1xuICAgIGlmIChyMyA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHI0ID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSk7XG4gICAgaWYgKHI0ID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICB0aGlzLmluZGV4ICs9IDQ7XG4gICAgcmV0dXJuIHIxIDw8IDEyIHwgcjIgPDwgOCB8IHIzIDw8IDQgfCByNDtcbiAgfVxuXG4gIHNjYW5IZXhFc2NhcGUyKCkge1xuICAgIGlmICh0aGlzLmluZGV4ICsgMiA+IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjEgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpO1xuICAgIGlmIChyMSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIyID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSk7XG4gICAgaWYgKHIyID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICB0aGlzLmluZGV4ICs9IDI7XG4gICAgcmV0dXJuIHIxIDw8IDQgfCByMjtcbiAgfVxuXG4gIGdldEVzY2FwZWRJZGVudGlmaWVyKCkge1xuICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICB0aGlzLmluZGV4Kys7XG4gICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICBsZXQgaWQgPSBcIlwiO1xuXG4gICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJ1XCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICBsZXQgaWNoID0gdGhpcy5zY2FuSGV4RXNjYXBlNCgpO1xuICAgICAgaWYgKGljaCA8IDAgfHwgaWNoID09PSAweDAwNUMgLyogXCJcXFxcXCIgKi8gIHx8ICFpc0lkZW50aWZpZXJTdGFydChpY2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGljaCk7XG4gICAgfVxuICAgIGlkICs9IGNoO1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKCFpc0lkZW50aWZpZXJQYXJ0KGNoLmNoYXJDb2RlQXQoMCkpICYmIGNoICE9PSBcIlxcXFxcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSAhPT0gXCJ1XCIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpY2ggPSB0aGlzLnNjYW5IZXhFc2NhcGU0KCk7XG4gICAgICAgIGlmIChpY2ggPCAwIHx8IGljaCA9PT0gMHgwMDVDIC8qIFwiXFxcXFwiICovIHx8ICFpc0lkZW50aWZpZXJQYXJ0KGljaCkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaWNoKTtcbiAgICAgIH1cbiAgICAgIGlkICs9IGNoO1xuICAgIH1cblxuICAgIHJldHVybiBpZDtcbiAgfVxuXG4gIGdldElkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4Kys7XG4gICAgbGV0IGwgPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgbCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KGkpO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICAvLyBHbyBiYWNrIGFuZCB0cnkgdGhlIGhhcmQgb25lLlxuICAgICAgICB0aGlzLmluZGV4ID0gc3RhcnQ7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEVzY2FwZWRJZGVudGlmaWVyKCk7XG4gICAgICB9IGVsc2UgaWYgKGlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaW5kZXggPSBpO1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgdGhpcy5pbmRleCk7XG4gIH1cblxuICBzY2FuSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgLy8gQmFja3NsYXNoIChVKzAwNUMpIHN0YXJ0cyBhbiBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICBsZXQgaWQgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT09IFwiXFxcXFwiID8gdGhpcy5nZXRFc2NhcGVkSWRlbnRpZmllcigpIDogdGhpcy5nZXRJZGVudGlmaWVyKCk7XG5cbiAgICAvLyBUaGVyZSBpcyBubyBrZXl3b3JkIG9yIGxpdGVyYWwgd2l0aCBvbmx5IG9uZSBjaGFyYWN0ZXIuXG4gICAgLy8gVGh1cywgaXQgbXVzdCBiZSBhbiBpZGVudGlmaWVyLlxuICAgIGxldCBzbGljZSA9IHt0ZXh0OiBpZCwgc3RhcnQsIGVuZDogdGhpcy5pbmRleH07XG4gICAgaWYgKChpZC5sZW5ndGggPT09IDEpKSB7XG4gICAgICByZXR1cm4gbmV3IElkZW50aWZpZXJUb2tlbihzbGljZSk7XG4gICAgfVxuXG4gICAgbGV0IHN1YlR5cGUgPSBUb2tlbml6ZXIuZ2V0S2V5d29yZChpZCwgdGhpcy5zdHJpY3QpO1xuICAgIGlmIChzdWJUeXBlICE9PSBUb2tlblR5cGUuSUxMRUdBTCkge1xuICAgICAgcmV0dXJuIG5ldyBLZXl3b3JkVG9rZW4oc3ViVHlwZSwgc2xpY2UpO1xuICAgIH1cblxuICAgIGlmIChpZC5sZW5ndGggPT09IDQpIHtcbiAgICAgIGlmIChcIm51bGxcIiA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdWxsTGl0ZXJhbFRva2VuKHNsaWNlKTtcbiAgICAgIH0gZWxzZSBpZiAoXCJ0cnVlXCIgPT09IGlkKSB7XG4gICAgICAgIHJldHVybiBuZXcgVHJ1ZUxpdGVyYWxUb2tlbihzbGljZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlkLmxlbmd0aCA9PT0gNSAmJiBcImZhbHNlXCIgPT09IGlkKSB7XG4gICAgICByZXR1cm4gbmV3IEZhbHNlTGl0ZXJhbFRva2VuKHNsaWNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IElkZW50aWZpZXJUb2tlbihzbGljZSk7XG4gIH1cblxuICBnZXRTbGljZShzdGFydCkge1xuICAgIHJldHVybiB7dGV4dDogdGhpcy5zb3VyY2Uuc2xpY2Uoc3RhcnQsIHRoaXMuaW5kZXgpLCBzdGFydDogc3RhcnQsIGVuZDogdGhpcy5pbmRleH07XG4gIH1cblxuICBzY2FuUHVuY3R1YXRvckhlbHBlcigpIHtcbiAgICBsZXQgY2gxID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuXG4gICAgc3dpdGNoIChjaDEpIHtcbiAgICAgIC8vIENoZWNrIGZvciBtb3N0IGNvbW1vbiBzaW5nbGUtY2hhcmFjdGVyIHB1bmN0dWF0b3JzLlxuICAgICAgY2FzZSBcIi5cIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5QRVJJT0Q7XG4gICAgICBjYXNlIFwiKFwiOlxuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkxQQVJFTjtcbiAgICAgIGNhc2UgXCIpXCI6XG4gICAgICBjYXNlIFwiO1wiOlxuICAgICAgY2FzZSBcIixcIjpcbiAgICAgICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICAgICAgY2FzZSBcIntcIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MQlJBQ0U7XG4gICAgICBjYXNlIFwifVwiOlxuICAgICAgY2FzZSBcIltcIjpcbiAgICAgIGNhc2UgXCJdXCI6XG4gICAgICBjYXNlIFwiOlwiOlxuICAgICAgY2FzZSBcIj9cIjpcbiAgICAgIGNhc2UgXCJ+XCI6XG4gICAgICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIFwiPVwiIChVKzAwM0QpIG1hcmtzIGFuIGFzc2lnbm1lbnQgb3IgY29tcGFyaXNvbiBvcGVyYXRvci5cbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAxIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiPVwiKSB7XG4gICAgICAgICAgc3dpdGNoIChjaDEpIHtcbiAgICAgICAgICAgIGNhc2UgXCI9XCI6XG4gICAgICAgICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDIpID09PSBcIj1cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRVFfU1RSSUNUO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRVE7XG4gICAgICAgICAgICBjYXNlIFwiIVwiOlxuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5FX1NUUklDVDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLk5FO1xuICAgICAgICAgICAgY2FzZSBcInxcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX09SO1xuICAgICAgICAgICAgY2FzZSBcIitcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQUREO1xuICAgICAgICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU1VCO1xuICAgICAgICAgICAgY2FzZSBcIipcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fTVVMO1xuICAgICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MVEU7XG4gICAgICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkdURTtcbiAgICAgICAgICAgIGNhc2UgXCIvXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0RJVjtcbiAgICAgICAgICAgIGNhc2UgXCIlXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX01PRDtcbiAgICAgICAgICAgIGNhc2UgXCJeXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9YT1I7XG4gICAgICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgYnJlYWs7IC8vZmFpbGVkXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggKyAxIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2gyID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgIGlmIChjaDEgPT09IGNoMikge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICBsZXQgY2gzID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKTtcbiAgICAgICAgICBpZiAoY2gxID09PSBcIj5cIiAmJiBjaDMgPT09IFwiPlwiKSB7XG4gICAgICAgICAgICAvLyA0LWNoYXJhY3RlciBwdW5jdHVhdG9yOiA+Pj49XG4gICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDMgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAzKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSFJfVU5TSUdORUQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI8XCIgJiYgY2gzID09PSBcIj1cIikge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fU0hMO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjaDEgPT09IFwiPlwiICYmIGNoMyA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NIUjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gT3RoZXIgMi1jaGFyYWN0ZXIgcHVuY3R1YXRvcnM6ICsrIC0tIDw8ID4+ICYmIHx8XG4gICAgICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAgICAgY2FzZSBcIitcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU5DO1xuICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFQztcbiAgICAgICAgICBjYXNlIFwiPFwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TSEw7XG4gICAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hSO1xuICAgICAgICAgIGNhc2UgXCImXCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFORDtcbiAgICAgICAgICBjYXNlIFwifFwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5PUjtcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7IC8vZmFpbGVkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gIH1cblxuICAvLyA3LjcgUHVuY3R1YXRvcnNcbiAgc2NhblB1bmN0dWF0b3IoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICBsZXQgc3ViVHlwZSA9IHRoaXMuc2NhblB1bmN0dWF0b3JIZWxwZXIoKTtcbiAgICB0aGlzLmluZGV4ICs9IHN1YlR5cGUubmFtZS5sZW5ndGg7XG4gICAgcmV0dXJuIG5ldyBQdW5jdHVhdG9yVG9rZW4oc3ViVHlwZSwgdGhpcy5nZXRTbGljZShzdGFydCkpO1xuICB9XG5cbiAgc2NhbkhleExpdGVyYWwoc3RhcnQpIHtcbiAgICBsZXQgaSA9IHRoaXMuaW5kZXg7XG4gICAgd2hpbGUgKGkgPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdChpKTtcbiAgICAgIGxldCBoZXggPSBnZXRIZXhWYWx1ZShjaCk7XG4gICAgICBpZiAoaGV4ID09PSAtMSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCA9PT0gaSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgaWYgKGkgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgaXNJZGVudGlmaWVyU3RhcnQodGhpcy5zb3VyY2UuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIHRoaXMuaW5kZXggPSBpO1xuXG4gICAgbGV0IHNsaWNlID0gdGhpcy5nZXRTbGljZShzdGFydCk7XG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHNsaWNlLCBwYXJzZUludChzbGljZS50ZXh0LnN1YnN0cigyKSwgMTYpKTtcbiAgfVxuXG4gIHNjYW5CaW5hcnlMaXRlcmFsKHN0YXJ0KSB7XG4gICAgbGV0IG9mZnNldCA9IHRoaXMuaW5kZXggLSBzdGFydDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggIT09IFwiMFwiICYmIGNoICE9PSBcIjFcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmRleCAtIHN0YXJ0IDw9IG9mZnNldCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgKGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCkpXG4gICAgICAgIHx8IGlzRGVjaW1hbERpZ2l0KHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCksIHBhcnNlSW50KHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLnRleHQuc3Vic3RyKG9mZnNldCksIDIpLCB0cnVlKTtcbiAgfVxuXG4gIHNjYW5PY3RhbExpdGVyYWwoc3RhcnQpIHtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5pbmRleCAtIHN0YXJ0O1xuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmICghKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICB9XG5cbiAgICBpZiAob2Zmc2V0ID09PSAyICYmIHRoaXMuaW5kZXggLSBzdGFydCA9PT0gMikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgKGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleCkpXG4gICAgICAgIHx8IGlzRGVjaW1hbERpZ2l0KHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCksIHBhcnNlSW50KHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLnRleHQuc3Vic3RyKG9mZnNldCksIDgpLCB0cnVlKTtcbiAgfVxuXG4gIHNjYW5OdW1lcmljTGl0ZXJhbCgpIHtcbiAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgLy8gYXNzZXJ0KGNoID09PSBcIi5cIiB8fCBcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIilcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgaWYgKGNoID09PSBcIjBcIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIGlmIChjaCA9PT0gXCJ4XCIgfHwgY2ggPT09IFwiWFwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5IZXhMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJiXCIgfHwgY2ggPT09IFwiQlwiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5CaW5hcnlMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJvXCIgfHwgY2ggPT09IFwiT1wiKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5PY3RhbExpdGVyYWwoc3RhcnQpO1xuICAgICAgICB9IGVsc2UgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk9jdGFsTGl0ZXJhbChzdGFydCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaCAhPT0gXCIuXCIpIHtcbiAgICAgIC8vIE11c3QgYmUgXCIxJy4uJzknXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBlID0gMDtcbiAgICBpZiAoY2ggPT09IFwiLlwiKSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgICB9XG5cbiAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgIGUrKztcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFT0Ygbm90IHJlYWNoZWQgaGVyZVxuICAgIGlmIChjaCA9PT0gXCJlXCIgfHwgY2ggPT09IFwiRVwiKSB7XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGxldCBuZWcgPSBmYWxzZTtcbiAgICAgIGlmIChjaCA9PT0gXCIrXCIgfHwgY2ggPT09IFwiLVwiKSB7XG4gICAgICAgIG5lZyA9IGNoID09PSBcIi1cIjtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGxldCBmID0gMDtcbiAgICAgIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICBmICo9IDEwO1xuICAgICAgICAgIGYgKz0gK2NoO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfVxuICAgICAgZSArPSBuZWcgPyBmIDogLWY7XG4gICAgfVxuXG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICB9XG5cbiAgLy8gNy44LjQgU3RyaW5nIExpdGVyYWxzXG4gIHNjYW5TdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdHIgPSBcIlwiO1xuXG4gICAgbGV0IHF1b3RlID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgIC8vICBhc3NlcnQoKHF1b3RlID09PSBcIlxcXCJcIiB8fCBxdW90ZSA9PT0gXCJcIlwiKSwgXCJTdHJpbmcgbGl0ZXJhbCBtdXN0IHN0YXJ0cyB3aXRoIGEgcXVvdGVcIilcblxuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCsrO1xuXG4gICAgbGV0IG9jdGFsID0gZmFsc2U7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChjaCA9PT0gcXVvdGUpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICByZXR1cm4gbmV3IFN0cmluZ0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSwgc3RyLCBvY3RhbCk7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ID09PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgICAgaWYgKCFpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgICAgICAgY2FzZSBcIm5cIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFxuXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiclwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXHJcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ0XCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcdFwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInVcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ4XCI6XG4gICAgICAgICAgICAgIGxldCByZXN0b3JlID0gdGhpcy5pbmRleDtcbiAgICAgICAgICAgICAgbGV0IHVuZXNjYXBlZDtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB1bmVzY2FwZWQgPSBjaCA9PT0gXCJ1XCIgPyB0aGlzLnNjYW5IZXhFc2NhcGU0KCkgOiB0aGlzLnNjYW5IZXhFc2NhcGUyKCk7XG4gICAgICAgICAgICAgIGlmICh1bmVzY2FwZWQgPj0gMCkge1xuICAgICAgICAgICAgICAgIHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHVuZXNjYXBlZCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleCA9IHJlc3RvcmU7XG4gICAgICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJiXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcYlwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFxmXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXHUwMDBCXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgICAgICAgICBvY3RhbCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbGV0IG9jdExlbiA9IDE7XG4gICAgICAgICAgICAgICAgLy8gMyBkaWdpdHMgYXJlIG9ubHkgYWxsb3dlZCB3aGVuIHN0cmluZyBzdGFydHNcbiAgICAgICAgICAgICAgICAvLyB3aXRoIDAsIDEsIDIsIDNcbiAgICAgICAgICAgICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCIzXCIpIHtcbiAgICAgICAgICAgICAgICAgIG9jdExlbiA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBjb2RlID0gMDtcbiAgICAgICAgICAgICAgICB3aGlsZSAob2N0TGVuIDwgMyAmJiBcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikge1xuICAgICAgICAgICAgICAgICAgY29kZSAqPSA4O1xuICAgICAgICAgICAgICAgICAgb2N0TGVuKys7XG4gICAgICAgICAgICAgICAgICBjb2RlICs9IGNoIC0gXCIwXCI7XG4gICAgICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICBpZiAoY2ggPT09IFwiXFxyXCIgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgfVxuXG4gIHNjYW5SZWdFeHAoKSB7XG5cbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIC8vIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpXG5cbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBzdHIgKz0gXCIvXCI7XG4gICAgdGhpcy5pbmRleCsrO1xuXG4gICAgbGV0IHRlcm1pbmF0ZWQgPSBmYWxzZTtcbiAgICBsZXQgY2xhc3NNYXJrZXIgPSBmYWxzZTtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIC8vIEVDTUEtMjYyIDcuOC41XG4gICAgICAgIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH0gZWxzZSBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNsYXNzTWFya2VyKSB7XG4gICAgICAgICAgaWYgKGNoID09PSBcIl1cIikge1xuICAgICAgICAgICAgY2xhc3NNYXJrZXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGNoID09PSBcIi9cIikge1xuICAgICAgICAgICAgdGVybWluYXRlZCA9IHRydWU7XG4gICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIltcIikge1xuICAgICAgICAgICAgY2xhc3NNYXJrZXIgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRlcm1pbmF0ZWQpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgfVxuXG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmICghaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSAmJiBjaCAhPT0gXCJcXFxcXCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgICBzdHIgKz0gY2g7XG4gICAgfVxuICAgIHRoaXMubG9va2FoZWFkRW5kID0gdGhpcy5pbmRleDtcbiAgICByZXR1cm4gbmV3IFJlZ3VsYXJFeHByZXNzaW9uTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLCBzdHIpO1xuICB9XG5cbiAgYWR2YW5jZSgpIHtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuc2tpcENvbW1lbnQoKTtcbiAgICB0aGlzLmxhc3RXaGl0ZXNwYWNlID0gdGhpcy5nZXRTbGljZShzdGFydCk7XG4gICAgdGhpcy5sb29rYWhlYWRTdGFydCA9c3RhcnQgPSB0aGlzLmluZGV4O1xuXG4gICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbmV3IEVPRlRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICB9XG5cbiAgICBsZXQgY2hhckNvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpO1xuXG4gICAgaWYgKGNoYXJDb2RlIDwgMHg4MCkge1xuICAgICAgaWYgKFBVTkNUVUFUT1JfU1RBUlRbY2hhckNvZGVdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChJREVOVElGSUVSX1NUQVJUW2NoYXJDb2RlXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuSWRlbnRpZmllcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBEb3QgKC4pIFUrMDAyRSBjYW4gYWxzbyBzdGFydCBhIGZsb2F0aW5nLXBvbGV0IG51bWJlciwgaGVuY2UgdGhlIG5lZWRcbiAgICAgIC8vIHRvIGNoZWNrIHRoZSBuZXh0IGNoYXJhY3Rlci5cbiAgICAgIGlmIChjaGFyQ29kZSA9PT0gMHgwMDJFKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5OdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5QdW5jdHVhdG9yKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0cmluZyBsaXRlcmFsIHN0YXJ0cyB3aXRoIHNpbmdsZSBxdW90ZSAoVSswMDI3KSBvciBkb3VibGUgcXVvdGUgKFUrMDAyMikuXG4gICAgICBpZiAoY2hhckNvZGUgPT09IDB4MDAyNyB8fCBjaGFyQ29kZSA9PT0gMHgwMDIyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5TdHJpbmdMaXRlcmFsKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICgweDAwMzAgLyogJzAnICovIDw9IGNoYXJDb2RlICYmIGNoYXJDb2RlIDw9IDB4MDAzOSAvKiAnOScgKi8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nhbk51bWVyaWNMaXRlcmFsKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNsYXNoICgvKSBVKzAwMkYgY2FuIGFsc28gc3RhcnQgYSByZWdleC5cbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY2hhckNvZGUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5JZGVudGlmaWVyKCk7XG4gICAgICB9XG5cbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cbiAgfVxuXG4gIGVvZigpIHtcbiAgICByZXR1cm4gdGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLkVPUztcbiAgfVxuXG4gIGxleCgpIHtcbiAgICBpZiAodGhpcy5wcmV2VG9rZW4gIT09IG51bGwgJiYgdGhpcy5wcmV2VG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkVPUykge1xuICAgICAgcmV0dXJuIHRoaXMucHJldlRva2VuO1xuICAgIH1cbiAgICB0aGlzLnByZXZUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXggPSB0aGlzLmxvb2thaGVhZEVuZDtcbiAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IGZhbHNlO1xuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG4gICAgdGhpcy5sb29rYWhlYWRFbmQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXggPSBzdGFydDtcbiAgICB0aGlzLnRva2VuSW5kZXgrKztcbiAgICByZXR1cm4gdGhpcy5wcmV2VG9rZW47XG4gIH1cbn1cbiJdfQ==