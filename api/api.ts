import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import 'axios-debug-log';
import { Request } from 'express';
import { PathLike } from 'fs';
import { IncomingMessage } from 'http';
import { NextPageContext } from 'next';
import qs from 'qs';
import { IIncomingMessageWithSession } from 'server/apiMiddleware';

const config = {
  baseURL: process.env.NEXT_PUBLIC_API_HOST,
  withCredentials: true,
  paramsSerializer: (params: PathLike) =>
    qs.stringify(params, { indices: false }),
  timeout: 30000,
  headers: {
    common: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
};

class Api {
  private api: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.api = axios.create(config);
  }

  public async request<T = any, R = AxiosResponse<T>>(
    ctx: NextPageContext | { req: IncomingMessage | Request } | null,
    config: AxiosRequestConfig
  ): Promise<R> {
    const { req } = <{ req?: IIncomingMessageWithSession }>ctx;
    if (req) {
      if (req.session) {
        const { user } = req.session;
        if (user) {
          config.headers = {
            cookie: req.headers.cookie ? req.headers.cookie : '',
            ...(config.headers || {}),
            Authorization: `Bearer:${user?.access_token}`,
          };
        }
      }
    }
    return this.api.request(config);
  }
}

export default new Api(config);
