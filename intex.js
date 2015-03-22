"use strict"


/*
Copyright 2003-2014 Adrian H, Ray AF and Raisa NF
Private property of PT SOFTINDO Jakarta
All right reserved
*/

/*
  integer functions

  at first, we would like to make them object-oriented sounds,
  with fancy range checking (means several method calls) almost
  in every turns, but finally we decided to cut te red tapes
  down to the real bone crunching buffer, left only the sane
  consumer happy, the careless ones may go to the nexus.
  --
  I used to speak in assembly x86, the optimisation applied
  here may not be appropriate and left for further exercise.
*/

var i, j, k, n;

var CAP32 = 0x100000000, CAP16 = 0x10000;
var CAP31 =  0x80000000;
var MASK31 =  0x7fffffff;
var MASK32 =  0xffffffff, MASK16 = 0xffff;
var CAP53 = 0x20000000000000;
var POSITIVIZE = [0, CAP32];
var MAXBITS = 1 << 16; // 16 = 64K, 20 = 1M, max: 31 = 2G.
var DEBUG_MODE = 0; //-1;

var DEBUG_MODE_Active = typeof DEBUG !== 'undefined' && DEBUG;
var Intx = function(bits) {
  // don't worry, -2 still a valid mask
  bits &= (MAXBITS << 1) -1; // xtupiz operator precedence!
                             // how come mult lesser than add?
  this.bits = 0;
  //this.size = 0;
  if (DEBUG_MODE) this.DEBUG = DEBUG_MODE;
  if (DEBUG_MODE & 1) {
    this.debug_depth = 0;
    this.debug_index = 0;
  }
  var _i = arguments[1] | 0, _j = arguments[2] | 0,
    _k = arguments[3] | 0, _e = arguments[4], _b = arguments[5];
  if (!_k) {
    _j = _fxGetBits(bits, 128) >>> 6;
    if (DEBUG_MODE & 2) {
      _e = this.debug_enums = [];
      _b = this.debug_dwords = [];
    }
  }
  if (DEBUG_MODE & 1) this.debug_depth = _k++;

// procedural processing backend
var Buffy = {n:[], f:[]}; //numbers[lo,hi,lo,..], flags[zero,neg,zero,..]
function fnStore(that) { return _fxStore(Buffy, 0, that.bits >>> 5, that); }
function fnRestore(that) { _fxRestore(Buffy, 0, that.bits >>> 5, that); Buffy = {n:[], f:[]}; }
this.store = function() { return fnStore(this); }; // give intxs values to Buffy
this.restore = function() { fnRestore(this); }; // ask Buffy for values, put them back, kill her after.

  if (bits >= 256) {
    var mid = (_i + _j) >>> 1;
    this.lo = new Intx(bits >>> 1, _i, mid, _k, _e, _b);
    this.hi = new Intx(bits >>> 1, mid, _j, _k, _e, _b);
    this.bits = this.lo.bits << 1;
    //this.size = this.bits >>> 5;
  }
  else {
    this.bits = 128;
    this.lo = new Int64(0);
    this.hi = new Int64(0);
    if (DEBUG_MODE & 2) {
      _e[_i] = this.lo;
      _e[_i + 1] = this.hi;
      var p = _i << 1;
      _b[p + 0] = this.lo.lo; _b[p + 1] = this.lo.hi;
      _b[p + 2] = this.hi.lo; _b[p + 3] = this.hi.hi;
    }
  }
  if (DEBUG_MODE & 1) {
    { this.lo.debug_depth = _k; this.lo.debug_index = _i; }
    { this.hi.debug_depth = _k; this.hi.debug_index = _i + 1; }
  }
  return this;
}

var Int64 = function(lo, hi) {
  // if lo > 32bits, hi replaced by lo's exp
  //var cpr = "\n|\tCopyright 2015\n|\tkaka, aa and ade\n|\tAll rights reserved\n";
  lo = lo || 0; hi = hi || 0;
  if (DEBUG_MODE & 4) {
    lo = parseInt(Math.random() * CAP32);
    hi = parseInt(Math.random() * CAP32);
  }
  var ovr = 0, neg = 0, nol = 0;
  var d0 = lo & MASK32, d1 = hi;
  d0 += POSITIVIZE[+(d0 < 0)];
  if (lo >= CAP32 || lo <= -CAP32)
    d1 = parseInt(lo / CAP32);
  ovr = d1 >= CAP32 || d1 <= -CAP32
  d1 &= MASK32;
  neg = +(d1 < 0);
  d1 += POSITIVIZE[neg];
  nol = d0 == 0 && d1 == 0;
  this.lo = d0;
  this.hi = d1;
  this.cf = +ovr;
  this.sf = +neg;
  this.zf = +nol;
  this.bits = 64; //function() { return 64; };
  return this;
};

  var _fxGetBits = function(bits, minbits) {
    var k = k | 64; k &= -k;
    while (k > 0 && bits >= k) k <<= 1;
    return (k >>>= 1);
  };

var i64Assign = function(q, B, i) { // put/load B[] to items
  i = i|0;
  if (B.length <= i)
    return q.Clear();
  var d0 = B[i] & MASK32;
  var d1 = B[i + 1] & MASK32;
  q.sf = +(d1 < 0);
  d0 += (d0 < 0) * CAP32;
  d1 += (d1 < 0) * CAP32;
  q.lo = d0; q.hi = d1; q.cf = 0;
  q.zf = d0 == 0 && d1 == 0;
};

var i64Clear = function(q) {
  { q.lo = 0; q.hi = 0; }
  { q.cf = 0; q.sf = 0; q.zf = 1; }
  return q;
};

// set sign flag, used for shift
// this is not a negate -A = ~(A + 1)
var i64SetSign = function(q) {
  { q.hi |= BSHL31; q.hi += BSHL32; }
  { q.cf = 0; q.sf = 1; q.zf = 0; }
  return q;
};

var i64SetOdd = function(q) {
  { q.lo |= 1; if (q.lo < 0) q.lo += BSHL32; }
  { q.cf = 0; q.zf = 0; }
  return q;
};

//var i64isNeg = function(X) { return X.hi & BSHL31 != 0; }
//var i64isZero = function(X) { return X.lo == 0 && X.hi == 0; }

var i64Copyto = function(q, p) { //copy from p to q
  //if (!q.bits || p.bits != q.bits) return q;
  q.lo = p.lo; q.hi = p.hi;
  q.cf = X.cf; q.sf = p.sf; q.zf = p.zf;
  return q;
};

var i64Copyfrom = function(q, p) { //copy from q to p
  //if (!q.bits || p.bits != q.bits) return p;
  p.lo = Y.lo; p.hi = q.hi;
  p.cf = Y.cf; p.sf = q.sf; p.zf = q.zf;
  return p;
};

var i64Swap = function(q) {
  var a = q.lo; q.lo = q.hi; q.hi = a;
  q.cf = 0; q.sf = +(a & BSHL31 != 0); q.zf = +(a == 0 && q.lo == 0);
  return q;
};

var intxCopyto = function(Y, X) { // copy from X to Y
  //if (!Y.bits || X.bits != Y.bits) return Y;
  X.lo.copyto(Y.lo); X.hi.copyto(Y.hi);
  return Y;
};

var intxCopyfrom = function(Y, X) { // copy from Y to X
  //if (!Y.bits || X.bits != Y.bits) return X;
  X.lo.copyfrom(Y.lo); X.hi.copyfrom(Y.hi);
  return X;
};

var intxSwap = function(X) {
  var a = X.lo; X.lo = X.hi; X.hi = a; X.cf = 0;
  return X;
};

var intxClone = function(X) { // create new object
  var Y = new Intx(X.bits);
  return X.copyto(Y);
};

var intxDuplex = function(a) {
  var Y = new Intx(a.bits + a.bits);
  a.copyto(Y.lo);
  a.copyto(Y.hi);
  return Y;
};

var intxExtend = function(a) {
  var Y = new Intx(a.bits + a.bits);
  a.copyto(Y.lo);
  return Y;
};

var intxClear = function(X) {
  X.lo.Clear();
  X.hi.Clear();
  return X;
};

//var intxAssign = function(B, i, j, X) {
var intxAssign = function(X, B, i) { // put/load B[] to items
  i = i |0;
  if (B.length <= i)
    return X.Clear();
  var j = X.bits >>> 5;
  var mid = i + (j >>> 1)
  X.lo.assign(B, i);
  X.hi.assign(B, mid);
  return X;
};

var intxSetValue = function(X, NumberStr) {
  var B = _fxNumberstoBuf(NumberStr);
  for (var i = B.length; i < (X.bits >>> 5); i++)
    B[i] = 0;
  X.assign(B, 0);
};



// these are functions. not prototypes.
//var intxIsZero = function(X) { return X.hi.isZero() && X.lo.isZero(); }
var i64toHex = function(q) { return _toHex32(q.hi) + _toHex32(q.lo); };
var i64toDecimals = function(q) { return _fxbtoDecimals([q.lo, q.hi]); };
var i64GetItems = function(q) { return A = [q.lo, q.hi]; };
var intxtoHex = function(X) { return X.hi.toHex() + X.lo.toHex(); };
var intxtoString = function(X) { return X.hi.toString() + X.lo.toString(); };
//var intxtoDecimals = function(X) { return _fxbtoDecimals(X.items()); };
var intxtoDecimals = function(X) { return _fxbtoDec(X.items()); };
//var intxGetItems = function() { return X.lo.items().push(X.hi.items()); };


