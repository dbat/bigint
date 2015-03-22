# intex
JavaScript big integer object example

  integer functions

  at first, we would like to make them object-oriented sounds,
  with fancy range checking (means several method calls) almost
  in every turns, but finally we decided to cut te red tapes
  down to the real bone crunching buffer, left only the sane
  consumer happy, the careless ones may go to the nexus.<br>
  --<br>
  I used to speak in assembly x86, the optimisation applied
  here may not be appropriate and left for further exercise.

---
Still in work in progress....

debugging helper, bc script: intex.bc
<pre><code>
  _px32_init(): initialize. should be run first. it's already done.
  Functions:
      Note: argument (buf) below is index number of buffer:
      1: buffer-d, 2: buffer-b, 3: buffer-e, 4: buffer-f, 5: buffer-g
  _bxsra(buf): get the top most significant dword of buffer:
      dsra(), bsra(), esra(), fsra(), gsra()
  _bxn2buf(n, buf): store/convert number to buffer:
      n2bd(n), n2bb(n), n2be(n), n2bf(n), n2bg(n)
      equal with: setd(n), setb(n), sete(n), setf(n), setg(n)
  _bxpoke(n, buf, index): set one specific/individual elemen of buffer:
      poked(n, index), pokeb(n,ix), pokee(n,ix), pokef(n,ix), pokeg(n,ix)
      returns last value before replaced
  _bxpush(buf), _bxpushn(val, buf): push 0 or specified value become item-0:
      pushd(), pushb, pushe(), pushf(), pushg()
      pushnd(val), pushnb(val), pushne(val), pushnf(val), pushng(val)
  _bxpop(buf), _bxpops(count, buf): pops one or specified count from index-0:
      popd(), popb, pope(), popf(), popg()
      popsd(count), popsb(cnt), popse(cnt), popsf(cnt), popsg(cnt)
      returns last value before popped
  _bx2val(buf): get/translate buffer to its' numeric value:
      d2n(), b2n(), e2n(), f2n(), g2n()
  _bx2arr(buf): get/translate buffer to their array presentation:
      d2a(), b2a(), e2a(), f2a(), g2a(), see also: n2a(n), _bx2val()
  _bxrestore(buf): refill/reset buffer with original args[]:
      resetd(), resetb(), resete(), resetf(), resetg()
  _bxclear(buf, start, stop): fill buffer contents with zero:
      cleard(), clearb(), cleare(), clearf(), clearg()
      cut-up from start to top, to cut-down see also: push/pop
      cutd(start), cutb(start), cute(start), cutf(start), cutg(start)

  getmsb(n): get the most significant bit, 0-based
  getbits(n): get bit-size/length
  getdfold(n): get (hex) number length in dword fold

  n2a(n): translate number to array of dwords, see also: _bx2arr(buf)

  Note (for all shift functions): maximum shifts is: 16384
  shl(n, shift), shr(n, shift): arbitrary shift left/right
  shld(n, shift): shift left truncated to it's dwords size/length
  shlb(n, shift, bits): shift left truncated at the specified bits-wide

  help(): this function
</code></pre>