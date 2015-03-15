"use strict";

exports.parseModule = parseModule;
exports.parseScript = parseScript;
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

var Parser = require("./parser").Parser;
var Shift = require("shift-ast");

function markLocation(node, location) {
  node.loc = {
    start: location,
    end: {
      line: this.lastLine + 1,
      column: this.lastIndex - this.lastLineStart,
      offset: this.lastIndex },
    source: null
  };
  return node;
}

function parseModule(code) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];
  var _ref$loc = _ref.loc;
  var loc = _ref$loc === undefined ? false : _ref$loc;
  var parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parseModule();
}

function parseScript(code) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];
  var _ref$loc = _ref.loc;
  var loc = _ref$loc === undefined ? false : _ref$loc;
  var parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parseScript();
}

exports["default"] = parseScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztRQWlDZ0IsV0FBVyxHQUFYLFdBQVc7UUFRWCxXQUFXLEdBQVgsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF6Qm5CLE1BQU0sV0FBTyxVQUFVLEVBQXZCLE1BQU07SUFFRixLQUFLLFdBQU0sV0FBVzs7QUFFbEMsU0FBUyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxNQUFJLENBQUMsR0FBRyxHQUFHO0FBQ1QsU0FBSyxFQUFFLFFBQVE7QUFDZixPQUFHLEVBQUU7QUFDSCxVQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDO0FBQ3ZCLFlBQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhO0FBQzNDLFlBQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUN2QjtBQUNELFVBQU0sRUFBRSxJQUFJO0dBQ2IsQ0FBQztBQUNGLFNBQU8sSUFBSSxDQUFDO0NBQ2I7O0FBRU0sU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFzQjswQ0FBSixFQUFFO3NCQUFqQixHQUFHO01BQUgsR0FBRyw0QkFBRyxLQUFLO0FBQzVDLE1BQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLE1BQUksR0FBRyxFQUFFO0FBQ1AsVUFBTSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7R0FDcEM7QUFDRCxTQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztDQUM3Qjs7QUFFTSxTQUFTLFdBQVcsQ0FBQyxJQUFJLEVBQXNCOzBDQUFKLEVBQUU7c0JBQWpCLEdBQUc7TUFBSCxHQUFHLDRCQUFHLEtBQUs7QUFDNUMsTUFBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsTUFBSSxHQUFHLEVBQUU7QUFDUCxVQUFNLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztHQUNwQztBQUNELFNBQU8sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0NBQzdCOztxQkFFYyxXQUFXIiwiZmlsZSI6InNyYy9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge1BhcnNlcn0gZnJvbSBcIi4vcGFyc2VyXCI7XG5cbmltcG9ydCAqIGFzIFNoaWZ0IGZyb20gXCJzaGlmdC1hc3RcIjtcblxuZnVuY3Rpb24gbWFya0xvY2F0aW9uKG5vZGUsIGxvY2F0aW9uKSB7XG4gIG5vZGUubG9jID0ge1xuICAgIHN0YXJ0OiBsb2NhdGlvbixcbiAgICBlbmQ6IHtcbiAgICAgIGxpbmU6IHRoaXMubGFzdExpbmUgKyAxLFxuICAgICAgY29sdW1uOiB0aGlzLmxhc3RJbmRleCAtIHRoaXMubGFzdExpbmVTdGFydCxcbiAgICAgIG9mZnNldDogdGhpcy5sYXN0SW5kZXgsXG4gICAgfSxcbiAgICBzb3VyY2U6IG51bGxcbiAgfTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1vZHVsZShjb2RlLCB7bG9jID0gZmFsc2V9ID0ge30pIHtcbiAgbGV0IHBhcnNlciA9IG5ldyBQYXJzZXIoY29kZSk7XG4gIGlmIChsb2MpIHtcbiAgICBwYXJzZXIubWFya0xvY2F0aW9uID0gbWFya0xvY2F0aW9uO1xuICB9XG4gIHJldHVybiBwYXJzZXIucGFyc2VNb2R1bGUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2NyaXB0KGNvZGUsIHtsb2MgPSBmYWxzZX0gPSB7fSkge1xuICBsZXQgcGFyc2VyID0gbmV3IFBhcnNlcihjb2RlKTtcbiAgaWYgKGxvYykge1xuICAgIHBhcnNlci5tYXJrTG9jYXRpb24gPSBtYXJrTG9jYXRpb247XG4gIH1cbiAgcmV0dXJuIHBhcnNlci5wYXJzZVNjcmlwdCgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZVNjcmlwdDtcbiJdfQ==