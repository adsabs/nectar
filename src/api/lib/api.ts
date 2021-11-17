import { AccountService } from './accounts';
import { ExportService } from './export';
import { GraphicsService } from './graphics';
import { LibrariesService } from './libraries/libraries';
import { MetricsService } from './metrics';
import { ReferenceService } from './reference';
import { SearchService } from './search/search';
import { IServiceConfig } from './service';
import { VaultService } from './vault';
export class Adsapi {
  public search: SearchService;
  public libraries: LibrariesService;
  public accounts: AccountService;
  public reference: ReferenceService;
  public vault: VaultService;
  public graphics: GraphicsService;
  public metrics: MetricsService;
  public export: ExportService;

  constructor(config?: IServiceConfig) {
    this.search = new SearchService(config);
    this.libraries = new LibrariesService(config);
    this.accounts = new AccountService(config);
    this.reference = new ReferenceService(config);
    this.vault = new VaultService(config);
    this.graphics = new GraphicsService(config);
    this.metrics = new MetricsService(config);
    this.export = new ExportService(config);
  }
}