Int64.prototype.copyto = function(q) { return i64Copyto(q, this); };
Int64.prototype.copyfrom = function(q) { return i64Copyfrom(q, this); };
Int64.prototype.swap = function() { return i64Swap(this); };
Int64.prototype.clone = function() { return intxClone(this); };
Int64.prototype.duplex = function() { return intxDuplex(this); };
Int64.prototype.extend = function() { return intxExtend(this); };
Int64.prototype.Clear = function() { return i64Clear(this); };
Int64.prototype.setOdd = function() { return i64SetOdd(this); };
Int64.prototype.setSign = function() { return i64SetSign(this); };
//Int64.prototype.setCarry = function(val) { return this.hi.cf = val; };
Int64.prototype.isNeg = function() { return this.hi & BSHL31 != 0; };
Int64.prototype.isOdd = function() { return this.lo & 1; };
Int64.prototype.isZero = function() { return this.lo == 0 && this.hi == 0; };
Int64.prototype.isCarry = function() { return this.hi.cf; };
Int64.prototype.toHex = function(q) { return i64toHex(this); };
Int64.prototype.toString = function(q) { return i64toHex(this); };
Int64.prototype.toDecimals = function(q) { return i64toDecimals(this); };
Int64.prototype.items = function() { return [this.lo, this.hi]; };

// Buffer might not be at the same size with Int64, hence the index,
// it specifies the start position from Buffer to be assigned.
// If index is not specified, it will be set to 0
Int64.prototype.assign = function(B, index) { i64Assign(this, B, index); };
Int64.prototype.setValue = function(NumberStr) { intxSetValue(this, NumberStr); };

Intx.prototype.copyto = function(Y) { return intxCopyto(Y, this); };
Intx.prototype.copyfrom = function(Y) { return intxCopyfrom(Y, this); };
Intx.prototype.swap = function() { return intxSwap(this); };
Intx.prototype.clone = function() { return intxClone(this); };
Intx.prototype.duplex = function() { return intxDuplex(this); };
Intx.prototype.extend = function() { return intxExtend(this); };
Intx.prototype.Clear = function() { return intxClear(this); };
Intx.prototype.setOdd = function() { return this.lo.setOdd(); };
Intx.prototype.setSign = function() { return this.hi.setSign(); };
//Intx.prototype.setCarry = function() { return this.hi.setCarry(); };
Intx.prototype.isNeg = function() { return this.hi.isNeg(); };
Intx.prototype.isOdd = function() { return this.lo.isOdd(); };
Intx.prototype.isZero = function() { return this.lo.isZero() && this.hi.isZero(); };
Intx.prototype.isCarry = function() { return this.hi.isCarry(); };
Intx.prototype.toHex = function() { return intxtoHex(this); };
Intx.prototype.toString = function() { return intxtoString(this); };
Intx.prototype.toDecimals = function() { return intxtoDecimals(this); };
Intx.prototype.items = function() { return this.lo.items().concat(this.hi.items()); };
Intx.prototype.enums = function() { return this.bits > 64 ? this.lo.items().concat(this.hi.items()) : []; };
//Intx.prototype.Assign = function(B, i, j) { return intxAssign(this, B, i, j); };

// Buffer might not be at the same size with Intx, hence the index,
// it specifies the start position from Buffer to be assigned.
// If index is not specified, it will be set to 0
Intx.prototype.assign = function(B, index) { return intxAssign(this, B, index); };
Intx.prototype.setValue = function(NumberStr) { intxSetValue(this, NumberStr); };


var intxInc1 = function(X) {
  X.lo.inc1();
  if (!X.lo.cf) return X;
  X.hi.inc1();
  X.cf = X.hi.cf;
  return X;
};

var intxDec1 = function(X) {
  X.lo.dec1();
  if (!X.lo.cf) return X;
  X.hi.dec1();
  X.cf = X.hi.cf;
  return X;
};

var intxInc = function(val, X) {
  if (val <= 1) {
    if (val < 0) return intxDec(-val, X);
    if (val == 1) return intxInc1(X);
    if (!val) return X;
  }
  X.lo.dec(val);
  if (!X.lo.cf) return X;
  X.hi.inc1;
  X.cf = X.hi.cf;
  return X;
};

var intxDec = function(val, X) {
  if (val <= 1) {
    if (val < 0) return intxInc(-val, X);
    if (val == 1) return intxDec1(X);
    if (!val) return X;
  }
  X.lo.dec(val);
  if (!X.lo.cf) return X;
  X.hi.dec1;
  X.cf = X.hi.cf;
  return X;
};

// Intx.prototype.inc1 = function() { return intxInc1(this); }
// Intx.prototype.dec1 = function() { return intxDec1(this); }
// Intx.prototype.inc = function(val) { return intxInc(val, this); }
// Intx.prototype.dec = function(val) { return intxDec(val, this); }

  // continues multiplication with previous reminder
  function _fxMul32r(a, b, r) { return _fxMul16r(a, b& 0xffff, b>>>16, r); }
  function _fxMul16r(n, eLo, eHi, r) {
    var xLo = n * eLo, xHi = n * eHi, ovr = 0;
    var a0 = xLo & 0xffffffff, a1 = xHi << 16;
    if (a0 < 0) a0 += 0x100000000;
    if (a1 < 0) a1 += 0x100000000;

    var lo = a0 + a1 + r;
    if (lo >= 0x100000000) {
      ovr++;
      lo -= 0x100000000;
      if (lo >= 0x100000000) { // r might caused double carry
        ovr++;
        lo -= 0x100000000;
      }
    }
    var b0 = (xLo / 0x100000000) |0;
    var b1 = (xHi / 0x10000) |0; // don't do shiftright, over 32bits value!
    if (b1 < 0) b1 += 0x100000000; // turn out b1 can be signed!
    var hi = b0 + b1 + ovr;
    return [lo, hi];
  }

  function _fxbMul21bit_t1(D, val, top) {
    val &= 0x1ffff;
    var b, c, r = 0;
    for(var i = 0; i <= top; i++) {
      //a = D[i];
      b = D[i] * val + r;
      c = b & 0xffffffff;
      D[i] = c + POSITIVIZE[+(c < 0)]
      r = (b / 0x100000000) |0;
    }
    return D;
  }

  function _fxbMul1e1p(B, p) {
  // multiply 10 and add with p. p must not negative.
  // used for translating decimal to buffer/hex
    var i, a, b, c, r = 0;
    var top = B.length -1;
    // multiplication
    for(i = 0; i <= top; i++) {
      b = B[i] * 10 + r;
      c = b & 0xffffffff;
      B[i] = c + POSITIVIZE[+(c < 0)]
      r = (b / 0x100000000) |0;
    }
    if(r)
      B[++top] = r;
    if (!p)
      return B;
    // now addition
    a = B[0] + p;
    r = (a >= 0x100000000)
    if (!r)
      B[0] = a;
    else {
      B[0] = a - 0x100000000;
      for (i = 1; i <= top; i++) {
        if (~B[i]) { // not all  bit set
          B[i]++;
          r = 0;
          break;
        }
        else // all bit set (-1 in signed int term)
          B[i] = 0;
      }
      if (r)
        B[i] = 1; // still carry? write over
    }
    return B;
  }

  function _fxbMul1e2(B, top) {
    var a, b, c, r = 0;
    for(var i = 0; i <= top; i++) {
      //a = B[i];
      b = B[i] * 100 + r;
      c = b & 0xffffffff;
      B[i] = c + POSITIVIZE[+(c < 0)]
      r = (b / 0x100000000) |0;
    }
    return B;
  }

function _i32x32(a, b) { // returns 64-bit
// arguments exceed 32-bits will be truncated!
  var bl = b & MASK16;
  var bh = b >>> 16;
  a &= MASK32; //sanitize
  a += (a < 0) * CAP32;
  var _abc = a * bl;
  var def_ = a * bh;

  var bc = _abc & MASK32;
  var f_ = (def_ & MASK16) * CAP16;

  var negx = (bc < 0) * CAP32;
  var bcf = bc + negx + f_;

  ovr = +(bcf >= CAP32);
  bcf &= MASK32;
  bcf += (bcf < 0) * CAP32;

  var _a = (_abc / CAP32)|0;
  var de = (def_ / CAP16)|0; // don't do shiftright, over 32bits value!
  de += (de < 0) * CAP32;    // turn out b1 can be signed!
  var ade =  _a + de + ovr;

  return {bits: 64, lo: bcf, hi: ade, cf: +ovr,
    sf: +(ade & CAP31 != 0), zf: +(ade | bcf == 0)};
}

function _i64x32(a, b) { // returns 128-bit
// recall:
//   -   =  _y1__:_y0__
//   q0  =  __:__:hi:lo   // MSB will always 0
//   q1  =  __:hi:lo:__   // MSB will always 0
//   q1  == __:__:hi:lo   -> Y actual representation of q1
  var q0 = _i32x32(A.lo, b);
  var q1 = _i32x32(A.hi, b);

  q0.hi += q1.lo;
  var ovr = +(q0.hi >= CAP32);
  q0.hi &= MASK32;
  q0.hi += (q0.hi < 0) * CAP32;

  q1.lo = q1.hi + ovr;
  q1.hi = 0;

  return {bits: 128, lo: q0, hi: q1, cf:0};
}

function _i64x64(A, B) { // returns 128-bit
// -   x3 x2 x1 x0
// -   -q1- | -q0-
// X = 00.d2.d1.d0  -> 128bits result of mul64x32 (1)
// Y = d5.d4.d3.00  -> 128bits result of mul64x32 (2)
//     00.d5.d4.d3  -> Y actual representation

  var X = _i64x32(A, B.lo);
  var T = _i64x32(A, B.hi);

  X.q0.hi += T.q0.lo
  var ovr = +(X.q0.hi >= CAP32)
  X.q0.hi &= MASK32;
  X.q0.hi += ovr * CAP32;

  X.q1.lo += T.q0.hi + ovr;
  var ovr = +(X.q1.lo >= CAP32)
  X.q1.lo &= MASK32;
  X.q1.lo += ovr * CAP32;

  X.q1.hi = T.q1.lo + ovr;

  return X;
}

var i64muls = function(A, b) { // returns 128-bit
  var X = new Intx(128);
  var Y = _i64x32(A, b);
  return X.copyfrom(Y);
};

var i64muld = function(A, B) { // returns 128-bit
  if (B.hi.zf) return i64muls(A, B.lo);
  else if (A.hi.zf) return i64muls(B, A.lo);
  var X = new Intx(128);
  var Y = _i64x64(A, B);
  return X.copyfrom(Y);
};

