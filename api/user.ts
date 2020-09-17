import { ServerResponse } from 'http';
import { NextPageContext } from 'next';
import { IIncomingMessageWithSession } from './../server/apiMiddleware';
import Api from './api';

class User {
  private ctx: NextPageContext;
  private request: IIncomingMessageWithSession;
  private response?: ServerResponse;

  constructor(ctx: NextPageContext) {
    this.ctx = ctx;
    const { req, res } = <INextPageCtxWithSession>ctx;

    this.request = req;
    this.response = res;
  }

  async login() {
    const { username, password, csrf } = this.request.body as IUserCreds;

    if (!csrf) {
      throw new Error('No CSRF token found in request body');
    }

    try {
      const { data, headers } = await Api.request(this.ctx, {
        method: 'post',
        url: '/accounts/user',
        headers: {
          'X-CSRFToken': csrf,
        },
        params: { username, password },
      });

      this.response?.setHeader('set-cookie', headers['set-cookie'][0]);
      this.request.session = null;

      console.log('LOGIN: ', { headers, data });

      // this.applySessionFromHeaders(headers, true);

      return data;
    } catch (e) {
      return e.response.data;
    }
  }

  async fetchCSRF() {
    const {
      data: { csrf },
      headers,
    } = await Api.request<{ csrf: string }>(this.ctx, {
      url: '/accounts/csrf',
      method: 'get',
    });

    this.response?.setHeader('set-cookie', headers['set-cookie'][0]);

    return csrf;
  }
}

export default User;

export interface INextPageCtxWithSession extends NextPageContext {
  req: IIncomingMessageWithSession;
}

interface IUserCreds {
  username: string;
  password: string;
  csrf: string;
}
