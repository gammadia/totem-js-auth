import WordArray from 'crypto-js/lib-typedarrays';
import fetch from 'node-fetch';
import Hex from "crypto-js/enc-hex";
import HmacSHA512 from "crypto-js/hmac-sha512";
import CryptoJS from 'crypto-js/core';

const /**
   *  Taille, en bit, du passe à générer.
   *
   *  @type {Number}
   */
  key_size = 96,
  /**
   *  Intérval de synchronisation du temps avec le serveur. En ms.
   *
   *  @type {Number}
   */
  time_sync_interval = 30 * 60 * 1000; // 30 min

export class Otp {
  private readonly _secret: WordArray;
  private _lastTime: number | undefined;
  private _delta = 0;
  private _syncInterval = 0;
  private _lastHash: any;
  private readonly _timeUrl: string;

  constructor(secret: string, timeUrl: string) {
    this._secret = Hex.parse(secret);
    this._timeUrl = timeUrl;
  }

  /**
   *  Synchronisation avec le serveur pour la génération des tokens.
   *
   *  @param   {String}   timeUrl URL de la resource time sur le serveur
   *  @param   {Function} callback
   */
  syncTimeWithServer(timeUrl: string, callback: Function | null) {
    const date = Date.now();

    fetch(timeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          const end = Date.now();
          const request_duration = end - date;
          return response.json().then(response => {
            const remote_expected = request_duration / 2 + date;
            this._delta = Math.round(response.time - remote_expected);
            if (callback) {
              callback();
            }
          });
        } else {
          throw new Error('Error syncing time with server.');
        }
      })
      .catch(error => {
        console.log(error);
      });

    if (!this._syncInterval) {
      if (typeof window !== 'undefined') {
        this._syncInterval = window.setInterval(() => {
          this.syncTimeWithServer(timeUrl, null);
        }, time_sync_interval);
      }
    }
  }

  getTime() {
    return Date.now() + this._delta;
  }

  /**
   *  Création du code et encodage en base64
   *
   *  @param {Boolean} raw Retourner le buffer sans conversion en base64
   *  @param {Number}  time Forcer la valeur du temps pour le code à générer
   *  @returns {String | WordArray}   Code en base64
   */
  makeCode(raw: boolean, time: number): WordArray | string {
    let hash: WordArray;

    time = time || Math.floor(this.getTime() / 30000); //  Unix timestamp / 30

    if (this._lastTime !== time) {
      hash = HmacSHA512(String(time), this._secret);

      //  Retrait des bits non significatifs
      hash.clamp();

      //  Garde seulement les [key_size] bits les moins significatifs
      hash = CryptoJS.lib.WordArray.create(
        hash.words.slice(hash.words.length - key_size / 32)
      );

      this._lastTime = time;
      this._lastHash = hash;
    } else {
      hash = this._lastHash;
    }

    return raw ? hash : hash.toString(CryptoJS.enc.Base64);
  }

  /**
   *  Création du code et encodage en base64
   *
   *  @param {Boolean} raw Retourner le buffer sans conversion en base64
   *  @param {Function} callback
   *  @returns {String | WordArray}   Code en base64
   */
  getCode(raw: boolean, callback: Function) {
    if (this._delta === null) {
      this.syncTimeWithServer(this._timeUrl, () => {
        callback(this.makeCode(raw, 0));
      });
    } else {
      callback(this.makeCode(raw, 0));
    }
  }
}