Int64.prototype.muls = function(A, b) { return i64muls(this, b); };
Int64.prototype.muld = function(A, B) { return i64muld(this, B); };

/*
There are 2 types of multiplication, both will be expected to produce
the final result twice as the largest of the original size.
- muls, multiply against half bits wide (or less)
  (example: i128 * i64, or i64 * i32)
- muld, multiply operands of the same size
  (example: i128 * i28, or i64 * i64)

for muls, we split the mutiplicand, the working space need not to
be larger than the original largest size. since we split them into
2 parts, and both will never exceed the original largest size.
example:
  a.b x p
  split1: 0.a x p
  split2: 0.b x p
  result (estimating full occupied bits):
    b x p -> 0.0:b.p  //
    a x p -> 0.a:p.0  // shifted left, original place is: 0.0.a.p
    ------------------
             0.b:(a+p).0

and conversely, we split the multiplier for muld operation, the
working place must be twice as big as the original.
example:
  a.b x p.q
  split1: a.b x p
  split2: c.d x q
  result (estimating full occupied bits):
    ab x p -> 0 . a : b . p  //
    cd x q -> c . d : q . 0  // shifted left, origin = 0.c.d.q
    --------------------------
             c.(a+b):(b+q).p
*/

var intxMuls = function(A, b) {
// mul by HALF of bits wide // creates new object
  var X = A.lo.muld(b);
  var Y = A.hi.muld(b);
  X.lo.hi.add(Y.lo.lo);
  var ovr = X.lo.hi.cf;
  Y.lo.hi.inc(ovr);
  //X.hi.lo.copyfrom(Y.lo.hi);
  X.hi.lo = Y.lo.hi; // is it safe?
  return X;
};

var intxMuld = function(A, B) {
// mul by FULL bits wide // creates new object
  if (A.bits != B.bits) return A;
  if (B.hi.isZero()) return intxMuls(A, B.lo);
  else if (A.hi.isZero()) return intxMuls(B, A.lo);
  var X = A.extend();
  var Y = A.extend();

  X.muls(B.lo);
  Y.muls(B.hi);

  Y.hi.hi = Y.hi.lo; // are these safe?
  Y.hi.lo = Y.lo.hi; // are these safe?
  Y.lo.hi = Y.lo.lo; // are these safe?
  Y.lo.lo = 0;
  return X.add(Y);
};

Intx.prototype.muls = function(b) { return intxMuls(this, b); };
Intx.prototype.muld = function(B) { return intxMuld(this, B); };

var i64svadd = function(A, B) {
  //if (A.bits != B.bits) return A;
  var d0 = A.lo + B.lo;
  var ovr = +(d0 >= CAP32);
  d0 &= MASK32;
  var neg = +(d1 < 0);
  d0 += neg * CAP32;
  var d1 = A.hi + B.hi + ovr;
  ovr = +(d1 >= CAP32);
  d1 &= MASK32;
  neg = +(d1 < 0);
  d1 += neg * CAP32;
  var zero = +(d0 | d1 == 0);
  return {bits: B.bits, lo: d0, hi: d1, sf: neg, cf: ovr, zf: zero};
};

var i64svsub = function(A, B) {
  //if (A.bits != B.bits) return A;
  var d0 = A.lo - B.lo;
  var ovr = +(d0 < 0);
  d0 += ovr * CAP32;
  var d1 = A.hi - B.hi - ovr;
  ovr = +(d1 < 0);
  d1 += ovr * CAP32;
  var zero = +(d0 | d1 == 0);
  return {bits: 64, lo: d0, hi: d1, sf: ovr, cf: ovr, zf: zero};
};

Int64.prototype.svadd = function(A, B) { return this.copyfrom(i64svadd(this, B)); }
Int64.prototype.svsub = function(A, B) { return this.copyfrom(i64svsub(this, B)); }

var i64add = function(p, q) { // (p + q) save to p
  //if (p.bits != q.bits) return A;
  var d0 = p.lo + q.lo;
  var ovr = +(d0 >= CAP32);
  d0 &= MASK32;
  var neg = +(d1 < 0);
  d0 += neg * CAP32;
  var d1 = p.hi + q.hi + ovr;
  ovr = +(d1 >= CAP32);
  d1 &= MASK32;
  neg = +(d1 < 0);
  d1 += neg * CAP32;
  var zero = +(d0 == 0 && d1 == 0);
  p.lo = d0; p.hi = d1; p.cf = ovr; p.sf = neg; p.zf = zero;
  return p;
};

var i64sub = function(p, q) { // (p - q) save to p
  //if (p.bits != q.bits) return A;
  var d0 = p.lo - q.lo;
  var ovr = +(d0 < 0);
  d0 += ovr * CAP32;
  var d1 = p.hi - q.hi - ovr;
  ovr = +(d1 < 0);
  d1 += ovr * CAP32;
  var zero = +(d0 == 0 && d1 == 0);
  p.lo = d0; p.hi = d1; p.cf = ovr; p.sf = neg; p.zf = zero;
  return p;
};

Int64.prototype.add = function(q) { return i64add(this, q); }
Int64.prototype.sub = function(q) { return i64sub(this, q); }

var intxAdd = function(X, Y) { // X + Y, result in X;
  X.lo.add(Y.lo);
  var ovr = +X.lo.cf;
  X.hi.add(Y.hi);
  X.cf = X.hi.cf
  X.hi.inc(ovr);
  X.cf = +(X.cf || X.hi.cf);
};

var intxSub = function(X, Y) { // X - Y, result in X;
  X.lo.sub(Y.lo);
  var ovr = +X.lo.cf;
  X.hi.sub(Y.hi);
  X.cf = X.hi.cf
  X.hi.dec(ovr);
  X.cf = +(X.cf || X.hi.cf);
};

Intx.prototype.add = function(Y) { return intxAdd(this, Y); };
Intx.prototype.sub = function(Y) { return intxSub(this, Y); };

var _fxbInc1 = function(B, top) {
  var i = 0;
  while (i <= top) {
    if (!~B[i]) B[i] = 0;
    else {
      B[i]++;
      break;
    }
    i++;
  }
  return B;
};

var _fxbDec1 = function(B, top) {
  var i = 0;
  while (i <= top) {
    if (!B[i]) B[i] = 0xffffffff;
    else {
      B[i]--;
      break;
    }
    i++;
  }
  return B;
};

var _fxbInc = function(val, B, top) {
if (val < 1)
  if (!val) return B;
  else return _fxbDec(-val, B, top);
  var a, i = 1, ovr = 0;
  a = B[0] + val;
  if (a < 0x100000000)
    B[0] = a;
  else
    while (i <= top) {
      if (!~B[i]) B[i] = 0;
      else {
        B[i]++;
        break;
      }
      i++;
    }
  return B;
};

var _fxbDec = function(val, B, top) {
  if (val < 1)
    if (!val) return B;
    else return _fxbInc(-val, B, top);
  var a, i = 1;
  a = B[0] - val;
  if (a >= 0)
    B[0] = a;
  else 
  while (i <= top) {
    if (!B[i]) B[i] = 0xffffffff;
    else {
      B[i]--;
      break;
    }
    i++;
  }
  return B;
};

var i64inc = function(val, q) {
  if (val <= 1) {
    if (val < 0) return i64dec(-val, q);
    if (val == 1) return i64inc1(q);
    if (!val) return q;
  }
  val &= MASK32;
  val+= POSITIVIZE[+(val < 0)];
  q.lo += val;
  var ovr = +(q.lo >= CAP32);
  q.lo &= MASK32;
  var neg = +(q.d0 < 0);
  q.lo += POSITIVIZE[+neg];
  q.zf = +(q.hi | q.lo == 0)
  if (!ovr) return q;
  ovr = +(q.hi == MASK32);
  q.hi = ovr ? 0 : q.hi++;
  q.cf = ovr; // in the real asm86, inc never carried over
  q.sf = +(q.hi & CAP31 != 0);
  q.zf = +(q.hi | q.lo == 0)
  return q;
};

var i64dec = function(val, q) {
  if (val <= 1) {
    if (val < 0) return i64inc(-val, q);
    if (val == 1) return i64dec1(q);
    if (!val) return q;
  }
  val &= MASK32;
  val += POSITIVIZE[+(val < 0)];
  q.lo -= val;
  q.zf = +(q.hi | q.lo == 0)
  if (q.lo >= 0) return q;
  q.lo += CAP32;
  ovr = +(q.hi == 0);
  q.hi = ovr ? MASK32 : q.hi--;
  q.cf = ovr; // in the real asm86, inc never carried over
  q.sf = +(q.hi & CAP31 != 0);
  q.zf = +(q.hi | q.lo == 0)
  return q;
};

var i64inc1 = function(q) {
  var ovr = +(q.lo == MASK32);
  if (ovr) q.lo = 0; else q.lo++;
  q.zf = +(q.hi | q.lo == 0);
  if (!ovr) return q;
  var ovr = +(q.hi == MASK32);
  if (ovr) q.hi = 0; else q.hi++;
  q.cf = ovr;
  q.sf = +(q.hi & CAP31 != 0);
  q.zf = +(q.hi | q.lo == 0);
  return q;
};

var i64dec1 = function(q) {
  var ovr = +(q.lo == 0);
  if (ovr) q.lo = MASK32; else q.lo--;
  q.zf = +(q.hi | q.lo == 0);
  if (!ovr) return q;
  var ovr = +(q.hi == 0);
  if (ovr) q.hi = MASK32; else q.hi--;
  q.cf = ovr;
  q.sf = +(q.hi & CAP31 != 0);
  q.zf = +(q.hi | q.lo == 0);
  return q;
};

Int64.prototype.inc = function(val) { return i64inc(val, this); };
Int64.prototype.dec = function(val) { return i64dec(val, this); };
Int64.prototype.shl = function(val) { return i64shl(val, this); };
Int64.prototype.shr = function(val) { return i64shr(val, this); };

Int64.prototype.inc1 = function() { return i64inc1(this); };
Int64.prototype.dec1 = function() { return i64dec1(this); };
Int64.prototype.shl1 = function() { return i64shl1(this); };
Int64.prototype.shr1 = function() { return i64shr1(this); };

