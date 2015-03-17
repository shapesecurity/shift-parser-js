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

export const ErrorMessages = {
  UNEXPECTED_TOKEN: "Unexpected token {0}",
  UNEXPECTED_ILLEGAL_TOKEN: "Unexpected token ILLEGAL",
  UNEXPECTED_NUMBER: "Unexpected number",
  UNEXPECTED_STRING: "Unexpected string",
  UNEXPECTED_IDENTIFIER: "Unexpected identifier",
  UNEXPECTED_RESERVED_WORD: "Unexpected reserved word",
  UNEXPECTED_EOS: "Unexpected end of input",
  UNEXPECTED_LINE_TERMINATOR: "Unexpected line terminator",
  NEWLINE_AFTER_THROW: "Illegal newline after throw",
  INVALID_REGULAR_EXPRESSION: "Invalid regular expression",
  UNTERMINATED_REG_EXP: "Invalid regular expression: missing /",
  INVALID_LHS_IN_ASSIGNMENT: "Invalid left-hand side in assignment",
  INVALID_LHS_IN_FOR_IN: "Invalid left-hand side in for-in",
  INVALID_LHS_IN_FOR_OF: "Invalid left-hand side in for-of",
  MULTIPLE_DEFAULTS_IN_SWITCH: "More than one default clause in switch statement",
  NO_CATCH_OR_FINALLY: "Missing catch or finally after try",
  UNKNOWN_LABEL: "Undefined label '{0}'",
  LABEL_REDECLARATION: "Label '{0}' has already been declared",
  ILLEGAL_CONTINUE: "Illegal continue statement",
  ILLEGAL_BREAK: "Illegal break statement",
  ILLEGAL_RETURN: "Illegal return statement",
  STRICT_MODE_WITH: "Strict mode code may not include a with statement",
  STRICT_CATCH_VARIABLE: "Catch variable may not be eval or arguments in strict mode",
  STRICT_VAR_NAME: "Variable name may not be eval or arguments in strict mode",
  STRICT_PARAM_NAME: "Parameter name eval or arguments is not allowed in strict mode",
  STRICT_PARAM_DUPE: "Strict mode function may not have duplicate parameter names",
  STRICT_FUNCTION_NAME: "Function name may not be eval or arguments in strict mode",
  STRICT_OCTAL_LITERAL: "Octal literals are not allowed in strict mode.",
  STRICT_DELETE: "Delete of an unqualified identifier in strict mode.",
  DUPLICATE_PROTO_PROPERTY: "Duplicate __proto__ property in object literal not allowed",
  DUPLICATE_BINDING: "Duplicate binding '{0}'",
  LEXICALLY_BOUND_LET: "Invalid lexical binding name 'let'",
  ACCESSOR_DATA_PROPERTY: "Object literal may not have data and accessor property with the same name",
  ACCESSOR_GET_SET: "Object literal may not have multiple get/set accessors with the same name",
  STRICT_LHS_ASSIGNMENT: "Assignment to eval or arguments is not allowed in strict mode",
  STRICT_LHS_POSTFIX: "Postfix increment/decrement may not have eval or arguments operand in strict mode",
  STRICT_LHS_PREFIX: "Prefix increment/decrement may not have eval or arguments operand in strict mode",
  STRICT_RESERVED_WORD: "Use of future reserved word in strict mode",
  ILLEGAL_ARROW_FUNCTION_PARAMS: "Illegal arrow function parameter list",
  INVALID_VAR_INIT_FOR_IN: "Invalid variable declaration in for-in statement",
  INVALID_VAR_INIT_FOR_OF: "Invalid variable declaration in for-of statement",
  INVALID_VAR_LHS_FOR_OF: "Invalid left-hand-side expression in for-of statement",
  UNEXPECTED_SUPER_CALL: "Unexpected super call",
  UNEXPECTED_SUPER_PROPERTY: "Unexpected super property",
  IMPORT_DUPE: "Duplicate imported names in import declaration",
  UNEXPECTED_NEW_TARGET: "Unexpected new . target",
  DUPLICATE_EXPORTED_NAME: "Duplicate export of '{0}'",
  MODULE_EXPORT_UNDEFINED: "Export '{0}' is not defined in module",
  ILLEGAL_PROPERTY: "Illegal property initializer",
  DUPLICATE_CATCH_BINDING: "Catch parameter '{0}' redeclared as var in for-of loop",
};
