import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { IADSApiBootstrapResponse, IBootstrapPayload, ICSRFResponse } from '../../../_api/accounts/types';
import { ApiTargets } from '../../../_api/models';
import { Service } from '../service';
import { resolveApiBaseUrl } from '../utils';

export class AccountService extends Service {
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

  async bootstrap(): Promise<Result<IADSApiBootstrapResponse, Error | AxiosError>> {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: ApiTargets.BOOTSTRAP,
      baseURL: resolveApiBaseUrl(),
    };

    return await new Promise((resolve) => {
      // use the service directly, to get around overriding `this.request`
      const service = this.getAxiosInstance();

      service.request<IBootstrapPayload, IADSApiBootstrapResponse>(config).then(
        (response) => resolve(ok(response)),
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }
}
