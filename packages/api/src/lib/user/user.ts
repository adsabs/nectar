import { ApiTargets } from '../models';
import { Service } from '../service';
import {
  ICSRFResponse,
  IRegisterErrorResponse,
  IRegisterParams,
  IRegisterResponse,
} from './types';

export class UserService extends Service {
  constructor() {
    super();
  }

  public async login(): Promise<unknown> {
    await new Promise((_) => _);
    return null;
  }

  public async logout(): Promise<unknown> {
    await new Promise((_) => _);
    return null;
  }

  public async register(
    params: IRegisterParams,
  ): Promise<IRegisterResponse | IRegisterErrorResponse> {
    const CSRFToken = await this.getCSRFToken();
    const data = await this.request<IRegisterResponse, IRegisterErrorResponse>({
      method: 'post',
      url: ApiTargets.REGISTER,
      headers: {
        'X-CSRFToken': CSRFToken,
      },
      params,
    });

    return data;
  }

  public async resetPassword(): Promise<unknown> {
    await new Promise((_) => _);
    return null;
  }

  private async getCSRFToken(): Promise<ICSRFResponse['csrf']> {
    try {
      const { csrf } = await this.request<ICSRFResponse>({
        method: 'get',
        url: ApiTargets.CSRF,
      });

      return csrf;
    } catch (e) {
      throw new Error(e);
    }
  }
}
