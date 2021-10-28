import { AppRuntimeConfig } from '@types';
import axios from 'axios';
import { isPast, parseISO } from 'date-fns';
import { err, ok, Result } from 'neverthrow';
import getConfig from 'next/config';
import { isNil } from 'ramda';
import { IADSApiBootstrapResponse, IUserData } from './bootstrap/types';
import { ExportService } from './export';
import { GraphicsService } from './graphics';
import { LibrariesService } from './libraries/libraries';
import { MetricsService } from './metrics';
import { ApiTargets } from './models';
import { ReferenceService } from './reference';
import { SearchService } from './search/search';
import { IServiceConfig } from './service';
import { UserService } from './user/user';
import { VaultService } from './vault';
export class Adsapi {
  public search: SearchService;
  public libraries: LibrariesService;
  public user: UserService;
  public reference: ReferenceService;
  public vault: VaultService;
  public graphics: GraphicsService;
  public metrics: MetricsService;
  public export: ExportService;

  constructor(config?: IServiceConfig) {
    this.search = new SearchService(config);
    this.libraries = new LibrariesService(config);
    this.user = new UserService(config);
    this.reference = new ReferenceService(config);
    this.vault = new VaultService(config);
    this.graphics = new GraphicsService(config);
    this.metrics = new MetricsService(config);
    this.export = new ExportService(config);
  }

  public static bootstrap(config: IServiceConfig = {}): Promise<Result<IADSApiBootstrapResponse, Error>> {
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
          (response: IADSApiBootstrapResponse) => resolve(ok(response)),
          (e) => resolve(err(e)),
        );
    });
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