var i64shl1 = function(q) {
  q.cf = +(q.hi & MASK32 < 0);
  q.hi += q.hi;
  if (q.cf) q.hi = 0;
  q.sf = +(q.hi & MASK32 < 0);
  q.hi += +(q.lo & MASK32 < 0);
  q.lo <<= 1;
  q.lo += POSITIVIZE[+(q.lo < 0)];
  q.zf = +(q.hi | q.lo == 0)
  return q;
};

var i64shr1 = function(q) {
  q.cf = q.lo & 1;
  q.lo >>>= 1;
  if (q.hi & 1) q.lo += CAP31;
  q.hi >>>= 1;
  q.sf = 0;
  q.zf = +(q.hi | q.lo == 0)
  return q;
};

var i64shl = function(val, q) {
  if (val <= 1) {
    if (val < 0) return i64shr(-val, q);
    if (!val) return q;
    if (val == 1) return i64shl1(q);
  }
  if (val > 63) return i64Clear(q);
  if (val < 32) {
    q.hi <<= val;
    q.hi |= q.lo >>> (32 - val);
    q.lo <= val;
    q.lo += POSITIVIZE[+(q.lo < 0)];
  }
  else {
    val &= 31;
    q.hi = q.lo << val;
    q.lo = 0;
  }
  q.hi += POSITIVIZE[+(q.hi < 0)];
  q.sf = (q.hi & CAP31 != 0);
  q.zf = +(q.hi | q.lo == 0)
  return q;
};

var i64shr = function(val, q) {
  if (val <= 1) {
    if (val < 0) return i64shl(-val, q);
    if (!val) return q;
    if (val == 1) return i64shr1(q);
  }
  if (val > 63) return i64Clear(q);
  if (val < 32) {
    q.lo >>>= val;
    q.lo |= q.hi << (32 - val);
    q.hi >>>= val;
    q.lo += POSITIVIZE[+(q.lo < 0)];
  }
  else {
    val &= 31;
    q.lo = q.hi >>> val;
    q.hi = 0;
  }
  q.sf = 0;
  q.zf = +(q.hi | q.lo == 0)
  return q;
};

var intxShl1 = function(X) {
  X.cf = X.isNeg();
  var ovr = X.lo.isNeg();
  X.lo.shl1();
  X.hi.shl1();
  if (ovr) X.hi.setOdd();
  return X;
};

var intxShr1 = function(X) {
  X.cf = X.lo.isOdd();
  var ovr = X.hi.isOdd();
  X.lo.shl1();
  X.hi.shl1();
  if (ovr) X.lo.setSign();
  return X;
};

var intxShl = function(val, X) {
  var Bx = X.store();
  _fxbShl(val, Bx.n);
  _fxSetf(Bx);
  X.restore();
  return X;
};

var intxShr = function(val, X) {
  var Bx = X.store();
  _fxbShr(val, Bx.n);
  _fxSetf(Bx);
  X.restore();
  return X;
};

Intx.prototype.inc = function(val) { return intxInc(val, this); };
Intx.prototype.dec = function(val) { return intxDec(val, this); };
Intx.prototype.shl = function(val) { return intxShl(val, this); };
Intx.prototype.shr = function(val) { return intxShr(val, this); };

Intx.prototype.inc1 = function() { return intxInc1(this); };
Intx.prototype.dec1 = function() { return intxDec1(this); };
Intx.prototype.shl1 = function() { return intxShl1(this); };
Intx.prototype.shr1 = function() { return intxShr1(this); };


// ************************************************************
// var _fxEnum = function(X, i, j) {
//   if (typeof i === 'undefined') {
//     i = 0;
//     j = X.bits >>> 6;
//   }
//   if (X.bits > 64) {
//     var mid = (i + j) >>> 1;
//     _fxEnum(X.lo, i, mid);
//     _fxxEnum(X.hi, mid, j);
//   }
//   else {
//      X.lo.depth = i;
//      X.hi.depth = j;
//   }
// }

var _fxStore = function(Bx, i, j, X) { // save items to BufX{}
  if (X.bits > 64) {
    var mid = (j + i) >>> 1;
    _fxStore(Bx, i, mid, X.lo);
    _fxStore(Bx, mid, j, X.hi);
  }
  else { //_fx64GetItems(Bx, i, X); // no sign check
    Bx.n[i] = X.lo;
    Bx.n[i + 1] = X.hi;
    Bx.f[i] = X.sf;
    Bx.f[i + 1] = X.zf;
  }
  return Bx;
};

var _fxRestore = function(Bx, i, j, X) { // load BufX{} to items
  if (X.bits > 64) {
    var mid = (j + i) >>> 1;
    _fxRestore(Bx, i, mid, X.lo);
    _fxRestore(Bx, mid, j, X.hi);
  }
  else { //_fx64Assign(Bx, i, X); // no sign check
    X.lo = Bx.n[i];
    X.hi = Bx.n[i + 1];
    X.sf = Bx.f[i];
    X.zf = Bx.f[i + 1];
    X.cf = 0;
  }
  return Bx;
};

function _fxSanitize(Bx) {
  for (var i = 0; i < Bx.n.length; i += 2) {
    var d = Bx.n[i], e = Bx.n[i + 1];
    e &= MASK32;
    d &= MASK32;
    var N = e < 0, Z = d == 0 && e == 0;
    BX.f[i] = +N;
    Bx.f[i + 1] = +Z;
    if (Z) continue;
    Bx.n[i + 1] = e + POSITIVIZE[+N];
    Bx.n[i] = d + POSITIVIZE[+(d < 0)];
  }
};

function _fxPositivize(B) {
  var d = 0;
  for (var i = 0; i < B.length; i++) {
    d = B[i] & MASK32;
    B[i] = d + POSITIVIZE[+(d < 0)];
  }
};

function _fxSetf(Bx) {
  for (var i = 0; i < Bx.n.length; i += 2) {
    var d = Bx.n[i], e = Bx.n[i + 1] & MASK32;
    BX.f[i] = +(e < 0);
    BX.f[i + 1] = +(d == 0 && e == 0);
  }
};

// function _fxbShl1_OLD(B) {
//   var Len = B.length - 1, ovr = (B[len] & 0x80000000) != 0;
//   for (var i = Len; i < 1; i--)
//     B[i] = (B[i] << 1) | +((B[i - 1] & 0x80000000) != 0);
//   B[0] <<= 1;
//   return +ovr;
// }
//
// function _fxbShl1_p_OLD(B) { // SHL1 with fixed signed values
//   var i = 0, d = 0;
//   var ovr = (B[B.length - 1] & 0x80000000) != 0;
//   for (i = B.length - 1; i < 1; i--) {
//     d = B[i] << 1 | ((B[i - 1] & 0x80000000) != 0);
//     B[i] = d + POSITIVIZE[+(d < 0)];
//   }
//   d = B[i] << 1;
//   B[i] = d + POSITIVIZE[+(d < 0)];
//   return +ovr;
// }

/**********************************************************************
  note: all _fxb* routines expect at least a pair of dwords [lo, hi];
**********************************************************************/

function _fxbShl1(B, top) { // refactored
  var Len1 = B.length - 1;
  //top = B.length - 1;
  var d1 = B[top], d0 = B[top - 1];
  // yet another fukhin ztupig eediotz JS precedence
  // it's hard to not slip over this js idiosynchmoron
  // how on earth do you expect that "!=" got higher precedence than "&"
  var i, ovr = +(d1 & 0x80000000) != 0;
  if (ovr && Len1 > top) { B[top + 1] = 1; ovr = 0; }
  for (i = top; i > 1; i--) {
    B[i] = d1 << 1 | +((d0 & 0x80000000) != 0);
    d1 = d0;
    d0 = B[i - 2];
  }
  B[1] = d1 << 1 | +((d0 & 0x80000000) != 0);
  B[0] = d0 << 1;
  return ovr;
}

function _fxbShl12(B0, B1, top0, top1) { //
//  var Len0 = top0| B0.length - 1
//  var Len1 = top1| B1.length - 1;
//  var Len0 = B0.length - 1, Len1 = B1.length - 1;
//  var d1 = B1[Len1], d0 = B1[Len1 - 1];
//  var i, ovr = +((d0 & 0x80000000) != 0);
//  for (i = Len1; i > 2; i--) {
//    B1[i] = d1 << 1 | +((d0 & 0x80000000) != 0);
//    d1 = d0;
//    d0 = B1[i - 2];
//  }
//  B1[1] = d1 << 1 | +((d0 & 0x80000000) != 0);
//  B1[0] = d0 << 1;
//
//  var d1 = B0[Len0], d0 = B0[Len0 - 1];
//  B1[0] |= +((d1 & 0x80000000) != 0);
//
//  for (i = Len0; i > 2; i--) {
//    B0[i] = d1 << 1 | +((d0 & 0x80000000) != 0);
//    d1 = d0;
//    d0 = B0[i - 2];
//  }
//  B1[1] = d1 << 1 | +((d0 & 0x80000000) != 0);
//  B1[0] = d0 << 1;
//
//  return ovr;

// use easy trip instead to minimize typing-errors:
  var ovr0 = _fxbShl1(B0, top0);
  var ovr1 = _fxbShl1(B1, top1);
  B1[0] |= ovr0;
  return ovr1;
}

// function _fxbShr1(B) { // always returns positive dwords
//   var ODD2NEG = [0, 0x80000000], ovr = B[0] & 1;
//   for (var i = 0; i < B.length - 2; i++)
//     B[i] = (B[i] >>> 1) + ODD2NEG[B[i + 1] & 1];
//   B[B.length - 1] >>>= 1;
//   return ovr;
// }
//

function _fxbShr1(B, top) { // always returns positive dwords
  var ODD2NEG = [0, 0x80000000], ovr = B[0] & 1;
  var d0 = B[0], d1 = B[1], odd = d1 & 1;
  for (var i = 0; i < top - 1; i++) {
    B[i] = (d0 >>> 1) + ODD2NEG[d1 & 1];
    d0 = d1;
    d1 = B[i + 2];
  }
  B[top - 1] = (d0 >>> 1) + ODD2NEG[d1 & 1];
  B[top] >>>= 1;
  return ovr;
}

