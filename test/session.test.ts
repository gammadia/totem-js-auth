import assert from 'assert';
import {afterEach, before, describe, it} from 'mocha';
import sinon from 'sinon';

import {Session} from '../src';
import * as fetchModule from 'node-fetch';

const username = 'alice';
const password = 'docker';

const config = {
  logout_url: '',
  tipi_url: 'http://127.0.0.1:4000/',
  timeout: 1800, //  30 minutes
  namespace: 'unittest',
};

let session: Session;

describe('Session', () => {
  afterEach(() => {
    sinon.restore();
  });

  before(async () => {
    session = await new Session(config);
  });

  describe('create a new session', () => {
    it('should create a new session', async () => {
      assert.ok(session);
    });

    it('should login with a new session', async () => {
      sinon.stub(fetchModule, 'default').returns(Promise.resolve(new fetchModule.Response('ok', {status: 200})));

      const makeRequest = sinon.spy(session, 'makeRequest');
      const getResponseHandler = sinon.spy(session, 'getResponseHandler');

      const response = await session
        .login(username, password)
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });

      assert(response);
      assert(makeRequest.calledOnce);
      assert(getResponseHandler.calledOnce);
    });
  });
});
