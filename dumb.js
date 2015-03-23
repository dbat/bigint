"use strict";

var LF = '\n';
var LF2 = LF + LF;
var TAB = '\t';
var s = '', s1 ='', s2 = '';

  function _saniter(str) {
  // replace symbols and special chars
    var e = str.split('');
    for (var i = 0; i < e.length; i++) {
      var f = e[i].charCodeAt();
      if (f < 0x20)
        switch(e[i]) {
          case '\b': e[i] ='\\b'; break;
          case '\f': e[i] ='\\f'; break;
          case '\n': e[i] ='\\n'; break;
          case '\r': e[i] ='\\r'; break;
          case '\t': e[i] ='\\t'; break;
          case '\v': e[i] ='\\v'; break;
          case '\0': e[i] ='\\0'; break;
          default: e[i] = '\\x' + f < 0x10 ? '0': '' + f.toString(16);
        }
    }
    return e.join('');
  }

function _isArray(obj) { return Object.prototype.toString.call(obj) === '[object Array]'; }

function _dump(obj, inden, lf, lm, nquot, spc) {
  var SLF = '\n', DLM = ',', DBLC = ':';
  inden = inden || '';
  lm = lm || '';
  lf = lf || '';
  nquot = nquot || '';
  var squot = squot || '\x22';
  spc = spc || ' ';
  var spclf = lf || spc;
  var s = '';
  if (typeof obj !== 'object') return obj;
  for (var prop in obj) {
    if (s) s += DLM + spclf;
    s += lm;
    if (!_isArray(obj))
      s += nquot + prop + nquot + DBLC + spc;
    else
      s += prop + DBLC + spc;
    var p = obj[prop];
    if (typeof p === 'function') s += p.toString().split(SLF).join(SLF + lm);
    else if (typeof p === 'string') s += squot + _saniter(p.toString()) + squot;
    else if (typeof p === 'object') {
      if (p == null) s += 'null';
      else {
        if (p.length == 0) {
          if (_isArray(p)) s += '[]';
          else  s += '{}';
        }
        else {
          var prefix = '{' + lf;
          var suffix = lf + lm + '}';
          if (_isArray(p)) {
            var prefix = '[' + lf;
            var suffix = lf + lm + ']';
          }
          s += prefix + _dump(p, inden, lf, lm + inden, nquot, spc) + suffix;
        }
      }
    }
    else s += p;
  }
  return s;
}

/*
  function gettype(obj) {
    if typeof object === 'undefined' return 'undefined'; //0
    if typeof object === 'object' return 'object'; // 6;
    if typeof object === 'string' return 'string'; // 3;
    if typeof object === 'number' return 'number'; // 2;
    if typeof object === 'boolean' return 'boolean'; // 1;
    if typeof object === 'function' return 'function'; // 5;
    if typeof object === 'symbol' return 'symbol'; // 4;
    return 'unknown'; // -1
  }
*/

function dump2(object) {
  var lm = '';
  var inden = '  ';
  var nquot = '\x27';
  var lf = '\n';
  var spc = ' ';
  return dump(object, inden, lf, lm, nquot, spc);
}

function dump4(object) { // mimics JSON.stringify
  var lm = '    ';
  var inden = '    ';
  var nquot = '\x22';
  var lf = '\n';
  var spc = ' ';
  return dump(object, inden, lf, lm, nquot, spc);
}

function dump(object, inden, lf, lm, nquot, spc) {
  var s = _dump(object, inden, lf, lm, nquot, spc);
  if (!s) return s;
  if (typeof object === 'object') s = '{\n' + s + '\n}'
  return (s);
}

function gete(id)  { return window.document.getElementById(id); }
function vid(id) { return (typeof id === 'string') ? gete(id) : id; }
//function vlogs(log) { return vid(log).innerHTML; }

function getVal(id)  { return vid(id).value; }
function getInt(id) { return parseInt(getVal(id)); }
function putVal(id, val)  { vid(id).value = val; }

function putLog(log, S) { vid(log).innerHTML = S; }
function addLog(log, S) { vid(log).innerHTML += S; }
var evalShow = function(log, value) { vid(log).innerHTML = value; }

