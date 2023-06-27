// @ts-ignore - package srp-bigint is not typed
import {default as srpBInt} from 'srp-bigint';

export const params = srpBInt.params;

/**
 *  @property {number} defaultStrength Default level security.
 */
const defaultStrength = 1024;

/**
 *  @property {number}  baseSize Size of the key.
 */
const baseSize = 384;

/**
 *  @property {number} hashSize Size of the hash.
 */
// const hashSize = 160

export class Client {
  private readonly c: srpBInt.Client;
  _private: {
    x_num: BigInt;
    k_num: BigInt;
  };

  /**
   *
   * @param {Object} params
   * @param {Buffer} salt
   * @param {Buffer} identity
   * @param {Buffer} password
   * @param {Buffer} secrect1
   */
  constructor(
    params: any,
    salt: Buffer,
    identity: Buffer,
    password: Buffer,
    secrect1: Buffer
  ) {
    this.c = new srpBInt.Client(params, salt, identity, password, secrect1);
    this._private = {
      x_num: this.c._private.x_num,
      k_num: this.c._private.k_num,
    };
  }

  /**
   *
   * @returns {Buffer}
   */
  getA(): Buffer {
    return this.c.computeA();
  }

  /**
   * @returns string
   */
  getAString(): string {
    return this.getA().toString('hex');
  }

  /**
   * @param {Buffer} B
   */
  setB(B: Buffer): void {
    this.c.setB(B);
  }

  /**
   * @returns {Buffer}
   */
  getM1(): Buffer {
    return this.c.computeM1();
  }

  /**
   * @return {string}
   */
  getM1String(): string {
    return this.getM1().toString('hex');
  }

  /**
   * @return {Buffer}
   */
  getK(): Buffer {
    return this.c.computeK();
  }

  /**
   * @return {string}
   */
  getKString(): string {
    return this.getK().toString('hex');
  }

  /**
   * @param M2
   */
  checkM2(M2: Buffer): Buffer {
    return this.c.checkM2(M2);
  }
}

export class Server {
  private readonly s: srpBInt.Server;

  /**
   * @param {Object} params
   * @param {Buffer} verifier
   * @param {Buffer} secret2
   */
  constructor(params: any, verifier: Buffer, secret2: Buffer) {
    this.s = new srpBInt.Server(params, verifier, secret2);
  }

  /**
   * @returns {Buffer}
   */
  getB(): Buffer {
    return this.s.computeB();
  }

  getBString(): string {
    return this.getB().toString('hex');
  }

  setA(A: Buffer): void {
    this.s.setA(A);
  }

  /**
   * @return {Buffer}
   */
  getK(): Buffer {
    return this.s.computeK();
  }

  /**
   * @return {string}
   */
  getKString(): string {
    return this.getK().toString('hex');
  }

  /**
   * @param {Buffer} M1
   * @return {Buffer} M2
   */
  checkM1(M1: Buffer): Buffer {
    return this.s.checkM1(M1);
  }
}

export class Srp {
  /** @type {Buffer} username */
  identity;

  /** @type {Buffer} password */
  password;

  /** @type {number} strength */
  strength;

  /** @type{Buffer} salt */
  salt;

  params;
  g;
  n;
  // k;

  constructor(
    identity = '',
    password = '',
    salt = '',
    strength = defaultStrength
  ) {
    this.identity = Buffer.from(identity);
    this.password = Buffer.from(password);
    this.strength = strength;
    this.params = srpBInt.params[strength];
    this.salt = Buffer.from(salt, 'hex');
    this.g = this.params.g;
    this.n = this.params.n;
  }

  /**
   *
   * @return {Promise<Client>}
   */
  async getClient(): Promise<Client> {
    const secret1 = await srpBInt.genKey(32);

    return new Client(
      this.params,
      this.salt,
      this.identity,
      this.password,
      secret1
    );
  }

  /**
   *
   * @returns {Promise<Server>}
   */
  async getServer(): Promise<Server> {
    const secret2 = await srpBInt.genKey(baseSize);
    const verifier = srpBInt.computeVerifier(
      this.params,
      this.salt,
      this.identity,
      this.password
    );

    return new Server(this.params, verifier, secret2);
  }

  getx(): BigInt {
    return srpBInt.getx(this.params, this.salt, this.identity, this.password);
  }

  getVerifier(params: Object, salt: Buffer, I: Buffer, P: Buffer): Buffer {
    return srpBInt.computeVerifier(params, salt, I, P);
  }
}
