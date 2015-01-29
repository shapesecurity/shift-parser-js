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

import * as Shift from "shift-ast";

import {isRestrictedWord, isStrictModeReservedWordES5} from "./utils";

import {ErrorMessages} from "./errors";

import Tokenizer, {
    TokenClass,
    TokenType,
    IdentifierToken,
    IdentifierLikeToken,
    NumericLiteralToken,
    StringLiteralToken} from "./tokenizer";

const INIT_MASK = 1;
const GETTER_MASK = 2;
const SETTER_MASK = 4;

const STRICT_MODE_RESERVED_WORD = [
  "implements", "interface", "package", "private", "protected", "public", "static", "yield", "let"];

const Precedence = {
  Sequence: 0,
  Yield: 1,
  Assignment: 1,
  Conditional: 2,
  ArrowFunction: 2,
  LogicalOR: 3,
  LogicalAND: 4,
  BitwiseOR: 5,
  BitwiseXOR: 6,
  BitwiseAND: 7,
  Equality: 8,
  Relational: 9,
  BitwiseSHIFT: 10,
  Additive: 11,
  Multiplicative: 12,
  Unary: 13,
  Postfix: 14,
  Call: 15,
  New: 16,
  TaggedTemplate: 17,
  Member: 18,
  Primary: 19
};

const BinaryPrecedence = {
  "||": Precedence.LogicalOR,
  "&&": Precedence.LogicalAND,
  "|": Precedence.BitwiseOR,
  "^": Precedence.BitwiseXOR,
  "&": Precedence.BitwiseAND,
  "==": Precedence.Equality,
  "!=": Precedence.Equality,
  "===": Precedence.Equality,
  "!==": Precedence.Equality,
  "<": Precedence.Relational,
  ">": Precedence.Relational,
  "<=": Precedence.Relational,
  ">=": Precedence.Relational,
  "in": Precedence.Relational,
  "instanceof": Precedence.Relational,
  "<<": Precedence.BitwiseSHIFT,
  ">>": Precedence.BitwiseSHIFT,
  ">>>": Precedence.BitwiseSHIFT,
  "+": Precedence.Additive,
  "-": Precedence.Additive,
  "*": Precedence.Multiplicative,
  "%": Precedence.Multiplicative,
  "/": Precedence.Multiplicative,
};

function cpLoc(from, to) {
  if ("loc" in from)
    to.loc = from.loc
  return to;
}

function firstDuplicate(strings) {
  if (strings.length < 2)
    return null;
  strings.sort();
  for (let cursor = 1, prev = strings[0]; cursor < strings.length; cursor++) {
    if (strings[cursor] === prev) {
      return prev;
    } else {
      prev = strings[cursor];
    }
  }
  return null;
}

function intersection(stringsA, stringsB) {
  let result = [];
  stringsA.sort();
  stringsB.sort();
  let cursorA = 0, cursorB = 0;
  do {
    let stringA = stringsA[cursorA], stringB = stringsB[cursorB];
    if (stringA === stringB)
      result.push(stringA);
    if (stringA < stringB) {
      ++cursorA;
      if (cursorA >= stringsA.length)
        return result;
    } else {
      ++cursorB;
      if (cursorB >= stringsB.length)
        return result;
    }
  } while(true);
  throw new Error("intersection algorithm broken");
}

export class Parser extends Tokenizer {
  constructor(source) {
    super(source);
    this.labelSet = Object.create(null);
    this.allowIn = true;
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = false;
  }

  eat(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
  }

  expect(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
    throw this.createUnexpected(this.lookahead);
  }

  match(subType) {
    return this.lookahead.type === subType;
  }

  consumeSemicolon() {
    if (this.hasLineTerminatorBeforeNext) {
      return;
    }

    if (this.eat(TokenType.SEMICOLON)) {
      return;
    }

    if (!this.eof() && !this.match(TokenType.RBRACE)) {
      throw this.createUnexpected(this.lookahead);
    }
  }

  // this is a no-op, reserved for future use
  markLocation(node, startLocation) {
    return node;
  }

  parseScript() {
    let location = this.getLocation();
    let [body] = this.parseBody(true);
    return this.markLocation(new Shift.Script(body), location);
  }

  parseFunctionBody() {
    let previousStrict = this.strict;
    let startLocation = this.getLocation();

    let oldLabelSet = this.labelSet;
    let oldInIteration = this.inIteration;
    let oldInSwitch = this.inSwitch;
    let oldInFunctionBody = this.inFunctionBody;

    this.labelSet = Object.create(null);
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = true;

    this.expect(TokenType.LBRACE);
    let [body, isStrict] = this.parseBody();
    this.expect(TokenType.RBRACE);

    body = this.markLocation(body, startLocation);

    this.labelSet = oldLabelSet;
    this.inIteration = oldInIteration;
    this.inSwitch = oldInSwitch;
    this.inFunctionBody = oldInFunctionBody;
    this.strict = previousStrict;
    return [body, isStrict];
  }

  parseBody(acceptEOF = false) {
    let location = this.getLocation();
    let directives = [];
    let statements = [];
    let parsingDirectives = true;
    let isStrict = this.strict;
    let firstRestricted = null;
    while (true) {
      if (acceptEOF) {
        if (this.eof()) {
          break;
        }
      } else {
        if (this.match(TokenType.RBRACE)) {
          break;
        }
      }
      let token = this.lookahead;
      let text = token.slice.text;
      let isStringLiteral = token instanceof StringLiteralToken;
      let directiveLocation = this.getLocation();
      let stmt = this.parseStatement();
      if (parsingDirectives) {
        if (isStringLiteral && stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "LiteralStringExpression") {
          if (text === "\"use strict\"" || text === "'use strict'") {
            isStrict = true;
            this.strict = true;
            if (firstRestricted != null) {
              throw this.createErrorWithLocation(firstRestricted, ErrorMessages.STRICT_OCTAL_LITERAL);
            }
          } else if (firstRestricted == null && token.octal) {
            firstRestricted = token;
          }
          directives.push(this.markLocation(new Shift.Directive(text.slice(1, -1)), directiveLocation));
        } else {
          parsingDirectives = false;
          statements.push(stmt);
        }
      } else {
        statements.push(stmt);
      }
    }

    return [this.markLocation(new Shift.FunctionBody(directives, statements), location), isStrict];
  }


