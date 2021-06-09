import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import { ICSRFResponse } from './types';

export class UserService extends Service {
  public async login(): Promise<unknown> {
    await new Promise((_) => _);
    return null;
  }

  public async logout(): Promise<unknown> {
    await new Promise((_) => _);
    return null;
  }

  // public async register(
  //   params: IRegisterParams,
  // ): Promise<IRegisterResponse> {
  //   const CSRFToken = await this.getCSRFToken();
  //   const data = await this.request<IRegisterResponse>({
  //     method: 'post',
  //     url: ApiTargets.REGISTER,
  //     headers: {
  //       'X-CSRFToken': CSRFToken,
  //     },
  //     params,
  //   });

  //   return data;
  // }

  public async resetPassword(): Promise<unknown> {
    await new Promise((_) => _);
    return null;
  }

  private async getCSRFToken(): Promise<Result<ICSRFResponse['csrf'], Error | AxiosError>> {
    const config: AxiosRequestConfig = { method: 'get', url: ApiTargets.CSRF };

    return await new Promise((resolve) => {
      this.request<ICSRFResponse>(config).then(
        (result) => {
          result.match(
            ({ csrf }) => resolve(ok(csrf)),
            (e: Error | AxiosError) => resolve(err(e)),
          );
        },
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }
}