function _fxbShr12(B0, B1, top0, top1) {
  // shiftright 2 buffers at once
  var ODD2NEG = [0, 0x80000000];
  var i, d0 = B0[0], d1 = B0[1], ovr = d0 & 1;
  for (i = 0; i < top0 - 1; i++) {
    B0[i] = (d0 >>> 1) + ODD2NEG[d1 & 1];
    d0 = d1;
    d1 = B0[i + 2];
  }
  B0[top0 - 1] = (d0 >>> 1) + ODD2NEG[d1 & 1];
  d0 = B1[0], d1 = B1[1];
  B0[top0] = (B0[top0]>>> 1) + ODD2NEG[d0 & 1];
  for (i = 0; i < top1 - 1; i++) {
    B1[i] = (d0 >>> 1) + ODD2NEG[d1 & 1];
    d0 = d1;
    d1 = B0[i + 2];
  }
  B1[top1 - 1] = (d0 >>> 1) + ODD2NEG[d1 & 1];
  B0[top0] >>>= 1;
  return ovr;
}

// SHLL family routines, here top must always equal with length -1
// i.e. shiftleft carry over will always be truncated
// some on-the-fly operations might need this restriction
function _fxbShl1_p(B, top) { // SHL1 with fixed signed values
  //var Len1 = B.length - 1;
  //top = _bsra(B);
  // yet another fukhin ztupig eediods JS precedence
  // it's hard to not slip over this js idiosynchmoron
  // how on earth do you expect that "!=" got higher precedence than "&"
  var d1 = B[top], d0 = B[top - 1], neg = (d0 & 0x80000000) != 0;
  var i, ovr = (d1 & 0x80000000) != 0, e = (d1 << 1) | +neg;
  //if (+ovr && Len1 > top) { B[top + 1] = 1; ovr = 0; }
  for (var i = top; i > 1; i--) {
    B[i] = e + POSITIVIZE[+(e < 0)];
    d1 = d0;
    d0 = B[i - 2];
    neg = (d0 & 0x80000000) != 0;
    e = (d1 << 1) | (+neg);
  }
  B[1] = e + POSITIVIZE[+(e < 0)];
  e = d0 << 1;
  B[0] = e + POSITIVIZE[+(e < 0)];
  return +ovr;
}

// SHLL family routines, here top must always equal with length -1
// i.e. shiftleft carry over will always be truncated
// some on-the-fly operations might need this restriction
// to differentiate from regular shl/shr routines, SHLL family first
// argument will be Buffer(B), instead of shift-value (val)
// function _fxbShll2p(B, top) { // SHL2 with fixed signed values
//  //var Len1 = B.length - 1;
//   var d1 = B[top], d0 = B[top - 1];
//   var i, e;
//   if (Len1 > top) { B[top + 1] = d1 >>> 30; }
//   for (var i = top; i > 1; i--) {
//     e = (d1 << 2) | (d0 >>> 30);
//     B[i] = e + POSITIVIZE[+(e < 0)];
//     d1 = d0;
//     d0 = B[i - 2];
//   }
//   e = (d1 << 2) | (d0 >>> 30);
//   B[1] = e + POSITIVIZE[+(e < 0)];
//   e = d0 << 2;
//   B[0] = e + POSITIVIZE[+(e < 0)];
//   return B;
// }
//
// function _fxbShll3p(B, top) { // SHL3 with fixed signed values
//  //var Len1 = B.length - 1;
//   var d1 = B[top], d0 = B[top - 1];
//   var i, e
//   if (Len1 > top) { B[top + 1] = d1 >>> 29; }
//   for (var i = top; i > 1; i--) {
//     e = (d1 << 3) | (d0 >>> 29);
//     B[i] = e + POSITIVIZE[+(e < 0)];
//     d1 = d0;
//     d0 = B[i - 2];
//   }
//   e = (d1 << 3) | (d0 >>> 29);
//   B[1] = e + POSITIVIZE[+(e < 0)];
//   e = d0 << 3;
//   B[0] = e + POSITIVIZE[+(e < 0)];
//   return B;
// }
//
// function _fxbShll4p(B, top) { // SHL4 with fixed signed values
//  //var Len1 = B.length - 1;
//   var d1 = B[top], d0 = B[top - 1];
//   var i, e;
//   //if (Len1 > top) { B[top + 1] = d1 >>> 28; }
//   for (var i = top; i > 1; i--) {
//     e = (d1 << 4) | (d0 >>> 28);
//     B[i] = e + POSITIVIZE[+(e < 0)];
//     d1 = d0;
//     d0 = B[i - 2];
//   }
//   e = (d1 << 4) | (d0 >>> 28);
//   B[1] = e + POSITIVIZE[+(e < 0)];
//   e = d0 << 4;
//   B[0] = e + POSITIVIZE[+(e < 0)];
//   return B;
// }

// SHLL family routines, here top must always equal with length -1
// i.e. shiftleft carry over will always be truncated
// some on-the-fly operations might need this restriction
// to differentiate from regular shl/shr routines, SHLL family first
// argument will be Buffer(B), instead of shift-value (val)
//function _fxbShll(B, shift, top, Len) {
function _fxbShll(B, shift, top, Len) {
  Len = Len || 0
  //if (!Len) Len = B.length;
  var i, rev = 32 - shift;
  var d1 = B[top], d0 = B[top - 1],
    e = (d1 << shift) | (d0 >>> rev);
  if (Len - 1 > top) { B[top + 1] = d1 >>> rev; }
  for (var i = top; i > 1; i--) {
    B[i] = e + POSITIVIZE[+(e < 0)];
    d1 = d0;
    d0 = B[i - 2];
    e = (d1 << shift) | (d0 >>> rev);
  }
  B[1] = e + POSITIVIZE[+(e < 0)];
  e = d0 << shift;
  B[0] = e + POSITIVIZE[+(e < 0)];
  return B;
}

function _fxbShrr(B, shift, top) {
  var i, rev = 32 - shift;
  var d0 = B[0], d1 = B[1]
  var d0s = d0 >>> shift, d1r = d1 << rev, d0x = d0s | d1r;
  // intentionally left the last shift to simplify calculation
  for (i = 0; i < top - 1; i++) { // note: do NOT change the (k-1)
    B[i] = d0x + POSITIVIZE[+(d0x < 0)]; // JS special, make it positive
    d0 = d1;
    d1 = B[i + 2];
    d0s = d0 >>> shift;
    d1r = d1 << rev;
    d0x = d0s | d1r;
  }
  B[top - 1] = d0x + POSITIVIZE[+(d0x < 0)];
  B[top] >>>= shift;
  return B;
}


function _fxbShr1_p(B, top) {  return _fxbShr1(B, top); } // already fix

function _fxbShl12_p(B0, B1, top0, top1) { // SHL12 with fixed signed values
  var ovr0 = _fxbShl1_p(B0, top0);
  var ovr1 = _fxbShl1_p(B1, top1);
  B1[0] += +ovr0;
  return +ovr1;
}

function _fxbShr12_p(B0, B1) { // SHR12 with fixed signed values
  var ovr0 = _fxbShr1_p(B0);
  var ovr1 = _fxbShr1_p(B1);
  B1[0] |= +ovr;
  return +ovr0;
}

function _fxbSub(A, B, top1, top2, lenA) {
  // no val check, MUST be all positive. length.A >= length.B
  //top1 = _bsra(A); // most significant dword A
  //top2 = top2 | _bsra(B); // most significant dword B
  //len1 = len1 | A.length;
  // bot1 = bot1 | 0;
  // bot2 = bot2 | 0;
  var a, b, i, ovr = 0;
  // proceed normally until substractor exhausted
  //if (top1<top2) { for (i=top1+1; i<=top2; i++) A[i]=0; top1=top2; } // CRAPS!
  while (top1 < top2) A[++top1] = 0;
  for (i = 0; i <= top2; i++) {
    a = A[i] - B[i] - ovr;
    ovr = +(a < 0)
    A[i] = a + POSITIVIZE[ovr]
  }
  if (!ovr) return 0; // no worry, go back
  if (top1 == top2) { // at the end of conversation? top1 always >= top2
    if (i < lenA)  // do not initialize loop if it is not necessary
      for (i = i; i < lenA; i++)
         A[i] = MASK32; // extend sign
    ovr = 1; // always returns carry
  }
  else { // (top1 > top2) there's more than substractor
    while (a[i] == 0 && i++ < top1)
      A[i - 1] = MASK32; // extend sign resulted from zero minus (carry)
    //ovr = (i >= lenA)
    A[i]-= 1; // decrease the first non-zero
    ovr = 0; // always returns no-carry
  }
  return ovr; // tired of returning objects, we return carry flag now.
}

var _fxbAddShift = function(B, top) {
//AddShift([1,2,3,4,5,6,7,8],5);
  var A = B.slice(0);
  A.unshift(A[0]);
  var a = A[1], b= A[2], c = a+b, r = c >= 0x100000000;
  for (var i = 1; i < top; i++ ){
    A[i] = c - POSITIVIZE[+r];
    a = b;
    b = A[i + 2]
    c = a + b + r;
    r = c >= 0x100000000;
  }
  A[top] = c - POSITIVIZE[+r];
  top++;
  A[top] += r;
  return A;
};

