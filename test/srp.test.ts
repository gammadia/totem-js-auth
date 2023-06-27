import {before, describe, it} from 'mocha';
import {Srp, Client, Server, params as srpParams} from '../src/srp';
import assert from 'assert';

function h(s: string) {
  return s.replace(/\s/g, '');
}

const params = srpParams[1024];
const identity = 'alice';
const I = Buffer.from(identity);
const password = 'password123';
const P = Buffer.from(password);
const salt = 'beb25379d1a8581eb5a727673a2441ee';
const s = Buffer.from('beb25379d1a8581eb5a727673a2441ee', 'hex');
const expectedX = '94b7555aabe9127cc58ccf4993db6cf84d16c124';
const expectedK = '7556aa045aef2cdd07abaf0f665c3e818913186f';
const a = Buffer.from('60975527035cf2ad1989806f0407210bc81edc04e2762a56afd529ddda2d4393', 'hex');
const b = Buffer.from('e487cb59d31ac550471e81f00f6928e01dda08e974a004f49e61f5d105284d20', 'hex');
const expectedA = h('61d5e490 f6f1b795 47b0704c 436f523d d0e560f0 c64115bb 72557ec4' +
                    '4352e890 3211c046 92272d8b 2d1a5358 a2cf1b6e 0bfcf99f 921530ec' +
                    '8e393561 79eae45e 42ba92ae aced8251 71e1e8b9 af6d9c03 e1327f44' +
                    'be087ef0 6530e69f 66615261 eef54073 ca11cf58 58f0edfd fe15efea' +
                    'b349ef5d 76988a36 72fac47b 0769447b');
const expectedB = h('bd0c6151 2c692c0c b6d041fa 01bb152d 4916a1e7 7af46ae1 05393011' +
  'baf38964 dc46a067 0dd125b9 5a981652 236f99d9 b681cbf8 7837ec99' +
  '6c6da044 53728610 d0c6ddb5 8b318885 d7d82c7f 8deb75ce 7bd4fbaa' +
  '37089e6f 9c6059f3 88838e7a 00030b33 1eb76840 910440b1 b27aaeae' +
  'eb4012b7 d7665238 a8e3fb00 4b117b58');
let _srp: Srp;
let cli: Client;
let serv: Server;
let v: Buffer;

function asHex(arg: BigInt): string {
  return arg.toString(16);
}

describe('srp.js', () => {
  before(() => {
    _srp = new Srp(identity, password, salt);

    return _srp
      .getClient()
      .then(result => {
        cli = result;
        return _srp.getServer();
      })
      .then(result => {
        serv = result;
      });
  });

  it('creates a client', () => {
    assert(cli.getAString().length > 0, 'A is not empty');
  });

  it('creates a Server', () => {
    assert(typeof serv === 'object', 'Server is an object');
  });

  it('tests equality', () => {
    const A = cli.getA();
    serv.setA(A);

    const B = serv.getB();
    cli.setB(B);

    const M1 = cli.getM1();

    const serverM2 = serv.checkM1(M1);

    // client and server agree on K
    const clientK = cli.getKString();
    const serverK = serv.getKString();

    assert(clientK === serverK, 'K is the same');

    // Expect no error return
    assert(cli.checkM2(serverM2) === undefined, 'M2 is correct');
  });

  describe('test RFC 5054', () => {
    before(() => {
      v = _srp.getVerifier(params, s, I, P);
    });

    it('x', () => {
      return _srp.getClient().then(c => {
        assert(asHex(c._private.x_num) === expectedX, 'x is correct');
      });
    });

    it('k', () => {
      return _srp.getClient().then(c => {
        assert(asHex(c._private.k_num) === expectedK, 'k is correct');
      });
    });

    it('A', () => {
      const c = new Client(params, s, I, P, a);
      assert(c.getAString() === expectedA, 'A is correct');
    });

    it('B', () => {
      const s = new Server(params, v, b);
      assert(s.getBString() === expectedB, 'B is correct');
    });
  });
});
