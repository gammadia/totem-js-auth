import fetch from 'node-fetch';
import {Client, Server, Srp} from './srp';
import Base64 from 'crypto-js/enc-base64';
import Hex from 'crypto-js/enc-hex';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import * as buffer from 'buffer';
import {Otp} from './otp';
import assert from 'assert';
import * as querystring from 'querystring';

const storeKey = 'tipi_session';
const pingIntervalTime = 60 * 1000;
const apiVersion = '~2';
const authScheme = 'TIPI-TOKEN';

export interface SessionConfig {
  logout_url: string;
  timeout: number;
  tipi_url: string;
  namespace: string;
}

export class Session {
  private _pingInterval = 0;
  private _generator: Otp | null = null;
  private _heartbeat = 0;
  private _sessId = 0;
  private _key: Buffer | undefined;
  private _namespace = '';
  private _password = '';
  private _identity = '';
  private _srp: Srp;
  private _promise: Promise<{[name: string]: Function}>;
  private _resolve: Function | undefined;
  private _reject: Function | undefined;
  private _config: SessionConfig;

  private _cli: Client | undefined;
  private _ser: Server | undefined;

  constructor(config: SessionConfig) {
    this._config = config;
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    this._srp = new Srp(this._identity, this._password);

    if (typeof window !== 'undefined') {
      const sess = JSON.parse(localStorage.getItem(storeKey) || '{}');

      if (sess) {
        this._identity = sess.identity || null;
        this._key = sess.key || null;
        this._sessId = sess.sess_id || null;
        this._heartbeat = sess.heartbeat || null;

        if (this.isValid()) {
          this.startPing(true);
        }
      }
    }
  }

  async makeRequest(clear = false): Promise<any> {
    const body = await this.getRequest(clear);

    return new Promise((resolve, reject) => {
      fetch(this._config.tipi_url + 'session/login', {
        method: 'POST',
        headers: {
          'Accept-Version': apiVersion,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
        .then(async response => {
          if (response.ok) {
            resolve(this.getResponseHandler());
          } else {
            let result: any = null;
            switch (response.status) {
              case 422:
                response.json().then(r => (result = r));
                if (
                  result &&
                  result.error === 'partial_user' &&
                  result.clear === true
                ) {
                  return await this.makeRequest(true);
                }
                break;
              case 0:
                reject('no_con');
                break;
              case 404:
                reject('password');
                break;
              case 403:
                response.json().then(r => (result = r));
                if (result.error === 'partial_user_failure') {
                  reject('password');
                }
                break;
              default:
                reject('unknown');
            }
          }
        })
        .catch(error => {
          console.error(error);

          reject('unknown');
        });
    });
  }

  async getRequest(clear = false): Promise<any> {
    const c = await this._srp.getClient();

    const request = {
      username: this._identity,
      namespace: this._namespace,
      A: c.getAString(),
      clear: '',
    };

    if (clear) {
      request.clear = this._password;
    }

    return request;
  }

  getResponseHandler() {
    this._assertSrp(this._srp);

    (async () => {
      await new Promise((resolve, reject) => {
        this._srp.getClient().then(client => {
          this._cli = client;
        });
      });
    })();

    const fn = async (data: any) => {
      if (this._cli && data.B !== undefined && data.s !== undefined) {
        this._cli.setB(data.B);
        this._key = this._cli.getK();

        await this._validateKey();
      } else {
        this._reject && this._reject();
      }
    };

    return (data: any) => {
      fn.apply(this, [data])?.then(r => r);
    };
  }

  async _validateKey() {
    this._assertClient();

    fetch(this._config.tipi_url + 'session/login', {
      method: 'POST',
      body: JSON.stringify({
        M1: this._cli!.getM1String(),
      }),
    })
      .then(async response => {
        switch (response.status) {
          case 400:
            this._reject && this._reject('password');
            break;
          case 404:
            this._reject && this._reject();
        }

        return await response.json();
      })
      .then(data => {
        this._srp.getServer().then(s => {
          if (data.k && data.k === s?.getK()) {
            this._sessionSuccess(data.sess_id);
          } else {
            this._reject && this._reject('password');
          }
        });
      });
  }

  /**
   * @param {number} id
   */
  _sessionSuccess(id: number) {
    this._assertClient();

    this._key = this._cli!.getK();
    this._sessId = id;

    this.touch();
    this.persist();
    this.startPing(false);

    this._resolve && this._resolve();
  }

  persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        storeKey,
        JSON.stringify({
          identity: this._identity,
          key: this._key,
          sess_id: this._sessId,
          heartbeat: this._heartbeat,
        })
      );
    }
  }

  getOtpGenerator(): Otp {
    if (!this._generator) {
      this._generator = new Otp(this._key!.toString('hex'), this._config.tipi_url + 'time');
    }

    return this._generator;
  }

