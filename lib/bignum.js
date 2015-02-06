/*jslint browser: true, bitwise: true, plusplus: true, sloppy: true, vars: true, white: true */
/*global define, int2bigInt */

/**
 *  Module bignum, gestion de grands nombres.
 *  Basé sur BigInt de Leemon Baird (www.leemon.com)
 */
define(function () {

    ////////////////////////////////////////////////////////////////////////////////////////
    // Big Integer Library v. 5.5
    // Created 2000, last modified 2013
    // Leemon Baird
    // www.leemon.com
    //
    // Version history:
    // v 5.5  17 Mar 2013
    //   - two lines of a form like "if (x<0) x+=n" had the "if" changed to "while" to
    //     handle the case when x<-n. (Thanks to James Ansell for finding that bug)
    // v 5.4  3 Oct 2009
    //   - added "var i" to greaterShift() so i is not global. (Thanks to PŽter Szab— for finding that bug)
    //
    // v 5.3  21 Sep 2009
    //   - added randProbPrime(k) for probable primes
    //   - unrolled loop in mont_ (slightly faster)
    //   - millerRabin now takes a bigInt parameter rather than an int
    //
    // v 5.2  15 Sep 2009
    //   - fixed capitalization in call to int2bigInt in randBigInt
    //     (thanks to Emili Evripidou, Reinhold Behringer, and Samuel Macaleese for finding that bug)
    //
    // v 5.1  8 Oct 2007
    //   - renamed inverseModInt_ to inverseModInt since it doesn't change its parameters
    //   - added functions GCD and randBigInt, which call GCD_ and randBigInt_
    //   - fixed a bug found by Rob Visser (see comment with his name below)
    //   - improved comments
    //
    // This file is public domain.   You can use it for any purpose without restriction.
    // I do not guarantee that it is correct, so use it at your own risk.  If you use
    // it for something interesting, I'd appreciate hearing about it.  If you find
    // any bugs or make any improvements, I'd appreciate hearing about those too.
    // It would also be nice if my name and URL were left in the comments.  But none
    // of that is required.
    //
    // This code defines a bigInt library for arbitrary-precision integers.
    // A bigInt is an array of integers storing the value in chunks of bpe bits,
    // little endian (buff[0] is the least significant word).
    // Negative bigInts are stored two's complement.  Almost all the functions treat
    // bigInts as nonnegative.  The few that view them as two's complement say so
    // in their comments.  Some functions assume their parameters have at least one
    // leading zero element. Functions with an underscore at the end of the name put
    // their answer into one of the arrays passed in, and have unpredictable behavior
    // in case of overflow, so the caller must make sure the arrays are big enough to
    // hold the answer.  But the average user should never have to call any of the
    // underscored functions.  Each important underscored function has a wrapper function
    // of the same name without the underscore that takes care of the details for you.
    // For each underscored function where a parameter is modified, that same variable
    // must not be used as another argument too.  So, you cannot square x by doing
    // multMod_(x,x,n).  You must use squareMod_(x,n) instead, or do y=dup(x); multMod_(x,y,n).
    // Or simply use the multMod(x,x,n) function without the underscore, where
    // such issues never arise, because non-underscored functions never change
    // their parameters; they always allocate new memory for the answer that is returned.
    //
    // These functions are designed to avoid frequent dynamic memory allocation in the inner loop.
    // For most functions, if it needs a BigInt as a local variable it will actually use
    // a global, and will only allocate to it only when it's not the right size.  This ensures
    // that when a function is called repeatedly with same-sized parameters, it only allocates
    // memory on the first call.
    //
    // Note that for cryptographic purposes, the calls to Math.random() must
    // be replaced with calls to a better pseudorandom number generator.
    //
    // In the following, "bigInt" means a bigInt with at least one leading zero element,
    // and "integer" means a nonnegative integer less than radix.  In some cases, integer
    // can be negative.  Negative bigInts are 2s complement.
    //
    // The following functions do not modify their inputs.
    // Those returning a bigInt, string, or Array will dynamically allocate memory for that value.
    // Those returning a boolean will return the integer 0 (false) or 1 (true).
    // Those returning boolean or int will not allocate memory except possibly on the first
    // time they're called with a given parameter size.
    //
    // bigInt  add(x,y)               //return (x+y) for bigInts x and y.
    // bigInt  addInt(x,n)            //return (x+n) where x is a bigInt and n is an integer.
    // string  bigInt2str(x,base)     //return a string form of bigInt x in a given base, with 2 <= base <= 95
    // int     bitSize(x)             //return how many bits long the bigInt x is, not counting leading zeros
    // bigInt  dup(x)                 //return a copy of bigInt x
    // boolean equals(x,y)            //is the bigInt x equal to the bigint y?
    // boolean equalsInt(x,y)         //is bigint x equal to integer y?
    // bigInt  expand(x,n)            //return a copy of x with at least n elements, adding leading zeros if needed
    // Array   findPrimes(n)          //return array of all primes less than integer n
    // bigInt  GCD(x,y)               //return greatest common divisor of bigInts x and y (each with same number of elements).
    // boolean greater(x,y)           //is x>y?  (x and y are nonnegative bigInts)
    // boolean greaterShift(x,y,shift)//is (x <<(shift*bpe)) > y?
    // bigInt  int2bigInt(t,n,m)      //return a bigInt equal to integer t, with at least n bits and m array elements
    // bigInt  inverseMod(x,n)        //return (x**(-1) mod n) for bigInts x and n.  If no inverse exists, it returns null
    // int     inverseModInt(x,n)     //return x**(-1) mod n, for integers x and n.  Return 0 if there is no inverse
    // boolean isZero(x)              //is the bigInt x equal to zero?
    // boolean millerRabin(x,b)       //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is bigInt, 1<b<x)
    // boolean millerRabinInt(x,b)    //does one round of Miller-Rabin base integer b say that bigInt x is possibly prime? (b is int,    1<b<x)
    // bigInt  mod(x,n)               //return a new bigInt equal to (x mod n) for bigInts x and n.
    // int     modInt(x,n)            //return x mod n for bigInt x and integer n.
    // bigInt  mult(x,y)              //return x*y for bigInts x and y. This is faster when y<x.
    // bigInt  multMod(x,y,n)         //return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
    // boolean negative(x)            //is bigInt x negative?
    // bigInt  powMod(x,y,n)          //return (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
    // bigInt  randBigInt(n,s)        //return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
    // bigInt  randTruePrime(k)       //return a new, random, k-bit, true prime bigInt using Maurer's algorithm.
    // bigInt  randProbPrime(k)       //return a new, random, k-bit, probable prime bigInt (probability it's composite less than 2^-80).
    // bigInt  str2bigInt(s,b,n,m)    //return a bigInt for number represented in string s in base b with at least n bits and m array elements
    // bigInt  sub(x,y)               //return (x-y) for bigInts x and y.  Negative answers will be 2s complement
    // bigInt  trim(x,k)              //return a copy of x with exactly k leading zero elements
    //
    //
    // The following functions each have a non-underscored version, which most users should call instead.
    // These functions each write to a single parameter, and the caller is responsible for ensuring the array
    // passed in is large enough to hold the result.
    //
    // void    addInt_(x,n)          //do x=x+n where x is a bigInt and n is an integer
    // void    add_(x,y)             //do x=x+y for bigInts x and y
    // void    copy_(x,y)            //do x=y on bigInts x and y
    // void    copyInt_(x,n)         //do x=n on bigInt x and integer n
    // void    GCD_(x,y)             //set x to the greatest common divisor of bigInts x and y, (y is destroyed).  (This never overflows its array).
    // boolean inverseMod_(x,n)      //do x=x**(-1) mod n, for bigInts x and n. Returns 1 (0) if inverse does (doesn't) exist
    // void    mod_(x,n)             //do x=x mod n for bigInts x and n. (This never overflows its array).
    // void    mult_(x,y)            //do x=x*y for bigInts x and y.
    // void    multMod_(x,y,n)       //do x=x*y  mod n for bigInts x,y,n.
    // void    powMod_(x,y,n)        //do x=x**y mod n, where x,y,n are bigInts (n is odd) and ** is exponentiation.  0**0=1.
    // void    randBigInt_(b,n,s)    //do b = an n-bit random BigInt. if s=1, then nth bit (most significant bit) is set to 1. n>=1.
    // void    randTruePrime_(ans,k) //do ans = a random k-bit true random prime (not just probable prime) with 1 in the msb.
    // void    sub_(x,y)             //do x=x-y for bigInts x and y. Negative answers will be 2s complement.
    //
    // The following functions do NOT have a non-underscored version.
    // They each write a bigInt result to one or more parameters.  The caller is responsible for
    // ensuring the arrays passed in are large enough to hold the results.
    //
    // void addShift_(x,y,ys)       //do x=x+(y<<(ys*bpe))
    // void carry_(x)               //do carries and borrows so each element of the bigInt x fits in bpe bits.
    // void divide_(x,y,q,r)        //divide x by y giving quotient q and remainder r
    // int  divInt_(x,n)            //do x=floor(x/n) for bigInt x and integer n, and return the remainder. (This never overflows its array).
    // int  eGCD_(x,y,d,a,b)        //sets a,b,d to positive bigInts such that d = GCD_(x,y) = a*x-b*y
    // void halve_(x)               //do x=floor(|x|/2)*sgn(x) for bigInt x in 2's complement.  (This never overflows its array).
    // void leftShift_(x,n)         //left shift bigInt x by n bits.  n<bpe.
    // void linComb_(x,y,a,b)       //do x=a*x+b*y for bigInts x and y and integers a and b
    // void linCombShift_(x,y,b,ys) //do x=x+b*(y<<(ys*bpe)) for bigInts x and y, and integers b and ys
    // void mont_(x,y,n,np)         //Montgomery multiplication (see comments where the function is defined)
    // void multInt_(x,n)           //do x=x*n where x is a bigInt and n is an integer.
    // void rightShift_(x,n)        //right shift bigInt x by n bits.  0 <= n < bpe. (This never overflows its array).
    // void squareMod_(x,n)         //do x=x*x  mod n for bigInts x,n
    // void subShift_(x,y,ys)       //do x=x-(y<<(ys*bpe)). Negative answers will be 2s complement.
    //
    // The following functions are based on algorithms from the _Handbook of Applied Cryptography_
    //    powMod_()           = algorithm 14.94, Montgomery exponentiation
    //    eGCD_,inverseMod_() = algorithm 14.61, Binary extended GCD_
    //    GCD_()              = algorothm 14.57, Lehmer's algorithm
    //    mont_()             = algorithm 14.36, Montgomery multiplication
    //    divide_()           = algorithm 14.20  Multiple-precision division
    //    squareMod_()        = algorithm 14.16  Multiple-precision squaring
    //    randTruePrime_()    = algorithm  4.62, Maurer's algorithm
    //    millerRabin()       = algorithm  4.24, Miller-Rabin algorithm
    //
    // Profiling shows:
    //     randTruePrime_() spends:
    //         10% of its time in calls to powMod_()
    //         85% of its time in calls to millerRabin()
    //     millerRabin() spends:
    //         99% of its time in calls to powMod_()   (always with a base of 2)
    //     powMod_() spends:
    //         94% of its time in calls to mont_()  (almost always with x==y)
    //
    // This suggests there are several ways to speed up this library slightly:
    //     - convert powMod_ to use a Montgomery form of k-ary window (or maybe a Montgomery form of sliding window)
    //         -- this should especially focus on being fast when raising 2 to a power mod n
    //     - convert randTruePrime_() to use a minimum r of 1/3 instead of 1/2 with the appropriate change to the test
    //     - tune the parameters in randTruePrime_(), including c, m, and recLimit
    //     - speed up the single loop in mont_() that takes 95% of the runtime, perhaps by reducing checking
    //       within the loop when all the parameters are the same length.
    //
    // There are several ideas that look like they wouldn't help much at all:
    //     - replacing trial division in randTruePrime_() with a sieve (that speeds up something taking almost no time anyway)
    //     - increase bpe from 15 to 30 (that would help if we had a 32*32->64 multiplier, but not with JavaScript's 32*32->32)
    //     - speeding up mont_(x,y,n,np) when x==y by doing a non-modular, non-Montgomery square
    //       followed by a Montgomery reduction.  The intermediate answer will be twice as long as x, so that
    //       method would be slower.  This is unfortunate because the code currently spends almost all of its time
    //       doing mont_(x,x,...), both for randTruePrime_() and powMod_().  A faster method for Montgomery squaring
    //       would have a large impact on the speed of randTruePrime_() and powMod_().  HAC has a couple of poorly-worded
    //       sentences that seem to imply it's faster to do a non-modular square followed by a single
    //       Montgomery reduction, but that's obviously wrong.
    ////////////////////////////////////////////////////////////////////////////////////////

    //globals
    var bpe = 0,    //bits stored per array element
        mask = 0,   //AND this with an array element to chop it down to bpe bits
        radix = mask + 1,   //equals 2^bpe.  A single 1 bit to the left of the last bit of mask.

    //the digits for converting to different bases
        digitsStr = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_=!@#$%^&*()[]{}|;:,.<>/?`~ \\\'\"+-',

        one = null;

    //initialize the global variables
    for (bpe = 0; (1 << (bpe + 1)) > (1 << bpe); bpe++) {}  //bpe=number of bits in the mantissa on this platform
    bpe>>=1;                   //bpe=number of bits in one element of the array representing the bigInt
    mask=(1<<bpe)-1;           //AND the mask with an integer to get its bpe least significant bits
    radix=mask+1;              //2^bpe.  a single 1 bit to the left of the first bit of mask
    one=int2bigInt(1,1,1);     //constant used in powMod_()

    //the following global variables are scratchpad memory to
    //reduce dynamic memory allocation in the inner loop
    var t = new Array(0),
        ss = t,       //used in mult_()
        s0 = t,       //used in multMod_(), squareMod_()
        s1 = t,       //used in powMod_(), multMod_(), squareMod_()
        s2 = t,       //used in powMod_(), multMod_()
        s3 = t,       //used in powMod_()
        s4 = t, s5 = t, //used in mod_()
        s6 = t,       //used in bigInt2str()
        s7 = t,       //used in powMod_()
        T = t,        //used in GCD_()
        sa = t,       //used in mont_()
        mr_x1 = t, mr_r = t, mr_a = t,                                      //used in millerRabin()
        eg_v = t, eg_u = t, eg_A = t, eg_B = t, eg_C = t, eg_D = t,               //used in eGCD_(), inverseMod_()
        md_q1 = t, md_q2 = t, md_q3 = t, md_r = t, md_r1 = t, md_r2 = t, md_tt = t, //used in mod_()

        primes = t, pows = t, s_i = t, s_i2 = t, s_R = t, s_rm = t, s_q = t, s_n1 = t,
        s_a = t, s_r2 = t, s_n = t, s_b = t, s_d = t, s_x1 = t, s_x2 = t, s_aa = t, //used in randTruePrime_()

    rpprb=t; //used in randProbPrimeRounds() (which also uses "primes")

    ////////////////////////////////////////////////////////////////////////////////////////


    //return a copy of x with at least n elements, adding leading zeros if needed
    function expand(x,n) {
      var ans=int2bigInt(0,(x.length>n ? x.length : n)*bpe,0);
      copy_(ans,x);
      return ans;
    }

    //return a new bigInt equal to (x mod n) for bigInts x and n.
    function mod(x,n) {
      var ans=dup(x);
      mod_(ans,n);
      return trim(ans,1);
    }

    //return (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
    function powMod(x,y,n) {
      var ans=expand(x,n.length);
      powMod_(ans,trim(y,2),trim(n,2),0);  //this should work without the trim, but doesn't
      return trim(ans,1);
    }

    //return (x-y) for bigInts x and y.  Negative answers will be 2s complement
    function sub(x,y) {
      var ans=expand(x,(x.length>y.length ? x.length+1 : y.length+1));
      sub_(ans,y);
      return trim(ans,1);
    }

    //return (x+y) for bigInts x and y.
    function add(x,y) {
      var ans=expand(x,(x.length>y.length ? x.length+1 : y.length+1));
      add_(ans,y);
      return trim(ans,1);
    }

    //return (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
    function multMod(x,y,n) {
      var ans=expand(x,n.length);
      multMod_(ans,y,n);
      return trim(ans,1);
    }

    //Return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
    function randBigInt(n,s) {
      var a,b;
      a=Math.floor((n-1)/bpe)+2; //# array elements to hold the BigInt with a leading 0 element
      b=int2bigInt(0,0,a);
      randBigInt_(b,n,s);
      return b;
    }

    //Set b to an n-bit random BigInt.  If s=1, then the most significant of those n bits is set to 1.
    //Array b must be big enough to hold the result. Must have n>=1
    function randBigInt_(b,n,s) {
      var i,a;
      for (i=0;i<b.length;i++)
        b[i]=0;
      a=Math.floor((n-1)/bpe)+1; //# array elements to hold the BigInt
      for (i=0;i<a;i++) {
        b[i]=Math.floor(Math.random()*(1<<(bpe-1)));
      }
      b[a-1] &= (2<<((n-1)%bpe))-1;
      if (s==1)
        b[a-1] |= (1<<((n-1)%bpe));
    }

    //return x**(-1) mod n, for integers x and n.  Return 0 if there is no inverse
    function inverseModInt(x,n) {
      var a=1,b=0,t;
      for (;;) {
        if (x==1) return a;
        if (x==0) return 0;
        b-=a*Math.floor(n/x);
        n%=x;

        if (n==1) return b; //to avoid negatives, change this b to n-b, and each -= to +=
        if (n==0) return 0;
        a-=b*Math.floor(x/n);
        x%=n;
      }
    }

    //is bigInt x negative?
    function negative(x) {
      return ((x[x.length-1]>>(bpe-1))&1);
    }

    //is (x << (shift*bpe)) > y?
    //x and y are nonnegative bigInts
    //shift is a nonnegative integer
    function greaterShift(x,y,shift) {
      var k, i, kx=x.length, ky=y.length;
      k=((kx+shift)<ky) ? (kx+shift) : ky;
      for (i=ky-1-shift; i<kx && i>=0; i++)
        if (x[i]>0)
          return 1; //if there are nonzeros in x to the left of the first column of y, then x is bigger
      for (i=kx-1+shift; i<ky; i++)
        if (y[i]>0)
          return 0; //if there are nonzeros in y to the left of the first column of x, then x is not bigger
      for (i=k-1; i>=shift; i--)
        if      (x[i-shift]>y[i]) return 1;
        else if (x[i-shift]<y[i]) return 0;
      return 0;
    }

    //is x > y? (x and y both nonnegative)
    function greater(x,y) {
      var i;
      var k=(x.length<y.length) ? x.length : y.length;

      for (i=x.length;i<y.length;i++)
        if (y[i])
          return 0;  //y has more digits

      for (i=y.length;i<x.length;i++)
        if (x[i])
          return 1;  //x has more digits

      for (i=k-1;i>=0;i--)
        if (x[i]>y[i])
          return 1;
        else if (x[i]<y[i])
          return 0;
      return 0;
    }

    //divide x by y giving quotient q and remainder r.  (q=floor(x/y),  r=x mod y).  All 4 are bigints.
    //x must have at least one leading zero element.
    //y must be nonzero.
    //q and r must be arrays that are exactly the same length as x. (Or q can have more).
    //Must have x.length >= y.length >= 2.
    function divide_(x,y,q,r) {
      var kx, ky;
      var i,j,y1,y2,c,a,b;
      copy_(r,x);
      for (ky=y.length;y[ky-1]==0;ky--); //ky is number of elements in y, not including leading zeros

      //normalize: ensure the most significant element of y has its highest bit set
      b=y[ky-1];
      for (a=0; b; a++)
        b>>=1;
      a=bpe-a;  //a is how many bits to shift so that the high order bit of y is leftmost in its array element
      leftShift_(y,a);  //multiply both by 1<<a now, then divide both by that at the end
      leftShift_(r,a);

      //Rob Visser discovered a bug: the following line was originally just before the normalization.
      for (kx=r.length;r[kx-1]==0 && kx>ky;kx--); //kx is number of elements in normalized x, not including leading zeros

      copyInt_(q,0);                      // q=0
      while (!greaterShift(y,r,kx-ky)) {  // while (leftShift_(y,kx-ky) <= r) {
        subShift_(r,y,kx-ky);             //   r=r-leftShift_(y,kx-ky)
        q[kx-ky]++;                       //   q[kx-ky]++;
      }                                   // }

      for (i=kx-1; i>=ky; i--) {
        if (r[i]==y[ky-1])
          q[i-ky]=mask;
        else
          q[i-ky]=Math.floor((r[i]*radix+r[i-1])/y[ky-1]);

        //The following for(;;) loop is equivalent to the commented while loop,
        //except that the uncommented version avoids overflow.
        //The commented loop comes from HAC, which assumes r[-1]==y[-1]==0
        //  while (q[i-ky]*(y[ky-1]*radix+y[ky-2]) > r[i]*radix*radix+r[i-1]*radix+r[i-2])
        //    q[i-ky]--;
        for (;;) {
          y2=(ky>1 ? y[ky-2] : 0)*q[i-ky];
          c=y2>>bpe;
          y2=y2 & mask;
          y1=c+q[i-ky]*y[ky-1];
          c=y1>>bpe;
          y1=y1 & mask;

          if (c==r[i] ? y1==r[i-1] ? y2>(i>1 ? r[i-2] : 0) : y1>r[i-1] : c>r[i])
            q[i-ky]--;
          else
            break;
        }

        linCombShift_(r,y,-q[i-ky],i-ky);    //r=r-q[i-ky]*leftShift_(y,i-ky)
        if (negative(r)) {
          addShift_(r,y,i-ky);         //r=r+leftShift_(y,i-ky)
          q[i-ky]--;
        }
      }

      rightShift_(y,a);  //undo the normalization step
      rightShift_(r,a);  //undo the normalization step
    }

    //return x mod n for bigInt x and integer n.
    function modInt(x,n) {
      var i,c=0;
      for (i=x.length-1; i>=0; i--)
        c=(c*radix+x[i])%n;
      return c;
    }

    //convert the integer t into a bigInt with at least the given number of bits.
    //the returned array stores the bigInt in bpe-bit chunks, little endian (buff[0] is least significant word)
    //Pad the array with leading zeros so that it has at least minSize elements.
    //There will always be at least one leading 0 element.
    function int2bigInt(t,bits,minSize) {
      var i,k;
      k=Math.ceil(bits/bpe)+1;
      k=minSize>k ? minSize : k;
      buff=new Array(k);
      copyInt_(buff,t);
      return buff;
    }

    //return the bigInt given a string representation in a given base.
    //Pad the array with leading zeros so that it has at least minSize elements.
    //If base=-1, then it reads in a space-separated list of array elements in decimal.
    //The array will always have at least one leading zero, unless base=-1.
    function str2bigInt(s,base,minSize) {
      var d, i, j, x, y, k, kk;
      var k=s.length;
      if (base==-1) { //comma-separated list of array elements in decimal
        x=new Array(0);
        for (;;) {
          y=new Array(x.length+1);
          for (i=0;i<x.length;i++)
            y[i+1]=x[i];
          y[0]=parseInt(s,10);
          x=y;
          d=s.indexOf(',',0);
          if (d<1)
            break;
          s=s.substring(d+1);
          if (s.length==0)
            break;
        }
        if (x.length<minSize) {
          y=new Array(minSize);
          copy_(y,x);
          return y;
        }
        return x;
      }

      x=int2bigInt(0,base*k,0);
      for (i=0;i<k;i++) {
        d=digitsStr.indexOf(s.substring(i,i+1),0);
        if (base<=36 && d>=36)  //convert lowercase to uppercase if base<=36
          d-=26;
        if (d>=base || d<0) {   //stop at first illegal character
          break;
        }
        multInt_(x,base);
        addInt_(x,d);
      }

      for (k=x.length;k>0 && !x[k-1];k--); //strip off leading zeros
      k=minSize>k+1 ? minSize : k+1;
      y=new Array(k);
      kk=k<x.length ? k : x.length;
      for (i=0;i<kk;i++)
        y[i]=x[i];
      for (;i<k;i++)
        y[i]=0;
      return y;
    }

    //is the bigInt x equal to zero?
    function isZero(x) {
      var i;
      for (i=0;i<x.length;i++)
        if (x[i])
          return 0;
      return 1;
    }

    //convert a bigInt into a string in a given base, from base 2 up to base 95.
    //Base -1 prints the contents of the array representing the number.
    function bigInt2str(x,base) {
      var i,t,s="";

      if (s6.length!=x.length)
        s6=dup(x);
      else
        copy_(s6,x);

      if (base==-1) { //return the list of array contents
        for (i=x.length-1;i>0;i--)
          s+=x[i]+',';
        s+=x[0];
      }
      else { //return it in the given base
        while (!isZero(s6)) {
          t=divInt_(s6,base);  //t=s6 % base; s6=floor(s6/base);
          s=digitsStr.substring(t,t+1)+s;
        }
      }
      if (s.length==0)
        s="0";
      return s;
    }

    //returns a duplicate of bigInt x
    function dup(x) {
      var i;
      buff=new Array(x.length);
      copy_(buff,x);
      return buff;
    }

    //do x=y on bigInts x and y.  x must be an array at least as big as y (not counting the leading zeros in y).
    function copy_(x,y) {
      var i;
      var k=x.length<y.length ? x.length : y.length;
      for (i=0;i<k;i++)
        x[i]=y[i];
      for (i=k;i<x.length;i++)
        x[i]=0;
    }

    //do x=y on bigInt x and integer y.
    function copyInt_(x,n) {
      var i,c;
      for (c=n,i=0;i<x.length;i++) {
        x[i]=c & mask;
        c>>=bpe;
      }
    }

    //do x=x+n where x is a bigInt and n is an integer.
    //x must be large enough to hold the result.
    function addInt_(x,n) {
      var i,k,c,b;
      x[0]+=n;
      k=x.length;
      c=0;
      for (i=0;i<k;i++) {
        c+=x[i];
        b=0;
        if (c<0) {
          b=-(c>>bpe);
          c+=b*radix;
        }
        x[i]=c & mask;
        c=(c>>bpe)-b;
        if (!c) return; //stop carrying as soon as the carry is zero
      }
    }

    //right shift bigInt x by n bits.  0 <= n < bpe.
    function rightShift_(x,n) {
      var i;
      var k=Math.floor(n/bpe);
      if (k) {
        for (i=0;i<x.length-k;i++) //right shift x by k elements
          x[i]=x[i+k];
        for (;i<x.length;i++)
          x[i]=0;
        n%=bpe;
      }
      for (i=0;i<x.length-1;i++) {
        x[i]=mask & ((x[i+1]<<(bpe-n)) | (x[i]>>n));
      }
      x[i]>>=n;
    }

    //left shift bigInt x by n bits.
    function leftShift_(x,n) {
      var i;
      var k=Math.floor(n/bpe);
      if (k) {
        for (i=x.length; i>=k; i--) //left shift x by k elements
          x[i]=x[i-k];
        for (;i>=0;i--)
          x[i]=0;
        n%=bpe;
      }
      if (!n)
        return;
      for (i=x.length-1;i>0;i--) {
        x[i]=mask & ((x[i]<<n) | (x[i-1]>>(bpe-n)));
      }
      x[i]=mask & (x[i]<<n);
    }

    //do x=x*n where x is a bigInt and n is an integer.
    //x must be large enough to hold the result.
    function multInt_(x,n) {
      var i,k,c,b;
      if (!n)
        return;
      k=x.length;
      c=0;
      for (i=0;i<k;i++) {
        c+=x[i]*n;
        b=0;
        if (c<0) {
          b=-(c>>bpe);
          c+=b*radix;
        }
        x[i]=c & mask;
        c=(c>>bpe)-b;
      }
    }

    //do x=floor(x/n) for bigInt x and integer n, and return the remainder
    function divInt_(x,n) {
      var i,r=0,s;
      for (i=x.length-1;i>=0;i--) {
        s=r*radix+x[i];
        x[i]=Math.floor(s/n);
        r=s%n;
      }
      return r;
    }

    //do the linear combination x=a*x+b*(y<<(ys*bpe)) for bigInts x and y, and integers a, b and ys.
    //x must be large enough to hold the answer.
    function linCombShift_(x,y,b,ys) {
      var i,c,k,kk;
      k=x.length<ys+y.length ? x.length : ys+y.length;
      kk=x.length;
      for (c=0,i=ys;i<k;i++) {
        c+=x[i]+b*y[i-ys];
        x[i]=c & mask;
        c>>=bpe;
      }
      for (i=k;c && i<kk;i++) {
        c+=x[i];
        x[i]=c & mask;
        c>>=bpe;
      }
    }

    //do x=x-(y<<(ys*bpe)) for bigInts x and y, and integers a,b and ys.
    //x must be large enough to hold the answer.
    function subShift_(x,y,ys) {
      var i,c,k,kk;
      k=x.length<ys+y.length ? x.length : ys+y.length;
      kk=x.length;
      for (c=0,i=ys;i<k;i++) {
        c+=x[i]-y[i-ys];
        x[i]=c & mask;
        c>>=bpe;
      }
      for (i=k;c && i<kk;i++) {
        c+=x[i];
        x[i]=c & mask;
        c>>=bpe;
      }
    }

    //do x=x-y for bigInts x and y.
    //x must be large enough to hold the answer.
    //negative answers will be 2s complement
    function sub_(x,y) {
      var i,c,k,kk;
      k=x.length<y.length ? x.length : y.length;
      for (c=0,i=0;i<k;i++) {
        c+=x[i]-y[i];
        x[i]=c & mask;
        c>>=bpe;
      }
      for (i=k;c && i<x.length;i++) {
        c+=x[i];
        x[i]=c & mask;
        c>>=bpe;
      }
    }

    //do x=x+y for bigInts x and y.
    //x must be large enough to hold the answer.
    function add_(x,y) {
      var i,c,k,kk;
      k=x.length<y.length ? x.length : y.length;
      for (c=0,i=0;i<k;i++) {
        c+=x[i]+y[i];
        x[i]=c & mask;
        c>>=bpe;
      }
      for (i=k;c && i<x.length;i++) {
        c+=x[i];
        x[i]=c & mask;
        c>>=bpe;
      }
    }

    //do x=x mod n for bigInts x and n.
    function mod_(x,n) {
      if (s4.length!=x.length)
        s4=dup(x);
      else
        copy_(s4,x);
      if (s5.length!=x.length)
        s5=dup(x);
      divide_(s4,n,s5,x);  //x = remainder of s4 / n
    }

    //do x=x*y mod n for bigInts x,y,n.
    //for greater speed, let y<x.
    function multMod_(x,y,n) {
      var i;
      if (s0.length!=2*x.length)
        s0=new Array(2*x.length);
      copyInt_(s0,0);
      for (i=0;i<y.length;i++)
        if (y[i])
          linCombShift_(s0,x,y[i],i);   //s0=1*s0+y[i]*(x<<(i*bpe))
      mod_(s0,n);
      copy_(x,s0);
    }

    //return x with exactly k leading zero elements
    function trim(x,k) {
      var i,y;
      for (i=x.length; i>0 && !x[i-1]; i--);
      y=new Array(i+k);
      copy_(y,x);
      return y;
    }

    //do x=x**y mod n, where x,y,n are bigInts and ** is exponentiation.  0**0=1.
    //this is faster when n is odd.  x usually needs to have as many elements as n.
    function powMod_(x,y,n) {
      var k1,k2,kn,np;
      if(s7.length!=n.length)
        s7=dup(n);

      //for even modulus, use a simple square-and-multiply algorithm,
      //rather than using the more complex Montgomery algorithm.
      if ((n[0]&1)==0) {
        copy_(s7,x);
        copyInt_(x,1);
        while(!equalsInt(y,0)) {
          if (y[0]&1)
            multMod_(x,s7,n);
          divInt_(y,2);
          squareMod_(s7,n);
        }
        return;
      }

      //calculate np from n for the Montgomery multiplications
      copyInt_(s7,0);
      for (kn=n.length;kn>0 && !n[kn-1];kn--);
      np=radix-inverseModInt(modInt(n,radix),radix);
      s7[kn]=1;
      multMod_(x ,s7,n);   // x = x * 2**(kn*bp) mod n

      if (s3.length!=x.length)
        s3=dup(x);
      else
        copy_(s3,x);

      for (k1=y.length-1;k1>0 & !y[k1]; k1--);  //k1=first nonzero element of y
      if (y[k1]==0) {  //anything to the 0th power is 1
        copyInt_(x,1);
        return;
      }
      for (k2=1<<(bpe-1);k2 && !(y[k1] & k2); k2>>=1);  //k2=position of first 1 bit in y[k1]
      for (;;) {
        if (!(k2>>=1)) {  //look at next bit of y
          k1--;
          if (k1<0) {
            mont_(x,one,n,np);
            return;
          }
          k2=1<<(bpe-1);
        }
        mont_(x,x,n,np);

        if (k2 & y[k1]) //if next bit is a 1
          mont_(x,s3,n,np);
      }
    }


    //do x=x*y*Ri mod n for bigInts x,y,n,
    //  where Ri = 2**(-kn*bpe) mod n, and kn is the
    //  number of elements in the n array, not
    //  counting leading zeros.
    //x array must have at least as many elemnts as the n array
    //It's OK if x and y are the same variable.
    //must have:
    //  x,y < n
    //  n is odd
    //  np = -(n^(-1)) mod radix
    function mont_(x,y,n,np) {
      var i,j,c,ui,t,ks;
      var kn=n.length;
      var ky=y.length;

      if (sa.length!=kn)
        sa=new Array(kn);

      copyInt_(sa,0);

      for (;kn>0 && n[kn-1]==0;kn--); //ignore leading zeros of n
      for (;ky>0 && y[ky-1]==0;ky--); //ignore leading zeros of y
      ks=sa.length-1; //sa will never have more than this many nonzero elements.

      //the following loop consumes 95% of the runtime for randTruePrime_() and powMod_() for large numbers
      for (i=0; i<kn; i++) {
        t=sa[0]+x[i]*y[0];
        ui=((t & mask) * np) & mask;  //the inner "& mask" was needed on Safari (but not MSIE) at one time
        c=(t+ui*n[0]) >> bpe;
        t=x[i];

        //do sa=(sa+x[i]*y+ui*n)/b   where b=2**bpe.  Loop is unrolled 5-fold for speed
        j=1;
        for (;j<ky-4;) { c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++; }
        for (;j<ky;)   { c+=sa[j]+ui*n[j]+t*y[j];   sa[j-1]=c & mask;   c>>=bpe;   j++; }
        for (;j<kn-4;) { c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++;
                         c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++; }
        for (;j<kn;)   { c+=sa[j]+ui*n[j];          sa[j-1]=c & mask;   c>>=bpe;   j++; }
        for (;j<ks;)   { c+=sa[j];                  sa[j-1]=c & mask;   c>>=bpe;   j++; }
        sa[j-1]=c & mask;
      }

      if (!greater(n,sa))
        sub_(sa,n);
      copy_(x,sa);
    }


    /**
     *                              BBBBBBBBBBBBBBBBB
     *                              B::::::::::::::::B
     *                              B::::::BBBBBB:::::B
     *                              BB:::::B     B:::::B
     *                                B::::B     B:::::Bnnnn  nnnnnnnn
     *                                B::::B     B:::::Bn:::nn::::::::nn
     *                                B::::BBBBBB:::::B n::::::::::::::nn
     *                                B:::::::::::::BB  nn:::::::::::::::n
     *                                B::::BBBBBB:::::B   n:::::nnnn:::::n
     *                                B::::B     B:::::B  n::::n    n::::n
     *                                B::::B     B:::::B  n::::n    n::::n
     *                                B::::B     B:::::B  n::::n    n::::n
     *                              BB:::::BBBBBB::::::B  n::::n    n::::n
     *                              B:::::::::::::::::B   n::::n    n::::n
     *                              B::::::::::::::::B    n::::n    n::::n
     *                              BBBBBBBBBBBBBBBBB     nnnnnn    nnnnnn
     */

    var pad_str = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    /**
     *  Construit un nouveau Bn.
     *
     *  @constructor
     *  @param it L'origine du nombre.
     *  @param integer base La base, pour les strings.
     */
    function Bn(it, base) {
        this.init(it, base);
    }


    Bn.prototype = {

        /**
         *  Initialisation d'un bigint.
         *  Les chaînes hexadécimales commençant par 0x sont détéctées automatiquement.
         *
         *  @param it L'origine du nombre.
         *  @param integer base La base, pour les strings.
         *  @returns Bn this
         */
        init: function (it, base) {
            switch(typeof it) {
                case "object":
                    if (it instanceof Array) {
                        this.bigint = it;
                    } else {
                        this.bigint = [0];
                    }
                break;

                case "number":
                    this.bigint = int2bigInt(it, 1, 0);
                break;

                case "string":
                    if (it.match(/^0x/)) {
                        it = it.replace(/^0x/, '');
                        base = 16;
                    }

                    base = base || 10;

                    this.bigint = str2bigInt(it, base, 0);
                break;

                default:
                    this.bigint = [0];
            }

            return this;
        },

        /**
         *  (x+y) for bigInts x and y.
         *
         *  @param Bn y
         *  @returns Bn result
         */
        add: function (y) {
            return new Bn(add(this.bigint, y.bigint));
        },

        /**
         *  (x+y) mod n for bigInts x, y and n.
         *
         *  @param Bn y
         *  @param Bn n
         *  @returns Bn result
         */
        modAdd: function (y, n) {
            return this.add(y).mod(n);
        },

        /**
         *  return a new bigInt equal to (x mod n) for bigInts x and n.
         *
         *  @param Bn n
         *  @returns Bn result
         */
        mod: function (n) {
            return new Bn(mod(this.bigint, n.bigint));
        },

        /**
         *  (x*y mod n) for bigInts x,y,n.  For greater speed, let y<x.
         *
         *  @param Bn y
         *  @param Bn n
         *  @returns Bn result
         */
        modMul: function (y, n) {
            return new Bn(multMod(this.bigint, y.bigint, n.bigint));
        },

        /**
         *  (x**y mod n) where x,y,n are bigInts and ** is exponentiation.  0**0=1. Faster for odd n.
         *
         *  @param Bn y
         *  @param Bn n
         *  @returns Bn result
         */
        modExp: function (y, n) {
            return new Bn(powMod(this.bigint, y.bigint, n.bigint));
        },

        /**
         *  (x-y) for bigInts x and y.  Negative answers will be 2s complement
         *
         *  @param Bn y
         *  @returns Bn result
         */
        sub: function (y) {
            return new Bn(sub(this.bigint, y.bigint));
        },

        /**
         *  (x-y) mod n for bigInts x, y and n.
         *
         *  @param Bn y
         *  @param Bn n
         *  @returns Bn result
         */
        modSub: function (y, n) {
            var bn = this.sub(y).bigint;

            //  Il semble qu'il y aie un bug dans BigInt.
            //  Les soustractions ne sont pas valides (hors complément à 2).
            //  Si le résultat est négatif, on corrige la longueur.
            //  Ensuite on ajoute la valeure du modulo et on clean les bits non significatifs.
            //  Et euh... ça marche.
            if (negative(trim(bn, 0))) {
                bn = trim(add(bn, n.bigint), 0);

                if (bn.length < n.bigint.length) {
                    bn = expand(bn, n.bigint.length + 1);
                } else {
                    bn.pop();
                }
            } else {
                bn = mod(bn, n.bigint); //  Si positif, modulo normal.
            }

            return new Bn(bn);
        },

        /**
         *  string form of bigInt x in a given base, with 2 <= base <= 95
         *
         *  @param integer base defaults to 16
         *  @param integer pad left pad result with 0. Expected length in bit
         *  @returns string result
         */
        toString: function (base, pad) {
            var str = bigInt2str(this.bigint, base || 16).toLowerCase();

            if (pad) {
                pad = Math.ceil(pad / (base / 4));

                if (str.length < pad) {
                    str = String(pad_str + str).slice(pad * -1);
                }
            }

            return str;
        }
    };

    /**
     *  Créer un nouvel objet Bn.
     *
     *  @param it L'origine du nombre.
     *  @param integer base La base, pour les strings.
     *  @returns Bn L'objet nouvellement créé.
     */
    Bn.create = function (it, base) {
        return new Bn(it, base);
    };

    /**
     *  return an n-bit random BigInt (n>=1).  If s=1, then the most significant of those n bits is set to 1.
     *
     *  @param integer n
     *  @param boolean s
     *  @returns Bn result
     */
    Bn.rand = function (n, s) {
        if (s === undefined) {
            s = 1;
        }

        return new Bn(randBigInt(n, s));
    };

    return Bn;
});