function _fxbAdd(A, B, top1, top2) { // A + B, result svaed in A;
  // no val check, MUST be all positive
  // top1 = _bsra(A); // most significant dword A
  // top2 = _bsra(B); // most significant dword B
  var Len1 = A.length;
  var a, b, i, ovr = 0;
  // proceed normally until adder exhausted
  //if (top1 < top2) { for (i = top1 + 1; i <= top2; i++) A[i] = 0; top1 = top2; } // CRAPS!
  while (top1 < top2) A[++top1] = 0;
  for (i = 0; i <= top2; i++) {
	a = A[i] + B[i] + ovr;
    ovr = +(a >= 0x100000000)
    A[i] = a - POSITIVIZE[ovr]
  }
  if (!ovr) return 0; // don't care for the rest, go back
  if (i >= Len1) return 1;
  if (top1 == top2)  // top1 will NEVER be less than top2
    { A[i] = 1; ovr = 0;}
  else { // top1 > top2
    while (a[i] == 0xffffffff && i++ < top1)
      A[i - 1] = 0; // carry makes full bits become zero, and carry carried over
    ovr = +(i >= Len1) // still carry at the end?
    if (!ovr) A[i] += 1; //inc the first non all-bits-set
  }
  return +ovr; // tired of returning objects, we return carry flag now.
}

function _fxbCmp(A, B, top1, top2) {
// an over-optimized cmp
  //top1 = A.length -1
  //top2 = B.length -1
  if (top1 != top2) {
    if (top1 > top2) return +1;
    if (top2 < top2) return -1;
  }
  var i = top1;
  while (A[i] == B[i] && i) i--;
  if (A[i] > B[i]) return +1;
  if (A[i] < B[i]) return -1;
  return 0;
}

function _fxbShl(val, B, top) { // signed values positivized
var Len = B.length;
//assert(typeof Len === 'undefined')
// SHL needs length information to carryover or truncate?
//  if (typeof Len == 'undefined') {
//    Len = B.length;
//    alert('length undefined!;');
//  }
  // top may be zeroes
  function singleout() {
    var e = B[0] << val;
    B[0] = e + POSITIVIZE[+(e < 0)];
    return B;
  }
  if (val <= 1) {
    if (val < 0) return _fxbShr(-val, B, top);
    if (!val) return B;
    if (val == 1) return _fxbShl1_p(B, top);
  }
  if (top == 0) return singleout();
  var lshifts = Len << 5
  if (val >= lshifts) {  // array length * 32
    // if bitshift equal/more than bitswide then clear the array
    for (var i = 0; i <= top; i ++) B[i] = 0; return B;
  }
  var c = val >>> 5; // t = how many elements will be cleared
  var i = 0, k = c; // inititalize k at the first shiftable element
  if (c) {
    // move dwords up
    for (i = top; i >= c; i--) B[i] = B[i - c];
    // and clear the remain, note that k value is significant.
    for (i = 0; i < c; i++) B[i] = 0;
  }
  var shift = val & 31; // get how much actual shift on 32-bit wide
  if (shift) {
    var rev = 32 - shift; // shiftright, get Most-S-bits from Least-S-dword
    var i, d0 = B[top - 1], d1 = B[top],
      d1a = d1 << shift, d0b = d0 >>> rev, e = d1a | d0b;
    if (Len > top + 1) B[top + 1] = d1 >>> rev;
    // intentionally left the last shift to simplify calculation
    for (i = top; i > k + 1; i--) { // note: do NOT change the (k + 1)
      B[i] = e + POSITIVIZE[+(e < 0)];
      d1 = d0;
      d0 = B[i - 2];
      d1a = d1 << shift;
      d0b = d0 >>> rev;
      e = d1a | d0b;
    }
    B[k + 1] = e + POSITIVIZE[+(e < 0)];
    e = d0 << shift;
    B[k] = e + POSITIVIZE[+(e < 0)];
  }
  return B;
}

function _fxbShr(val, B, top) { // signed values positivized
  //top = _bsra(B);
  if (val <= 1) {
    if (val < 0) return _fxbShl(-val, B, top, top+1); //note..
      //.. SHL needs length information, this is the best that we have
    if (!val) return B;
    if (val == 1) return _fxbShr1_p(B, top);
  }
  if (top == 0) { B[0] >>>= val; return B; }
  var rshifts = (top + 1) << 5;
  if (val >= rshifts) { // array length * 32
    // if bitshift equal/more than bitswide then clear the array
    for (var i = 0; i <= top; i++) B[i] = 0; return B;
  }
  var c = val >>> 5; // t = how many elements will be cleared
  var i = 0, k = top - c;
  if (c) {
    for (i = 0; i < c; i++) B[i] = B[i + c]; // move dwords down
    for (i = k + 1; i <= top; i++) B[i] = 0; // and clear the remain
    if (k == 0) { B[0] >>>= val; return B; }
  }
  var shift = val & 31; // get how much actual shift will take place
  if (shift) {
    var rev = 32 - shift; // reverse (shiftleft), get LSb from MSd
    var d0 = B[0], d1 = B[1]
    var d0s = d0 >>> shift, d1r = d1 << rev, d0x = d0s | d1r;
    // intentionally left the last shift to simplify calculation
    for (i = 0; i < k - 1; i++) { // note: do NOT change the (k-1)
      B[i] = d0x + POSITIVIZE[+(d0x < 0)]; // JS special, make it positive
      d0 = d1;
      d1 = B[i + 2];
      d0s = d0 >>> shift;
      d1r = d1 << rev;
      d0x = d0s | d1r;
    }
    B[k - 1] = d0x + POSITIVIZE[+(d0x < 0)];
    B[k] >>>= shift;
  }
  return B;
}

// *** SHL double buffer ********************************************//
function _fxbShl2bl(val, B0, B1, top0, top1) { // signed values positivized
  //top0 = _bsra(B0);
  //top1 = _bsra(B1);
  if (val <= 1) {
    if (val < 0) return _fxbShr2br(-val, B0, B1, top0, top1);
    if (val == 1) return _fxbShl12_p(B0, B1, top0, top1);
    if (!val) return 0;
  }
  var r = 0, /* len0 = B0.length, */ p0 = len0 << 5;
  if (val < p) {
    r = B0[top0] >>> (32 - (val & 31));
    _fxbShl(val, B0, top0);
  }
  else  {
    val &= p - 1;
    for (var i = 0; i <= top0; i++)
      B0[i] = 0;
  }
  _fxbShl(val, B1, top1);
  if (r) {
    r |= B[0];
    r += POSITIVIZE[+(r < 0)]
    B1[0] = r;
  }
  return B1;
}

// *** double buffer SHR ********************************************//
function _fxbShr2br(val, B0, B1, top0, top1) { // signed values positivized
  //top0 = _bsra(B0);
  //top1 = _bsra(B1);
  if (val <= 1) {
    if (val < 0) return _fxbShl2bl(-val, B0, B1, top0, top1);
    if (val == 1) return _fxbShr12_p(B0, B1, top0, top1);
    if (!val) return 0;
  }
  var r = 0, /* len1 = B1.length, */ p1 = len1 << 5;
  if (val < p) {
    r = B1[0] << (32 - (val & 31));
    _fxbShr(val, B1);
  }
  else  {
    val &= p - 1;
    for (var i = 0; i <= top1; i++)
      B1[i] = 0;
  }
  _fxbShr(val, B0);
  if (r) {
    r |= B0[top0];
    r += POSITIVIZE[+(r < 0)]
    B0[top0] = r;
  }
  return B0;
}

// ************************************************************
//
//  function _bsr(n, calc) {
//    if (n < 0 || n > 0x80000000) return calc ? 0x80000000 : 31;
//    if (n < 2) return calc ? n : n - 1; // n = zero, will return -1
//    for(var r = 2, i = 2; i < 32; i++) {
//      r += r;
//      if (r > n)
//        return calc ? r / 2 : i - 1;
//    }
//    return calc ? 0x40000000 : 30 ;
//  }
//
// function  _bsr2(n, start) {
// // yet another over optimization
// // does not allow negative value!
// var i = 0, i12 = 11, i20 = 19;
// var a = [1,2,4,8,
//   0x10,0x20,0x40,0x80,
//   0x100,0x200,0x400,0x800,
//   0x1000,0x2000,0x4000,0x8000,
//   0x10000,0x20000,0x40000,0x80000,
//   0x100000,0x200000,0x400000,0x800000,
//   0x1000000,0x2000000,0x4000000,0x8000000,
//   0x10000000,0x20000000,0x40000000,0x80000000,
//   0x100000000];
//   // allow negative, sigh...
//   if (n < 0) n = (n | 0) + 0x100000000;
//   if (n < 3) return n - 1;
//   // another fuchin ztupix eediots JS precedence
//   // it's hard to not slip over this js idiosynchracy
//   // how on earth do you expect that "!=" got higher precedence than "&"
//   if ((n & 0x80000000) != 0) return 31;
//   if (n > 0x80000) while (++i20 < 32) if (n < a[i20]) return i20 - 1;
//   if (n > 0x800) while (++i12 < 32) if (n < a[i12]) return  i12 - 1;
//   while (++i < 32) if (n < a[i]) return  i - 1;
//   return -1; // too high, not an integer!
// }

var _f642e = new Float64Array(1);
function _bsr2(number, start) {
/*
  7654321076543210765432107654321076543210765432107654321076543210
         7       6       5       4       3       2       1
  3210987654321098765432109876543210987654321098765432109876543210
  6  6       5 5         4         3         2         1         0
  3----------2---------------------------------------------------0
  seeeeeeeeeeemmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
  exponent = 6:4-7, 7:0-6 = 11 bits
  exponent range =  0..2^11 = 0..2047 => -1022..1023
  exponent-bias: 1023 (or 2^10 - 1)
*/
  if (!number) return -1;
  _f642e[0] = number;
  n = ((_f642e.buffer[6] >>> 4) | ((_f642e.buffer[7] & 0x7f) << 4)) - 1023;
  if (start) return 1 << n;
  return n;
}