  isValid(): boolean {
    const valid =
      this._heartbeat + this._config.timeout >
      Math.floor(new Date().getTime() / 1000);

    if (!valid || !this._sessId) {
      this.destroy();
    }

    return true;
  }

  touch(): void {
    this._heartbeat = Math.floor(new Date().getTime() / 1000);
  }

  startPing(immediate: boolean): void {
    if (immediate) {
      this.ping();
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (this._pingInterval !== null) {
      window.clearInterval(this._pingInterval);
    }

    this._pingInterval = window.setInterval(() => {
      this.ping();
    }, pingIntervalTime);
  }

  getToken(callback: {(token: any): any; (arg0: string | null): any}): any {
    if (!this.isValid() || this.getOtpGenerator() === null) {
      return callback(null);
    }

    this._generator!.getCode(false, (code: any) => {
      if (!this.isValid()) {
        return callback(null);
      }

      let token = authScheme + ' sessid="';
      token += Base64.stringify(Hex.parse(this._sessId?.toString() || ''));
      token += '", sign="';
      token += Base64.stringify(
        hmacSHA256(this._sessId?.toString() || '', code)
      );
      token += '"';

      return callback(token);
    });
  }

  getStaticToken(subject: any) {
    subject = subject.match(/.+\/\?|.+\?|.+/)[0].replace(/\/\?|\?/, '');

    return Base64.stringify(
      hmacSHA256(window.encodeURI(subject), this._key!.toString('hex'))
    );
  }

  authentify(opt: any, callback: any): any {
    this.getToken(token => {
      if (token !== null) {
        return callback(null);
      }

      const options = opt !== null ? opt : {headers: {}};
      options.headers = opt.headers ?? {};
      options.headers.Authorization = token;
      options.headers['Accept-Version'] = apiVersion;

      return callback(options);
    });
  }

  authentifyUrl(url: string): string {
    const query = querystring.stringify({
      sessid: CryptoJS.enc.Base64.stringify(
        CryptoJS.enc.Hex.parse(this._sessId.toString())
      ),
      token: this.getStaticToken(url),
    });
    url += (url.indexOf('?') !== -1 ? '&' : '?') + query;

    return url;
  }

  ping(callback?: any): void {
    this.authentify(
      {
        type: 'POST',
        data: {
          timestamp: undefined, //this.getOtpGenerator().getTime(),
        },
      },
      (options: any) => {
        fetch(this._config.tipi_url + 'session/ping', options)
          .then((data: any) => {
            if (data.success) {
              this.touch();
              this.persist();
            } else {
              this.destroy();
            }

            if (callback) {
              return callback();
            }
          })
          .catch((err: {status: number}) => {
            if (err.status === 404) {
              this.destroy();
            }

            if (callback) {
              return callback();
            }
          });
      }
    );
  }

  logout() {
    this.authentify(
      {
        type: 'POST',
      },
      (options: any) => {
        fetch(this._config.tipi_url + 'session/logout', options).then(r =>
          this.destroy()
        );
      }
    );
  }

  reset(): void {
    // this._user = '';
    this._key = buffer.Buffer.from('');
    this._sessId = 0;
    this._heartbeat = 0;
    this._generator = null;
  }

  destroy(): void {
    if (this._pingInterval) {
      window.clearInterval(this._pingInterval);
    }

    this.reset();

    if (this._config.logout_url) {
      fetch(this._config.logout_url).then(() => {
        window.location.reload();
      });
    }

    this.persist();
  }

  async login(
    username: string,
    password: string,
    namespace: string = this._config.namespace
  ): Promise<any> {
    this._identity = username;
    this._password = password;
    this._namespace = namespace;
    this._identity = this._identity.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '');

    this.reset();

    try {
      return await this.makeRequest();
    } catch (err) {
      console.log(err);
    }
  }

  getUserData(namespace: string) {
    return new Promise((resolve, reject) => {
      if (!namespace) {
        reject(new Error('No namespace'));
      }

      this.authentify({}, (options: any) => {
        fetch(this._config.tipi_url + 'users/data/' + namespace, options)
          .then((data: any) => {
            resolve(data);
          })
          .catch((err: any) => {
            reject(err);
          });
      });
    });
  }

  setUserData(namespace: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!namespace) {
        reject(new Error('No namespace'));
      }

      this.authentify({}, (options: any) => {
        options.data = JSON.stringify(data);
        options.contentType = 'application/json';
        options.type = 'PUT';

        fetch(this._config.tipi_url + 'users/data/' + namespace, options)
          .then((data: any) => {
            resolve(data);
          })
          .catch((err: any) => {
            reject(err);
          });
      });
    });
  }

  _assertSrp(arg: Srp) {
    assert(arg !== null, 'SRP object is required');
  }

  _assertClient() {
    assert(this._cli !== null, 'Client is required');
  }
}