  parseStatement() {
    let startLocation = this.getLocation();
    if (this.eof()) {
      throw this.createUnexpected(this.lookahead);
    }
    switch (this.lookahead.type) {
      case TokenType.SEMICOLON:
        return this.markLocation(this.parseEmptyStatement(), startLocation);
      case TokenType.LBRACE:
        return this.markLocation(this.parseBlockStatement(), startLocation);
      case TokenType.LPAREN:
        return this.markLocation(this.parseExpressionStatement(), startLocation);
      case TokenType.BREAK:
        return this.markLocation(this.parseBreakStatement(), startLocation);
      case TokenType.CONTINUE:
        return this.markLocation(this.parseContinueStatement(), startLocation);
      case TokenType.DEBUGGER:
        return this.markLocation(this.parseDebuggerStatement(), startLocation);
      case TokenType.DO:
        return this.markLocation(this.parseDoWhileStatement(), startLocation);
      case TokenType.FOR:
        return this.markLocation(this.parseForStatement(), startLocation);
      case TokenType.FUNCTION:
        return this.markLocation(this.parseFunction(false), startLocation);
      case TokenType.IF:
        return this.markLocation(this.parseIfStatement(), startLocation);
      case TokenType.RETURN:
        return this.markLocation(this.parseReturnStatement(), startLocation);
      case TokenType.SWITCH:
        return this.markLocation(this.parseSwitchStatement(), startLocation);
      case TokenType.THROW:
        return this.markLocation(this.parseThrowStatement(), startLocation);
      case TokenType.TRY:
        return this.markLocation(this.parseTryStatement(), startLocation);
      case TokenType.VAR:
      case TokenType.LET:
      case TokenType.CONST:
        return this.markLocation(this.parseVariableDeclarationStatement(), startLocation);
      case TokenType.WHILE:
        return this.markLocation(this.parseWhileStatement(), startLocation);
      case TokenType.WITH:
        return this.markLocation(this.parseWithStatement(), startLocation);
      default:
      {
        let expr = this.parseExpression();

        // 12.12 Labelled Statements;
        if (expr.type === "IdentifierExpression" && this.match(TokenType.COLON)) {
          this.lex();
          let key = "$" + expr.identifier.name;
          if ({}.hasOwnProperty.call(this.labelSet, key)) {
            throw this.createError(ErrorMessages.LABEL_REDECLARATION, expr.identifier.name);
          }

          this.labelSet[key] = true;
          let labeledBody = this.parseStatement();
          delete this.labelSet[key];
          return this.markLocation(new Shift.LabeledStatement(expr.identifier, labeledBody), startLocation);
        } else {
          this.consumeSemicolon();
          return this.markLocation(new Shift.ExpressionStatement(expr), startLocation);
        }
      }
    }

  }

  parseVariableIdentifier() {
    let startLocation = this.getLocation();

    let token = this.lex();
    if (!(token instanceof IdentifierToken)) {
      throw this.createUnexpected(token);
    }

    return this.markLocation(new Shift.Identifier(token.value), startLocation);
  }

  parseEmptyStatement() {
    this.expect(TokenType.SEMICOLON);
    return new Shift.EmptyStatement;
  }

  parseBlockStatement() {
    return new Shift.BlockStatement(this.parseBlock());
  }

  parseExpressionStatement() {
    let expr = this.parseExpression();
    this.consumeSemicolon();
    return new Shift.ExpressionStatement(expr);
  }

  parseBreakStatement() {
    let token = this.lookahead;
    this.expect(TokenType.BREAK);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.lookahead.type == TokenType.SEMICOLON) {
      this.lex();

      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new Shift.BreakStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new Shift.BreakStatement(null);
    }

    let label = null;
    if (this.lookahead.type == TokenType.IDENTIFIER) {
      label = this.parseVariableIdentifier();

      let key = "$" + label.name;
      if (!{}.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
      }
    }

    this.consumeSemicolon();

    if (label == null && !(this.inIteration || this.inSwitch)) {
      throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
    }