var i64DivMod = function (p, q, opt) {
function pv(a) { return a + POSITIVIZE[+(a < 0)]; }
/*
   DI:SI:DX:AX _div_ CX:BX
   option 0: quotient in p, 1: remainder in p, 2: return struct div/mod
*/
  opt = opt | 0;
  var dx = pv(p.hi), ax = pv(p.lo);
  var cx = pv(q.hi), bx = pv(q.lo);

  // var ret = {q:[0,0], r:[0,0]};
  // p should be be >= q
  if (dx == cx && ax == bx) //return {q:[0, 1], r:[0, 0]};
    switch(opt) {
    case 0: p.hi = 0; p.lo = 1; return p;
    case 1: p.hi = 0; p.lo = 0; return p;
    case 2: return {q:[0, 1], r:[0, 0]};
  }
  if (dx < cx || (dx == cx && ax < bx)) //return {q:[0, 0], r:[bx, cx]};
    switch(opt) {
    case 0: p.hi = 0; p.lo = 0; return p;
    case 1: p.hi = bx; p.lo = cx; return p;
    case 2: return {q:[0, 0], r:[bx, cx]};
  }

  var di = 0, si = 0, k = 64;

  var bt1 = dx ? _bsr2(dx) + 32 : _bsr2(ax);
  var bt2 = cx ? _bsr2(cx) + 32 : _bsr2(bx);

  // difference means how many bits needed to be shifted
  var k = bt1 - bt2;

  if (k == 32) { // simple 32bits fold
    si = dx;
    dx = ax;
    ax = 0;
  }
  else {
    // NOTE: originally shifted already 64 bits here!
    di = dx; dx = 0;
    si = ax; ax = 0;

    // shift right to pass over divisor's highest bit
    // keep it modulo 32
    var k2 = k & 31;
    var reverse = 32 - k2;
    dx = si << reverse;
    si = si >>> k2 | di << reverse;
    di = di >>> k2;

    // adjust for difference wider than 32 bits
    if (k > 32) {
      ax = dx;
      dx = si;
      si = di;
      di = 0;
    }
  }
  {
    // check it first, might already be greater
    di += POSITIVIZE[+(di < 0)];
    si += POSITIVIZE[+(si < 0)];

    if (di > cx || (di == cx && si >= bx)) {
      si -= bx;
      di -= cx - (si < 0);
      ax |= 1;
    }
  }
  for (var i = SHIFT - k; i < SHIFT; i++) {
    di = di << 1 | +(di & CAP31 != 0);
    si = si << 1 | +(dx & CAP31 != 0);
    dx = dx << 1 | +(ax & CAP31 != 0);
    ax <<= 1;

    di += POSITIVIZE[+(di < 0)];
    si += POSITIVIZE[+(si < 0)];

    if (di > cx || (di == cx && si >= bx)) {
      si -= bx;
      di -= cx - (si < 0);
      ax |= 1;
    }
  }
  return {q:[si, di], r:[ax, dx]};
};

Int64.prototype.div = function(q) { return i64DivMod(this, q, 0); };
Int64.prototype.mod = function(q) { return i64DivMod(this, q, 1); };
Int64.prototype.divmod = function(q) { return i64DivMod(this, q, 2); };


function _bsra(A) { for (var i = A.length - 1; i >= 0; i--) if (A[i]) return i; }

//too much!
// var fxhexblocker = function (hexstr, blocksize) {
//   var zeroes = '00000000';
//   blocksize &= 0x7ffe;
//   if (blocksize > zeroes.length)
//     for (var i = block >>> 3; i > 0; i >>>= 1)
//      zeroes += zeroes;
//   return zeroes.substr(0, blocksize - ((hexstr.length - 1) % blocksize) + 1) + hexstr;
//
// var _fxhexblock8 = function(hexstr)
//   { return '00000000'.substr(0, 8 - ((hexstr.length - 1) & 7) + 1) + hexstr; }
// var _fxhexblock4 = function(hexstr)
//   { return '0000'.substr(0, 4 - ((hexstr.length - 1) & 3) + 1) + hexstr; }
// var _fxhexblock2 = function(hexstr)
//   { return (hexstr.length & 1 ? '0' : '') + hexstr; }

var _fxbtoHex = function (B, top) { // hexadecimals value of buffer;
  //len = len | B.length;
  //top = _bsra(B);
  var s = '';
  for (var i = 0; i <= top; i++) {
    var hex = (B[top - i]).toString(16);
    hex = '00000000'.substr(0, 8 - ((hex.length - 1) & 7) + 1) + hex;
    s += x;
  }
  return s;
};

//var i64Decimals = function(q) { return _fxbtoDecimals([q.lo, q.hi]); }
//var intxtoDecimals = function (X) { return _fxbtoDecimals(X.items); }

var _fxbMod10r = function (B, top, msb_3, SHIFT) { // returns decimals remainder;
  //top = _bsra(B); // we don't need length, just r
  msb_3 = msb | _bsr2(B[top]) - 3;
  SHIFT = SHIFT | ((top + 1) << 5);
  _fxbShr(msb_3, B, top);

  var r = B[top];
  if (r >= 10) a -= 10;
  for (var i = msb_3; i < SHIFT; i++) {
    var r = B[top];
    if (r >= 10) r -= 10;
  }
  return r;
};

var _fxbDivMod10r = function (B, top, msb_3, SHIFT) { // returns decimals remainder;
  //top = _bra(B); // we don't need length, just r
  //msb_3 = _bsr2(B[top]) - 3;
  SHIFT = SHIFT | ((top + 1) << 5);
  _fxbShr(msb_3, B, top);

  var r = B[top];
  if (r >= 10) a -= 10;
  for (var i = msb_3; i < SHIFT; i++) {
    var r = B[top];
    if (r >= 10) r -= 10;
  }
  return r;
};

/* ********************************************************************* */
// buffer/continuous bits to decimals conversion. extensively optimized.
/* ********************************************************************* */
var _fxbtoDec = function (B, top, method, strn, itr, _continued_) {
var rcx2r = [[34078,20971], [60293,47185], [20971,7864], [47185,34078], [7864,60293]];

  function xRCPX(n, r, m)
    {  m = m |0; return _fxMul16r(n, rcx2r[m][0], rcx2r[m][1], r); }

  function _fxbMulRcpx1st(B, top){
    var A = B.slice(0), Atop = top;
    var q = [0,0], k = top % 5, r = 0;
    for (var i = 0; i <= top; i++) {
      q = xRCPX(A[i], q[1], k);
      A[i] = q[0];
    }
    A[++Atop] = q[1];
  
    for (var j = 1; j <= top; j++) {
      var D = B.slice(0);
      if (--k < 0) k = 4;
      q[1] = 0;
      for (var i = 0; i <= top; i++) {
        q = xRCPX(D[i], q[1], k);
        D[i] = q[0];
      }
      D[top+1] = q[1];
      for (var i = 0; i < j; i++)
        D.unshift(0);
      A[++Atop] = 0;
      _fxbAdd(A, D, Atop, Atop);
    }
    k = top % 5;
    if (!k || k & 2) _fxbAdd(A, B, len-1, top);
    return A;
  }

  function _fxbMulRcpx2nd(B, top){
    function _unshiftn(A, n, top) {
      if (!n) return A;
      for (var i = top + n; i >= n; i--) A[i] = A[i - n];
      for (var i = 0; i < n; i++) A[i] = 0;
      return A;
    }

    function _fxDouble(A, top) {
      var a = 0, ovr = 0, ovs = 0;
      for (var i = 0; i<= top; i++) {
        a = A[i];
        ovs = +(a >= 0x80000000); 
        A[i] = a + a + ovr - POSITIVIZE[ovs];
        ovr = ovs;
      }
      // we usually do not write over the top
      if (ovr) A[top + 1] = 1;
    }

    var A = [[]], D = [], q = [0,0];
    var i = 0, j = 0, k = 0;

    var top1 = top + 1, r = top %5;
    var p = top < 4 ? top : 4;

    for (j = 0; j <= p; j++) {
      q[1] = 0;
      var D = B.slice(0);
      for (i = 0; i <= top; i++) {
        q = xRCPX(D[i], q[1], r);
        D[i] = q[0];
      }
      D[top1] = q[1];
      A[j] = D;
      if (--r < 0)
        r = 4;
    }

    k = (top / 5) |0;
      for (i = 1; i < k; i++) {
        r = i * 5;
        for (j = 0; j < 5; j++) {
          p = r + j;
          A[p] = A[j].slice(0);
          _unshiftn(A[p], p, top1);
        }
      }

    var m = k * 5;
    var r = top % 5;
      for (i = m; i <= m + r; i++) {
        if (k)
          A[i] = A[i % 5].slice(0);
        _unshiftn(A[i], i, top1);
      }

    if (k)
      for (i = 1; i < 5; i++)
        _unshiftn(A[i], i, top1);

    var top2 = top1 + top1 - 1;
    for(i = top1; i <= top2; i++)
      B[i] = 0;

    if (!r || r & 2)
      _fxDouble(B, top1);

    k = A.length;
    for(i = 0; i < k; i++)
      _fxbAdd(B, A[i], top2, A[i].length - 1);
    A = [];
    return B;
  }

  /*********** ENTRY POINT *******************/
  function __init() {
    var i = 0;
    B = B.slice(0); // release original B;
    top = B.length;
    while (top && B[--top] == 0) B.pop();
    if (top < 1) return top ? '' + B[0] : '0';

    if (top > 512) return 'sorry, too much'; // over 16Kbits

    // WARNING! 16Kbits need 38+ seconds in Chrome, 43 seconds in opera.
    // 16Kbits not tested in other browser. Opera a small bit below Chrome,
    // Firefox is twice slower, IE9 thrice to fifth times slower,
    // for 8192 bits: Chrome/Opera got it by 4+ seconds, firefox: 9+ seconds,
    // while IE9 by 25 seconds! // Computer: i5-3570K-underclocked 1.800Ghz

    //assert(false);
    method = method |0;
    method = 1;
    method = 0;
    method = 1;
    method = 0;
    method = 2;
    itr = 0;
    for (i = 0; i <= top; i++)
      if (B[i] < 0)
        B[i] = (B[i] | 0) + 0x100000000;
    if (typeof strn === 'undefined') {
      strn = [];
      for (i = 90; i < 100; i++) strn[i - 90] = '' + i;
      for (i = 0; i < 10; i++) strn[i + 10] = '0' + i;
      for (i = 10; i < 100; i++) strn[i + 10] = '' + i;
      for (i = 100; i < 110; i++) strn[i + 10] = '' + (i - 100);
    }

   }

  if (_continued_ != -99) __init();
  /*********** ENTRY POINT *******************/

  //if (itr > 1000) return '';
  if (top < 0) return '';
  var msb = _bsr2(B[top]);
  if (top < 2)
    if (top == 0) return '' + B[0];
    else
      // damn!!! can't we rely on js for this end, even 22 is TOO HIGH!
      if (msb < 22 - 1) return '' + (B[1] * CAP32 + B[0]);

  var C = [], D = B.slice(0);

  switch (method) {
    case 1: D = _fxbMulRcpx1st(B, top); break;
    case 2: _fxbMulRcpx2nd(D, top); break;
    default: return _fxbtoDecimals(B); break;
  }

  var len = D.length;
  D = D.slice(top + 1);

  _fxbShrr(D, 5, top);

  C = B.slice(0);
  B = D.slice(0);

  _fxbMul1e2(D, top);
  _fxbSub(C, D, top - 1, top, top + 1);

  var r = C[0]; // & 127;

  //release resources to system//not necessary, just nice//
  C = [];
  D = [];

  r |= 0;
  if (r < 0) _fxbDec1(B, top);
  else if (r >= 100) _fxbInc1(B, top);

  if (B[top] == 0) {
    B.pop();
    top--;
  }

  return _fxbtoDec(B, top, method, strn, ++itr, -99) + strn[r + 10];
};

