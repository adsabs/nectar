import { AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import { IUserData } from './types';

export class BootstrapService extends Service {
  async bootstrap(): Promise<Result<IUserData, Error>> {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: ApiTargets.BOOTSTRAP,
    };

    return await new Promise((resolve) => {
      this.request<IUserData>(config).then(
        (result) => {
          result.match(
            ({ access_token, expire_in, anonymous, username }) =>
              resolve(ok({ access_token, expire_in, anonymous, username })),
            (e) => resolve(err(e)),
          );
        },
        (e) => resolve(err(e)),
      );
    });
  }
}