    return new Shift.BreakStatement(label);
  }

  parseContinueStatement() {
    let token = this.lookahead;
    this.expect(TokenType.CONTINUE);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.lookahead.type == TokenType.SEMICOLON) {
      this.lex();
      if (!this.inIteration) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new Shift.ContinueStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!this.inIteration) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new Shift.ContinueStatement(null);
    }

    let label = null;
    if (this.lookahead.type == TokenType.IDENTIFIER) {
      label = this.parseVariableIdentifier();

      let key = "$" + label.name;
      if (!{}.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
      }
    }

    this.consumeSemicolon();
    if (!this.inIteration) {
      throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
    }

    return new Shift.ContinueStatement(label);
  }


  parseDebuggerStatement() {
    this.expect(TokenType.DEBUGGER);
    this.consumeSemicolon();
    return new Shift.DebuggerStatement;
  }

  parseDoWhileStatement() {
    this.expect(TokenType.DO);
    let oldInIteration = this.inIteration;
    this.inIteration = true;

    let body = this.parseStatement();
    this.inIteration = oldInIteration;

    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.consumeSemicolon();

    return new Shift.DoWhileStatement(body, test);
  }

  static transformDestructuringAssignment(node) {
    switch (node.type) {
      case "ObjectExpression":
        return cpLoc(node, new Shift.ObjectBinding(
          node.properties.map(Parser.transformDestructuringAssignment)
        ));
      case "DataProperty":
        return cpLoc(node, new Shift.BindingPropertyProperty(
          node.name,
          Parser.transformDestructuringAssignment(node.expression)
        ));
      case "ShorthandProperty":
        return cpLoc(node, new Shift.BindingPropertyIdentifier(
          cpLoc(node, new Shift.BindingIdentifier(node.name)),
          null
        ));
      case "ArrayExpression":
        let last = node.elements[node.elements.length - 1];
        if (last != null && last.type === "SpreadElement") {
          return cpLoc(node, new Shift.ArrayBinding(
            node.elements.slice(0, -1).map(e => e && Parser.transformDestructuringAssignment(e)),
            cpLoc(last.expression, new Shift.BindingIdentifier(last.expression.identifier))
          ));
        } else {
          return cpLoc(node, new Shift.ArrayBinding(
            node.elements.map(e => e && Parser.transformDestructuringAssignment(e)),
            null
          ));
        }
      case "AssignmentExpression":
        return cpLoc(node, new Shift.BindingWithDefault(
          Parser.transformDestructuringAssignment(node.binding),
          node.expression
        ));
      case "IdentifierExpression":
        return cpLoc(node, new Shift.BindingIdentifier(node.identifier));
    }
    return node;
  }

  static isDestructuringAssignmentTarget(node) {
    if (Parser.isValidSimpleAssignmentTarget(node))
        return true;
    switch (node.type) {
      case "ObjectExpression":
        return node.properties.every(p =>
          p.type === "BindingPropertyIdentifier" ||
          p.type === "ShorthandProperty" ||
          p.type === "DataProperty" &&
            Parser.isDestructuringAssignmentTargetWithDefault(p.expression)
        );
      case "ArrayExpression":
        if (node.elements.length === 0)
          return false;
        if (!node.elements.slice(0, -1).filter(e => e != null).every(Parser.isDestructuringAssignmentTargetWithDefault))
          return false;
        let last = node.elements[node.elements.length - 1];
        return last != null && last.type === "SpreadElement"
          ? last.expression.type === "IdentifierExpression"
          : last == null || Parser.isDestructuringAssignmentTargetWithDefault(last);
      case "ArrayBinding":
      case "BindingIdentifier":
      case "BindingPropertyIdentifier":
      case "BindingPropertyProperty":
      case "BindingWithDefault":
      case "ObjectBinding":
        return true;
    }
    return false;
  }

  static isDestructuringAssignmentTargetWithDefault(node) {
    return Parser.isDestructuringAssignmentTarget(node) ||
      node.type === "AssignmentExpression" && node.operator === "=" &&
      Parser.isDestructuringAssignmentTarget(node.binding);
  }

  static isValidSimpleAssignmentTarget(node) {
    switch (node.type) {
      case "BindingIdentifier":
      case "IdentifierExpression":
      case "ComputedMemberExpression":
      case "StaticMemberExpression":
        return true;
    }
    return false;
  }

  static boundNames(node) {
    let names = [];
    switch(node.type) {
      case "BindingIdentifier":
        return [node.identifier.name];
      case "BindingWithDefault":
        return Parser.boundNames(node.binding);
      case "ArrayBinding":
        node.elements.filter(e => e != null).forEach(e => [].push.apply(names, Parser.boundNames(e)));
        if (node.restElement != null) {
          names.push(node.restElement.identifier.name);
        }
        return names;
      case "ObjectBinding":
        node.properties.forEach(p => {
          switch (p.type) {
            case "BindingPropertyIdentifier":
              names.push(p.identifier.identifier.name);
              break;
            case "BindingPropertyProperty":
              [].push.apply(names, Parser.boundNames(p.binding));
              break;
            default:
              throw new Error("boundNames called on ObjectBinding with invalid property: " + p.type);
          }
        });
        return names;
      case "ComputedMemberExpression":
      case "StaticMemberExpression":
        return [];
    }
    throw new Error("boundNames called on invalid assignment target: " + node.type);
  }

  parseForStatement() {
    this.expect(TokenType.FOR);
    this.expect(TokenType.LPAREN);
    let test = null;
    let right = null;
    if (this.match(TokenType.SEMICOLON)) {
      this.lex();
      if (!this.match(TokenType.SEMICOLON)) {
        test = this.parseExpression();
      }
      this.expect(TokenType.SEMICOLON);
      if (!this.match(TokenType.RPAREN)) {
        right = this.parseExpression();
      }
      return new Shift.ForStatement(
          null,
          test,
          right,
          this.getIteratorStatementEpilogue()
      );
    } else {
      if (this.match(TokenType.VAR) || this.match(TokenType.LET)) {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let initDecl = this.parseVariableDeclaration();
        this.allowIn = previousAllowIn;

        if (initDecl.declarators.length === 1 && this.match(TokenType.IN)) {
          this.lex();
          right = this.parseExpression();
          return new Shift.ForInStatement(initDecl, right, this.getIteratorStatementEpilogue());
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new Shift.ForStatement(initDecl, test, right, this.getIteratorStatementEpilogue());
        }
      } else {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let init = this.parseExpression();
        this.allowIn = previousAllowIn;

        if (this.match(TokenType.IN)) {
          if (!Parser.isValidSimpleAssignmentTarget(init)) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
          }

          this.lex();
          right = this.parseExpression();
          return new Shift.ForInStatement(init, right, this.getIteratorStatementEpilogue());
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new Shift.ForStatement(init, test, right, this.getIteratorStatementEpilogue());
        }
      }
    }
  }

  getIteratorStatementEpilogue() {
    this.expect(TokenType.RPAREN);
    let oldInIteration = this.inIteration;
    this.inIteration = true;
    let body = this.parseStatement();
    this.inIteration = oldInIteration;
    return body;
  }

  parseIfStatement() {
    this.expect(TokenType.IF);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();

    this.expect(TokenType.RPAREN);
    let consequent = this.parseStatement();
    let alternate = null;
    if (this.match(TokenType.ELSE)) {
      this.lex();
      alternate = this.parseStatement();
    }
    return new Shift.IfStatement(test, consequent, alternate);
  }

  parseReturnStatement() {
    let argument = null;

    this.expect(TokenType.RETURN);
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    if (this.hasLineTerminatorBeforeNext) {
      return new Shift.ReturnStatement(null);
    }

    if (!this.match(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.RBRACE) && !this.eof()) {
        argument = this.parseExpression();
      }
    }

    this.consumeSemicolon();
    return new Shift.ReturnStatement(argument);
  }

  parseWithStatement() {
    if (this.strict) {
      throw this.createError(ErrorMessages.STRICT_MODE_WITH);
    }

    this.expect(TokenType.WITH);
    this.expect(TokenType.LPAREN);
    let object = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();

    return new Shift.WithStatement(object, body);
  }

  parseSwitchStatement() {
    this.expect(TokenType.SWITCH);
    this.expect(TokenType.LPAREN);
    let discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.match(TokenType.RBRACE)) {
      this.lex();
      return new Shift.SwitchStatement(discriminant, []);
    }
    let oldInSwitch = this.inSwitch;
    this.inSwitch = true;

    let cases = this.parseSwitchCases();

    if (this.match(TokenType.DEFAULT)) {
      let switchDefault = this.parseSwitchDefault();
      let postDefaultCases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
      }
      this.inSwitch = oldInSwitch;
      this.expect(TokenType.RBRACE);
      return new Shift.SwitchStatementWithDefault(discriminant, cases, switchDefault, postDefaultCases);
    } else {
      this.inSwitch = oldInSwitch;
      this.expect(TokenType.RBRACE);
      return new Shift.SwitchStatement(discriminant, cases);
    }
  }

  parseSwitchCases() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT))) {
      result.push(this.parseSwitchCase());
    }
    return result;
  }

  parseSwitchCase() {
    let startLocation = this.getLocation();
    this.expect(TokenType.CASE);
    return this.markLocation(new Shift.SwitchCase(this.parseExpression(), this.parseSwitchCaseBody()), startLocation);
  }

  parseSwitchDefault() {
    let startLocation = this.getLocation();
    this.expect(TokenType.DEFAULT);
    return this.markLocation(new Shift.SwitchDefault(this.parseSwitchCaseBody()), startLocation);
  }

  parseSwitchCaseBody() {
    this.expect(TokenType.COLON);
    return this.parseStatementListInSwitchCaseBody();
  }

  parseStatementListInSwitchCaseBody() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT)
    || this.match(TokenType.CASE))) {
      result.push(this.parseStatement());
    }
    return result;
  }

  parseThrowStatement() {
    let token = this.expect(TokenType.THROW);

    if (this.hasLineTerminatorBeforeNext) {
      throw this.createErrorWithLocation(token, ErrorMessages.NEWLINE_AFTER_THROW);
    }

    let argument = this.parseExpression();

    this.consumeSemicolon();

    return new Shift.ThrowStatement(argument);
  }

  parseTryStatement() {
    this.expect(TokenType.TRY);
    let block = this.parseBlock();

    if (this.match(TokenType.CATCH)) {
      let handler = this.parseCatchClause();
      if (this.match(TokenType.FINALLY)) {
        this.lex();
        let finalizer = this.parseBlock();
        return new Shift.TryFinallyStatement(block, handler, finalizer);
      }
      return new Shift.TryCatchStatement(block, handler);
    }

    if (this.match(TokenType.FINALLY)) {
      this.lex();
      let finalizer = this.parseBlock();
      return new Shift.TryFinallyStatement(block, null, finalizer);
    } else {
      throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
    }
  }

  parseVariableDeclarationStatement() {
    let declaration = this.parseVariableDeclaration();
    this.consumeSemicolon();
    return new Shift.VariableDeclarationStatement(declaration);
  }

  parseWhileStatement() {
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    return new Shift.WhileStatement(this.parseExpression(), this.getIteratorStatementEpilogue());
  }

  parseCatchClause() {
    let startLocation = this.getLocation();

    this.expect(TokenType.CATCH);
    this.expect(TokenType.LPAREN);
    let token = this.lookahead;
    if (this.match(TokenType.RPAREN)) {
      throw this.createUnexpected(token);
    }

    let param = this.parseLeftHandSideExpression();

    if (!Parser.isDestructuringAssignmentTarget(param)) {
      throw this.createUnexpected(token);
    }
    param = Parser.transformDestructuringAssignment(param);

    let bound = Parser.boundNames(param);
    if (firstDuplicate(bound) != null) {
      throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
    }

    if (this.strict && bound.some(isRestrictedWord)) {
      throw this.createErrorWithLocation(token, ErrorMessages.STRICT_CATCH_VARIABLE);
    }

    this.expect(TokenType.RPAREN);

    let body = this.parseBlock();

    return this.markLocation(new Shift.CatchClause(param, body), startLocation);
  }

  parseBlock() {
    let startLocation = this.getLocation();
    this.expect(TokenType.LBRACE);

    let body = [];
    while (!this.match(TokenType.RBRACE)) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE);

    return this.markLocation(new Shift.Block(body), startLocation);
  }

  parseVariableDeclaration() {
    let startLocation = this.getLocation();
    let token = this.lex();

    // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    let kind = token.type == TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
    let declarators = this.parseVariableDeclaratorList(kind);
    return this.markLocation(new Shift.VariableDeclaration(kind, declarators), startLocation);
  }

  parseVariableDeclaratorList(kind) {
    let result = [];
    while (true) {
      result.push(this.parseVariableDeclarator(kind));
      if (!this.eat(TokenType.COMMA)) {
        return result;
      }
    }
  }

  parseVariableDeclarator(kind) {
    let startLocation = this.getLocation();
    let token = this.lookahead;

    let id = this.parseLeftHandSideExpression();

    if (!Parser.isDestructuringAssignmentTarget(id)) {
      throw this.createUnexpected(token);
    }
    id = Parser.transformDestructuringAssignment(id);

    let bound = Parser.boundNames(id);
    if (firstDuplicate(bound) != null) {
      throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
    }

    if (this.strict && bound.some(isRestrictedWord)) {
      throw this.createErrorWithLocation(token, ErrorMessages.STRICT_VAR_NAME);
    }

    let init = null;
    if (kind == "const") {
      this.expect(TokenType.ASSIGN);
      init = this.parseAssignmentExpression();
    } else if (this.match(TokenType.ASSIGN)) {
      this.lex();
      init = this.parseAssignmentExpression();
    }
    return this.markLocation(new Shift.VariableDeclarator(id, init), startLocation);
  }

  parseExpression() {
    let startLocation = this.getLocation();

    let expr = this.parseAssignmentExpression();

    if (this.match(TokenType.COMMA)) {
      while (!this.eof()) {
        if (!this.match(TokenType.COMMA)) {
          break;
        }
        this.lex();
        expr = this.markLocation(new Shift.BinaryExpression(",", expr, this.parseAssignmentExpression()),
            startLocation);
      }
    }
    return expr;
  }

  parseAssignmentExpression() {
    let token = this.lookahead;
    let startLocation = this.getLocation();

    let node = this.parseConditionalExpression();

    let isOperator = false;
    let operator = this.lookahead;
    switch (operator.type) {
      case TokenType.ASSIGN:
      case TokenType.ASSIGN_BIT_OR:
      case TokenType.ASSIGN_BIT_XOR:
      case TokenType.ASSIGN_BIT_AND:
      case TokenType.ASSIGN_SHL:
      case TokenType.ASSIGN_SHR:
      case TokenType.ASSIGN_SHR_UNSIGNED:
      case TokenType.ASSIGN_ADD:
      case TokenType.ASSIGN_SUB:
      case TokenType.ASSIGN_MUL:
      case TokenType.ASSIGN_DIV:
      case TokenType.ASSIGN_MOD:
        isOperator = true;
        break;
    }

    if (isOperator) {
      if (!Parser.isDestructuringAssignmentTarget(node)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      node = Parser.transformDestructuringAssignment(node);

      let bound = Parser.boundNames(node);
      if (firstDuplicate(bound) != null) {
        throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
      }

      if (this.strict && bound.some(isRestrictedWord)) {
        throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
      }

      this.lex();
      let right = this.parseAssignmentExpression();
      return this.markLocation(new Shift.AssignmentExpression(operator.type.name, node, right), startLocation);
    }

    if (
      node.type === "ObjectExpression" &&
      node.properties.some(p => p.type === "BindingPropertyIdentifier")
    ) {
      throw this.createUnexpected(operator);
    }

    return node;
  }

  parseConditionalExpression() {
    let startLocation = this.getLocation();
    let expr = this.parseBinaryExpression();
    if (this.match(TokenType.CONDITIONAL)) {
      this.lex();
      let previousAllowIn = this.allowIn;
      this.allowIn = true;
      let consequent = this.parseAssignmentExpression();
      this.allowIn = previousAllowIn;
      this.expect(TokenType.COLON);
      let alternate = this.parseAssignmentExpression();
      return this.markLocation(new Shift.ConditionalExpression(expr, consequent, alternate), startLocation);
    }

    return expr;
  }

  isBinaryOperator(type) {
    switch (type) {
      case TokenType.OR:
      case TokenType.AND:
      case TokenType.BIT_OR:
      case TokenType.BIT_XOR:
      case TokenType.BIT_AND:
      case TokenType.EQ:
      case TokenType.NE:
      case TokenType.EQ_STRICT:
      case TokenType.NE_STRICT:
      case TokenType.LT:
      case TokenType.GT:
      case TokenType.LTE:
      case TokenType.GTE:
      case TokenType.INSTANCEOF:
      case TokenType.SHL:
      case TokenType.SHR:
      case TokenType.SHR_UNSIGNED:
      case TokenType.ADD:
      case TokenType.SUB:
      case TokenType.MUL:
      case TokenType.DIV:
      case TokenType.MOD:
        return true;
      case TokenType.IN:
        return this.allowIn;
      default:
        return false;
    }
  }

  parseBinaryExpression() {
    let location = this.getLocation();
    let left = this.parseUnaryExpression();
    let operator = this.lookahead.type;

    let isBinaryOperator = this.isBinaryOperator(operator);
    if (!isBinaryOperator) {
      return left;
    }

    this.lex();
    let stack = [];
    stack.push({location, left, operator, precedence: BinaryPrecedence[operator.name]});
    location = this.getLocation();
    let right = this.parseUnaryExpression();

    operator = this.lookahead.type;
    isBinaryOperator = this.isBinaryOperator(this.lookahead.type);
    while (isBinaryOperator) {
      let precedence = BinaryPrecedence[operator.name];
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length && (precedence <= stack[stack.length - 1].precedence)) {
        let stackItem = stack[stack.length - 1];
        let stackOperator = stackItem.operator;
        left = stackItem.left;
        stack.pop();
        location = stackItem.location;
        right = this.markLocation(new Shift.BinaryExpression(stackOperator.name, left, right), location);
      }

      // Shift.
      this.lex();
      stack.push({location, left: right, operator, precedence});
      location = this.getLocation();
      right = this.parseUnaryExpression();

      operator = this.lookahead.type;
      isBinaryOperator = this.isBinaryOperator(operator);
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight((expr, stackItem) =>
      this.markLocation(new Shift.BinaryExpression(stackItem.operator.name, stackItem.left, expr), stackItem.location),
      right);
  }

  static isPrefixOperator(type) {
    switch (type) {
      case TokenType.INC:
      case TokenType.DEC:
      case TokenType.ADD:
      case TokenType.SUB:
      case TokenType.BIT_NOT:
      case TokenType.NOT:
      case TokenType.DELETE:
      case TokenType.VOID:
      case TokenType.TYPEOF:
        return true;
    }
    return false;
  }

  parseUnaryExpression() {
    if (this.lookahead.type.klass != TokenClass.Punctuator && this.lookahead.type.klass != TokenClass.Keyword) {
      return this.parsePostfixExpression();
    }
    let startLocation = this.getLocation();
    let operator = this.lookahead;
    if (!Parser.isPrefixOperator(operator.type)) {
      return this.parsePostfixExpression();
    }
    this.lex();
    let expr = this.parseUnaryExpression();
    switch (operator.type) {
      case TokenType.INC:
      case TokenType.DEC:
        // 11.4.4, 11.4.5;
        if (expr.type === "IdentifierExpression") {
          if (this.strict && isRestrictedWord(expr.identifier.name)) {
            throw this.createError(ErrorMessages.STRICT_LHS_PREFIX);
          }
        }

        if (!Parser.isValidSimpleAssignmentTarget(expr)) {
          throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        break;
      case TokenType.DELETE:
        if (expr.type === "IdentifierExpression" && this.strict) {
          throw this.createError(ErrorMessages.STRICT_DELETE);
        }
        break;
      default:
        break;
    }

    return this.markLocation(new Shift.PrefixExpression(operator.value, expr), startLocation);
  }

  parsePostfixExpression() {
    let startLocation = this.getLocation();

    let expr = this.parseLeftHandSideExpressionAllowCall();

    if (this.hasLineTerminatorBeforeNext) {
      return expr;
    }

    let operator = this.lookahead;
    if ((operator.type !== TokenType.INC) && (operator.type !== TokenType.DEC)) {
      return expr;
    }
    this.lex();
    // 11.3.1, 11.3.2;
    if (expr.type === "IdentifierExpression") {
      if (this.strict && isRestrictedWord(expr.identifier.name)) {
        throw this.createError(ErrorMessages.STRICT_LHS_POSTFIX);
      }
    }
    if (!Parser.isValidSimpleAssignmentTarget(expr)) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    }
    return this.markLocation(new Shift.PostfixExpression(expr, operator.value), startLocation);
  }

  parseLeftHandSideExpressionAllowCall() {
    let startLocation = this.getLocation();
    let previousAllowIn = this.allowIn;
    this.allowIn = true;
    let expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.markLocation(new Shift.CallExpression(expr, this.parseArgumentList()), startLocation);
      } else if (this.match(TokenType.LBRACK)) {
        expr = this.markLocation(new Shift.ComputedMemberExpression(expr, this.parseComputedMember()), startLocation);
      } else if (this.match(TokenType.PERIOD)) {
        expr = this.markLocation(new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startLocation);
      } else {
        break;
      }
    }

    this.allowIn = previousAllowIn;

    return expr;
  }

  parseLeftHandSideExpression() {
    let startLocation = this.getLocation();

    let expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

    while (this.match(TokenType.PERIOD) || this.match(TokenType.LBRACK)) {
      expr = this.markLocation(
          this.match(TokenType.LBRACK) ?
              new Shift.ComputedMemberExpression(expr, this.parseComputedMember()) :
              new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startLocation);
    }

    return expr;
  }

  parseNonComputedMember() {
    this.expect(TokenType.PERIOD);
    return this.parseNonComputedProperty();
  }

  parseComputedMember() {
    this.expect(TokenType.LBRACK);
    let expr = this.parseExpression();
    this.expect(TokenType.RBRACK);
    return expr;
  }

  parseNewExpression() {
    let startLocation = this.getLocation();
    this.expect(TokenType.NEW);
    let callee = this.parseLeftHandSideExpression();
    return this.markLocation(new Shift.NewExpression(callee, this.match(TokenType.LPAREN) ? this.parseArgumentList() :
        []), startLocation);
  }

  parsePrimaryExpression() {
    if (this.match(TokenType.LPAREN)) {
      return this.parseGroupExpression();
    }

    let startLocation = this.getLocation();

    switch (this.lookahead.type.klass) {
      case TokenClass.Ident:
        return this.markLocation(new Shift.IdentifierExpression(this.parseIdentifier()), startLocation);
      case TokenClass.StringLiteral:
        return this.parseStringLiteral();
      case TokenClass.NumericLiteral:
        return this.parseNumericLiteral();
      case TokenClass.Keyword:
      {
        if (this.match(TokenType.THIS)) {
          this.lex();
          return this.markLocation(new Shift.ThisExpression, startLocation);
        }
        if (this.match(TokenType.FUNCTION)) {
          return this.markLocation(this.parseFunction(true), startLocation);
        }
        break;
      }
      case TokenClass.BooleanLiteral:
      {
        let token = this.lex();
        return this.markLocation(new Shift.LiteralBooleanExpression(token.type == TokenType.TRUE_LITERAL), startLocation);
      }
      case TokenClass.NullLiteral:
      {
        this.lex();
        return this.markLocation(new Shift.LiteralNullExpression, startLocation);
      }
      default:
        if (this.match(TokenType.LBRACK)) {
          return this.parseArrayExpression();
        } else if (this.match(TokenType.LBRACE)) {
          return this.parseObjectExpression();
        } else if (this.match(TokenType.DIV) || this.match(TokenType.ASSIGN_DIV)) {
          this.index = this.startIndex;
          this.line = this.startLine;
          this.lineStart = this.startLineStart;
          this.lookahead = this.scanRegExp();
          let token = this.lex();
          try {
            let lastSlash = token.value.lastIndexOf("/");
            RegExp(token.value.slice(1, lastSlash), token.value.slice(lastSlash + 1));
          } catch (unused) {
            throw this.createErrorWithLocation(token, ErrorMessages.INVALID_REGULAR_EXPRESSION);
          }
          return this.markLocation(new Shift.LiteralRegExpExpression(token.value), startLocation);
        }
    }

    throw this.createUnexpected(this.lex());
  }

  parseNumericLiteral() {
    let startLocation = this.getLocation();
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    let token2 = this.lex();
    let node = token2._value === 1/0
      ? new Shift.LiteralInfinityExpression
      : new Shift.LiteralNumericExpression(token2._value);
    return this.markLocation(node, startLocation);
  }

  parseStringLiteral() {
    let startLocation = this.getLocation();
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    let token2 = this.lex();
    return this.markLocation(new Shift.LiteralStringExpression(token2._value, token2.slice.text),
        startLocation);
  }

  parseIdentifier() {
    let startLocation = this.getLocation();
    return this.markLocation(new Shift.Identifier(this.lex().value), startLocation);
  }

  parseArgumentList() {
    this.expect(TokenType.LPAREN);
    let args = this.parseArguments();
    this.expect(TokenType.RPAREN);
    return args;
  }

  parseArguments() {
    let result = [];
    while (true) {
      if (this.match(TokenType.RPAREN) || this.eof()) {
        return result;
      }
      let startTokenIndex = this.tokenIndex;
      let arg;
      if (this.eat(TokenType.ELLIPSIS)) {
        arg = this.parseAssignmentExpression();
        arg = this.markLocation(new Shift.SpreadElement(arg), startTokenIndex);
      } else {
        arg = this.parseAssignmentExpression();
      }
      result.push(arg);
      if (!this.eat(TokenType.COMMA)) {
        break;
      }
    }
    return result;
  }

  // 11.2 Left-Hand-Side Expressions;

  parseNonComputedProperty() {
    let startLocation = this.getLocation();

    let token = this.lex();

    if (!(token instanceof IdentifierLikeToken)) {
      throw this.createUnexpected(token);
    } else {
      return this.markLocation(new Shift.Identifier(token.value), startLocation);
    }
  }

  parseGroupExpression() {
    this.expect(TokenType.LPAREN);
    let expr = this.parseExpression();
    this.expect(TokenType.RPAREN);
    return expr;
  }


  parseArrayExpression() {
    let startLocation = this.getLocation();

    this.expect(TokenType.LBRACK);

    let elements = this.parseArrayExpressionElements();

    this.expect(TokenType.RBRACK);

    return this.markLocation(new Shift.ArrayExpression(elements), startLocation);
  }

  parseArrayExpressionElements() {
    let result = [];
    while (true) {
      if (this.match(TokenType.RBRACK)) {
        return result;
      }
      let el;

      if (this.match(TokenType.COMMA)) {
        this.lex();
        el = null;
      } else {
        let startTokenIndex = this.tokenIndex;
        if (this.eat(TokenType.ELLIPSIS)) {
          el = this.parseAssignmentExpression();
          el = this.markLocation(new Shift.SpreadElement(el), startTokenIndex);
        } else {
          el = this.parseAssignmentExpression();
        }
        if (!this.match(TokenType.RBRACK)) {
          this.expect(TokenType.COMMA);
        }
      }
      result.push(el);
    }
  }

  parseObjectExpression() {
    let startLocation = this.getLocation();

    this.expect(TokenType.LBRACE);

    let propertyMap = Object.create(null);
    let properties = this.parseObjectExpressionItems(propertyMap);

    this.expect(TokenType.RBRACE);

    return this.markLocation(new Shift.ObjectExpression(properties), startLocation);
  }


  parseObjectExpressionItems(propertyMap) {
    let result = [];
    while (!this.match(TokenType.RBRACE)) {
      result.push(this.parseObjectExpressionItem(propertyMap));
    }
    return result;
  }

  parseObjectExpressionItem(propertyMap) {
    let property = this.parseObjectProperty();
    let type = property.type;
    let key = "$" + (type === "BindingPropertyIdentifier" ? property.identifier.identifier.name : property.name.value);
    let value = {}.hasOwnProperty.call(propertyMap, key) ? propertyMap[key] : 0;

    if ({}.hasOwnProperty.call(propertyMap, key)) {
      if ((value & INIT_MASK) !== 0) {
        if (type === "DataProperty" && key === "$__proto__") {
          throw this.createError(ErrorMessages.DUPLICATE_PROTO_PROPERTY);
        } else if (type !== "DataProperty") {
          throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
        }
      } else {
        if (type === "DataProperty") {
          throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
        } else if ((value & GETTER_MASK) !== 0 && type == "Getter"
            || (value & SETTER_MASK) !== 0 && type == "Setter") {
          throw this.createError(ErrorMessages.ACCESSOR_GET_SET);
        }
      }
    }
    switch (type) {
      case "DataProperty":
        propertyMap[key] = value | INIT_MASK;
        break;
      case "Getter":
        propertyMap[key] = value | GETTER_MASK;
        break;
      case "Setter":
        propertyMap[key] = value | SETTER_MASK;
        break;
    }

    if (!this.match(TokenType.RBRACE)) {
      this.expect(TokenType.COMMA);
    }
    return property;
  }

  parseObjectPropertyKey() {
    let token = this.lookahead;
    let location = this.getLocation();

    // Note: This function is called only from parseObjectProperty(), where;
    // Eof and Punctuator tokens are already filtered out.

    if (token instanceof StringLiteralToken) {
      return this.markLocation(new Shift.StaticPropertyName(this.parseStringLiteral().value), location);
    }
    if (token instanceof NumericLiteralToken) {
      let numLiteral = this.parseNumericLiteral();
      return this.markLocation(new Shift.StaticPropertyName("" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value)), location);
    }
    if (token instanceof IdentifierLikeToken) {
      return this.markLocation(new Shift.StaticPropertyName(this.parseIdentifier().name), location);
    }

    throw this.createError(ErrorMessages.INVALID_PROPERTY_NAME);
  }

  parseObjectProperty() {
    let token = this.lookahead;
    let startLocation = this.getLocation();

    if (token.type === TokenType.IDENTIFIER) {
      let key = this.parseObjectPropertyKey();
      let name = token.value;
      if (name.length === 3) {
        // Property Assignment: Getter and Setter.
        if ("get" === name && !this.match(TokenType.COLON)) {
          key = this.parseObjectPropertyKey();
          this.expect(TokenType.LPAREN);
          this.expect(TokenType.RPAREN);
          let [body, isStrict] = this.parseFunctionBody();
          return this.markLocation(new Shift.Getter(key, body), startLocation);
        } else if ("set" === name && !this.match(TokenType.COLON)) {
          key = this.parseObjectPropertyKey();
          this.expect(TokenType.LPAREN);
          token = this.lookahead;
          if (token.type !== TokenType.IDENTIFIER) {
            this.expect(TokenType.RPAREN);
            throw this.createErrorWithLocation(token, ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
          } else {
            let param = this.parseVariableIdentifier();
            this.expect(TokenType.RPAREN);
            let [body, isStrict] = this.parseFunctionBody();
            if ((this.strict || isStrict) && isRestrictedWord(param.name)) {
              throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }
            return this.markLocation(new Shift.Setter(key, param, body), startLocation);
          }
        }
      }

      if (this.eat(TokenType.COLON)) {
        let value = this.parseAssignmentExpression();
        return this.markLocation(new Shift.DataProperty(key, value), startLocation);
      } else if(this.eat(TokenType.ASSIGN)) {
        return this.markLocation(new Shift.BindingPropertyIdentifier(
          new Shift.BindingIdentifier(new Shift.Identifier(key.value)),
          this.parseAssignmentExpression()
        ), startLocation);
      } else {
        return this.markLocation(new Shift.ShorthandProperty(new Shift.Identifier(key.value)), startLocation);
      }
    }
    if (this.eof() || token.type.klass == TokenClass.Punctuator) {
      throw this.createUnexpected(token);
    } else {
      let key = this.parseObjectPropertyKey();
      this.expect(TokenType.COLON);
      let value = this.parseAssignmentExpression();
      return this.markLocation(new Shift.DataProperty(key, value), startLocation);
    }
  }

  parseFunction(isExpression) {
    let startLocation = this.getLocation();

    this.expect(TokenType.FUNCTION);

    let id = null;
    let message = null;
    let firstRestricted = null;
    if (!isExpression || !this.match(TokenType.LPAREN)) {
      let token = this.lookahead;
      id = this.parseVariableIdentifier();
      if (this.strict) {
        if (isRestrictedWord(id.name)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_FUNCTION_NAME);
        }
      } else {
        if (isRestrictedWord(id.name)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_FUNCTION_NAME;
        } else if (isStrictModeReservedWordES5(id.name)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_RESERVED_WORD;
        }
      }
    }
    let info = this.parseParams(firstRestricted);

    if (info.message != null) {
      message = info.message;
    }

    let previousStrict = this.strict;
    let [body, isStrict] = this.parseFunctionBody();
    if (message != null) {
      if ((this.strict || isStrict) && info.firstRestricted != null) {
        throw this.createErrorWithLocation(info.firstRestricted, message);
      }
      if ((this.strict || isStrict) && info.stricted != null) {
        throw this.createErrorWithLocation(info.stricted, message);
      }
    }
    this.strict = previousStrict;
    return this.markLocation(
      new (isExpression ? Shift.FunctionExpression : Shift.FunctionDeclaration)(false, id, info.params, info.rest, body),
      startLocation
    );
  }


  parseParams(fr) {
    let info = {params: [], rest: null};
    info.firstRestricted = fr;
    this.expect(TokenType.LPAREN);

    if (!this.match(TokenType.RPAREN)) {
      let bound = [];
      let seenRest = false;

      while (!this.eof()) {
        let token = this.lookahead;
        let startTokenIndex = this.tokenIndex;
        let param;
        if (this.eat(TokenType.ELLIPSIS)) {
          token = this.lookahead;
          param = this.parseLeftHandSideExpression();
          seenRest = true;
        } else {
          param = this.parseLeftHandSideExpression();
          if (this.eat(TokenType.ASSIGN)) {
            param = this.markLocation(new Shift.AssignmentExpression("=", param, this.parseAssignmentExpression()));
          }
        }

        if (!Parser.isDestructuringAssignmentTargetWithDefault(param)) {
          throw this.createUnexpected(token);
        }
        param = Parser.transformDestructuringAssignment(param);

        let newBound = Parser.boundNames(param);
        [].push.apply(bound, newBound);

        if (firstDuplicate(newBound) != null) {
          throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(newBound));
        }
        if (this.strict) {
          if (newBound.some(isRestrictedWord)) {
            info.stricted = token;
            info.message = ErrorMessages.STRICT_PARAM_NAME;
          } else if (firstDuplicate(bound) != null) {
            info.stricted = token;
            info.message = ErrorMessages.STRICT_PARAM_DUPE;
          }
        } else if (info.firstRestricted == null) {
          if (newBound.some(isRestrictedWord)) {
            info.firstRestricted = token;
            info.message = ErrorMessages.STRICT_PARAM_NAME;
          } else if (intersection(STRICT_MODE_RESERVED_WORD, newBound).length > 0) {
            info.firstRestricted = token;
            info.message = ErrorMessages.STRICT_RESERVED_WORD;
          } else if (firstDuplicate(bound) != null) {
            info.firstRestricted = token;
            info.message = ErrorMessages.STRICT_PARAM_DUPE;
          }
        }

        if (seenRest) {
          info.rest = param;
          break;
        }
        info.params.push(param);
        if (this.match(TokenType.RPAREN)) {
          break;
        }
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RPAREN);
    return info;
  }


}