var _fxbtoDecimals = function (B, top, SHIFT, itr) {
// ** deprecated ** use much faster _fxbtoDec instead;
// Just give B as an argument, don't fill the other arguments, unless YKWYAD
// it tooks about 2 and half seconds for 2048-bits, and 20+ seconds for 4096-bits
// returns decimals string representation of buffer
  if (arguments[4] != -99) {
    B = B.slice(0); // release original B;
    top = B.length;
    while (top && B[--top] == 0) B.pop();
    if (top < 1) return B;
    if (top > 128) return 'sorry, too much';
    SHIFT = (top + 1) << 5;
    itr = 0;
  }

  if (top < 0) return '0';
  var msb = _bsr2(B[top]);
  if (top < 2)
    if (top == 0) return '' + B[0];
    else
      // damn!!! can't we rely on js for this end, even 22 is TOO HIGH!
      if (msb < 22 - 1) return '' + (B[1] * CAP32 + B[0]);

  var msb2 = 3;
  var k = msb - msb2;

  B.unshift(0);
  top++;

  // PROLOG
  if (k < 0)
    _fxbShll(B, -k, top);
  else if (k > 0)
    _fxbShr(k, B, top);

  var r = B[top];
  if (r >= 10) {
    r -= 10;
    B[top] = r;
    B[0]++;
  }

  // MAIN DISCOURSE
  k = 32 - k;
  while (k < SHIFT - 4) {
    switch (B[top]) {
      case 0: _fxbShll(B, 4, top); k += 4; break;
      case 1: _fxbShll(B, 3, top); k += 3; break;
      case 2: case 3: _fxbShll(B, 2, top); k += 2; break;
      default: _fxbShl1_p(B, top); k++; break;
    }
    r = B[top];
    if (r >= 10) {
      r -= 10;
      B[top] = r;
      B[0]++;
    }
  }

  // EPILOG
  while (k < SHIFT) {
    k++;
    _fxbShl1_p(B, top);
    r = B[top];
    if (r >= 10) {
      r -= 10;
      B[top] = r;
      B[0]++;
    }
  }

  top --;
  while (B[top] == 0) { SHIFT = top << 5; top--; }
  //B.pop();


  //if (itr > 1000) return '' +r;
  return _fxbtoDecimals(B, top, SHIFT, ++itr, -99) + '' + r;
};

function _validatesnum(snumber, index) {
  index = index |0;
  var ValidChars = 'ABCDEFabcdef0123456789';
  var nums = snumber.split(''), len = nums.length;
  for (var i = 0; i < len; i++)
    if (ValidChars.indexOf(nums[i]) < index)
      nums[i] = '';
  return nums.join('');
}

function validHexStr(snumber) { return _validatesnum(snumber); } 
function validDecimalStr(snumber) { return _validatesnum(snumber, 10); } 

// accompanion for _fxbtoDecimals, assign decimal string to binary buffer
var _fxDecimalstoBuf = function(DecimalStr) {
  DecimalStr = validDecimalStr(DecimalStr);
  var B = [0], n = +DecimalStr;
  if (n < CAP53) {
    B[0] = parseInt(n % CAP32);
    B[1] = (n / CAP32) | 0;
    return B;
  }
  var decs = DecimalStr.split('');
  var i = 0, len = decs.length;
  for (var i = 0; i < len; i++) {
    n = +decs[i];
    if (n >= 0 && n <= 9)
      _fxbMul1e1p(B, n)
  }
  return B;
};


// accompanion for _fxbtoDecimals, assign hexstring to binary buffer
var _fxHexstoBuf = function (HexStr) {
  HexStr = validHexStr(HexStr);
  var hexs = '00000000'.substr(0, 8 - (((HexStr.length - 1) % 8) + 1)) + HexStr;
  var hexses = hexs.match(/.{8}/g);

  var B = [];
  var len = hexses.length;
  for (var i = 0; i < len; i++)
    B[i] = +('0x' + hexses[len - i - 1]);
  return B;
};

var _fxNumberstoBuf = function (NumberStr) { // returns B;
  var n = NumberStr.indexOf('0x');
  var B = [];
  if (n < 0)
    B = _fxDecimalstoBuf(NumberStr);
  else 
    B = _fxHexstoBuf(NumberStr.substr(n + 2));
  return B;
};

var _fxbDivMod = function(A, B, opt, len) {
//  A,B must be equal in length, at least for now.
//  option 0: quotient in p, 1: remainder in p, 2: return struct div/mod
  //len = A.length;
  var dp1 = _bsra(A), dp2 = _bsra(B);
  var cmp = _fxbCmp(A, B, bt1, bt2);

  var i, SHIFT = len << 5; // *32

  var q = [], r = [];
  for (i = 0; i < len; i++) q[i] = 0;
  for (i = 0; i < len; i++) r[i] = 0;

  opt = opt | 0;
  if (cmp == 0) //return {q: [1].concat(a.slice(len, -1)), r: a.slice(len)};
    switch (opt) {
    case 0: A = [1].concat(q.slice(0, -1)); return A;
    case 1: A = q.slice(0); return A;
    case 2: return {q: [1].concat(a.slice(0, -1)), r: q.slice(0)};
  }
  if (cmp < 0) //return {q: q.slice(len), r: B.slice(0)};
    switch (opt) {
    case 0: A = q.slice(0); return A;
    case 1: A = B.slice(0); return A;
    case 2: return {q: q.slice(0), r: B.slice(0)};
  }

  var bt1 = _bsr2(A[dp1]), bt2 = _bsr2(B[dp2]);
  var t = bt1 - bt2, p = dp1 - dp2, k = (p << 5) + t;

  // adjust/trim based on most significant dword
  // originally it would be a rightshift with bt1 > bt2
  // watch this! i'm not realy sure p++/p-- direction were correct
  // - not used anyway, same cost -
  // if (t > 16) { p--; t -= 32; } // too much rightshift, do leftshift instead
  // else if (t < -16) { p++; t += 32; } // do rightshift

  //for (i = +len - p; i < len + dp2; i++) a[i] = A[i - len + p];
  //for (i = +len - p; i < len; i++) q[i] = A[i - len + p];
  //for (i = +len; i < len + dp2; i++) r[i - len] = A[i - len + p];
  // i'm a little bit confused here..
  for (i = 0; i < dp2; i++) r[i] = A[i + p]; // edi:esi = remainder
  for (i = len - p; i < len; i++) q[i] = A[i - len + p]; // edx:eax = quotient

  _fxbShr2(t, q, r)

  { // do this once first in case r already >= B
    if (_fxbCmp(r, B, dp2, dp2) >= 0) {
      _fxbSub(r, B, dp2, dp2, dp2)
      q[0]++;
    }
  }

  // wow, i don't realize this summed up to be so simple.
  for (i = SHIFT - k; i < SHIFT; i++) {
    _fxbShl12_p(q, r);
    if (_fxbCmp(r, B, dp2, dp2) >= 0) {
      _fxbSub(r, B, dp2, dp2, dp2)
      q[0]++;
    }
  }

  switch(opt) {
    case 0: A = q.slice(0); return A;
    case 1: A = r.slice(0); return A;
    case 2: return {q: q.slice(0), r: r.slice(0)};
  }

};

var intxDivMod = function(X, Y, opt) {
  if (Y.bits != X.bits) return X;
  var A = X.store();
  var B = Y.store();
  opt = opt | 0;
  return _fxbDivMod(A, B, opt);
};

Intx.prototype.div = function(Y) { return intxDivMod(this, Y, 0); };
Intx.prototype.mod = function(Y) { return intxDivMod(this, Y, 1); };
Intx.prototype.divmod = function(Y) { return intxDivMod(this, Y, 2); };

// ************************************************************

var _toHex = function (n, block) {
   var z = '00000000';
   block = block || z.length;
   var s = n.toString(16);
   var k =  (block - 1) - (s.length - 1) % block;
   s = z.substr(0, k) + s;
   // var re = new RegExp('.{' + block + '}', 'g');
   // s = s.match(re).join(':');
   return s;
};

var _toHex32 = function (n) {
   var z = '00000000';
   var block = z.length;
   n &= MASK32;
   n += (n < 0) * CAP32;
   var s = n.toString(16);
   var k =  (block - 1) - (s.length - 1) % block;
   s = z.substr(0, k) + s;
   return s;
};

// left over, not used
// var _toHex64 = function (q) { return _toHex32(q.hi) + _toHex32(q.lo & MASK32); }
// var _toHex128 = function (R) { return _toHex64(R.q1) + _toHex64(R.q0); }
// var _toHex256 = function (E) { return _toHex128(E.r1) + _toHex64(E.r0); }
// var _toHex512 = function (F) { return _toHex256(F.e1) + _toHex64(F.e0); }
// var _toHex1024 = function (G) { return _toHex256(G.f1) + _toHex64(G.f0); }
