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
  node.loc = new Shift.SourceSpan(location, new Shift.SourceLocation(this.lastIndex, this.lastLine + 1, this.lastIndex - this.lastLineStart));
  return node;
}

function parseModule(code) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];
  var _ref$loc = _ref.loc;
  var loc = _ref$loc === undefined ? false : _ref$loc;
  var parser = new Parser(code);
  parser.module = true;
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parse();
}

function parseScript(code) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];
  var _ref$loc = _ref.loc;
  var loc = _ref$loc === undefined ? false : _ref$loc;
  var parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parse();
}

exports["default"] = parseScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztRQXlCZ0IsV0FBVyxHQUFYLFdBQVc7UUFTWCxXQUFXLEdBQVgsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFsQm5CLE1BQU0sV0FBTyxVQUFVLEVBQXZCLE1BQU07SUFFRixLQUFLLFdBQU0sV0FBVzs7QUFFbEMsU0FBUyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxNQUFJLENBQUMsR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUM1SSxTQUFPLElBQUksQ0FBQztDQUNiOztBQUVNLFNBQVMsV0FBVyxDQUFDLElBQUksRUFBc0I7MENBQUosRUFBRTtzQkFBakIsR0FBRztNQUFILEdBQUcsNEJBQUcsS0FBSztBQUM1QyxNQUFJLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QixRQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNyQixNQUFJLEdBQUcsRUFBRTtBQUNQLFVBQU0sQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO0dBQ3BDO0FBQ0QsU0FBTyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Q0FDdkI7O0FBRU0sU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFzQjswQ0FBSixFQUFFO3NCQUFqQixHQUFHO01BQUgsR0FBRyw0QkFBRyxLQUFLO0FBQzVDLE1BQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLE1BQUksR0FBRyxFQUFFO0FBQ1AsVUFBTSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7R0FDcEM7QUFDRCxTQUFPLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztDQUN2Qjs7cUJBRWMsV0FBVyIsImZpbGUiOiJzcmMvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtQYXJzZXJ9IGZyb20gXCIuL3BhcnNlclwiO1xuXG5pbXBvcnQgKiBhcyBTaGlmdCBmcm9tIFwic2hpZnQtYXN0XCI7XG5cbmZ1bmN0aW9uIG1hcmtMb2NhdGlvbihub2RlLCBsb2NhdGlvbikge1xuICBub2RlLmxvYyA9IG5ldyBTaGlmdC5Tb3VyY2VTcGFuKGxvY2F0aW9uLCBuZXcgU2hpZnQuU291cmNlTG9jYXRpb24odGhpcy5sYXN0SW5kZXgsIHRoaXMubGFzdExpbmUgKyAxLCB0aGlzLmxhc3RJbmRleCAtIHRoaXMubGFzdExpbmVTdGFydCkpO1xuICByZXR1cm4gbm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTW9kdWxlKGNvZGUsIHtsb2MgPSBmYWxzZX0gPSB7fSkge1xuICBsZXQgcGFyc2VyID0gbmV3IFBhcnNlcihjb2RlKTtcbiAgcGFyc2VyLm1vZHVsZSA9IHRydWU7XG4gIGlmIChsb2MpIHtcbiAgICBwYXJzZXIubWFya0xvY2F0aW9uID0gbWFya0xvY2F0aW9uO1xuICB9XG4gIHJldHVybiBwYXJzZXIucGFyc2UoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2NyaXB0KGNvZGUsIHtsb2MgPSBmYWxzZX0gPSB7fSkge1xuICBsZXQgcGFyc2VyID0gbmV3IFBhcnNlcihjb2RlKTtcbiAgaWYgKGxvYykge1xuICAgIHBhcnNlci5tYXJrTG9jYXRpb24gPSBtYXJrTG9jYXRpb247XG4gIH1cbiAgcmV0dXJuIHBhcnNlci5wYXJzZSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZVNjcmlwdDtcbiJdfQ==