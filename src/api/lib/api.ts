import { AppRuntimeConfig } from '@types';
import axios from 'axios';
import { isPast, parseISO } from 'date-fns';
import { err, ok, Result } from 'neverthrow';
import getConfig from 'next/config';
import { identity, isNil } from 'ramda';
import { IUserData } from './bootstrap/types';
import { LibrariesService } from './libraries/libraries';
import { ApiTargets } from './models';
import { SearchService } from './search/search';
import { IServiceConfig } from './service';
import { UserService } from './user/user';

export class Adsapi {
  public search: SearchService;
  public libraries: LibrariesService;
  public user: UserService;

  constructor(config: IServiceConfig) {
    this.search = new SearchService(config);
    this.libraries = new LibrariesService(config);
    this.user = new UserService(config);
  }

  public static bootstrap(config: IServiceConfig = {}): Promise<Result<IUserData, Error>> {
    const { publicRuntimeConfig } = (getConfig() as AppRuntimeConfig) || {
      publicRuntimeConfig: {
        apiHost: process.env.API_HOST,
      },
    };

    return new Promise((resolve) => {
      axios
        .create({ ...config, baseURL: publicRuntimeConfig.apiHost })
        .request<IUserData>({
          method: 'get',
          url: ApiTargets.BOOTSTRAP,
        })
        .then(
          (response) => {
            const { access_token, expire_in, anonymous, username } = response.data;
            resolve(ok({ access_token, expire_in, anonymous, username }));
          },
          (e) => resolve(err(e)),
        );
    });
  }

  public static async checkOrRefreshUserData(userData?: IUserData): Promise<Result<IUserData, Error>> {
    if (this.checkUserData(userData)) {
      return ok(userData);
    }

    const result = await this.bootstrap();
    return result.map(identity).mapErr(identity);
  }

  static isValid(userData?: IUserData): userData is IUserData {
    return !isNil(userData) && typeof userData.access_token === 'string' && typeof userData.expire_in === 'string';
  }

  static isExpired(userData: IUserData): boolean {
    return isPast(parseISO(userData.expire_in));
  }

  static checkUserData(userData?: IUserData): boolean {
    return this.isValid(userData) && !this.isExpired(userData);
  }
}
