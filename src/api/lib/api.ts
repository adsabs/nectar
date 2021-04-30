import axios from 'axios';
import { err, ok, Result } from 'neverthrow';
import { IADSApiBootstrapData } from './bootstrap/types';
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

  public static bootstrap(
    config: IServiceConfig = {},
  ): Promise<Result<IADSApiBootstrapData, Error>> {
    return new Promise((resolve) => {
      axios
        .create({ ...config, baseURL: process.env.NEXT_PUBLIC_API_HOST })
        .request<IADSApiBootstrapData>({
          method: 'get',
          url: ApiTargets.BOOTSTRAP,
        })
        .then(
          (response) => {
            const {
              access_token,
              expire_in,
              anonymous,
              username,
            } = response.data;
            resolve(ok({ access_token, expire_in, anonymous, username }));
          },
          (e) => resolve(err(e)),
        );
    });
  }
}
