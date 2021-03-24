import { ApiTargets } from '../models';
import { Service } from '../service';
import { IADSApiBootstrapData, IADSApiBootstrapResponse } from './types';

export class AccountsService extends Service {
  async bootstrap(): Promise<IADSApiBootstrapData> {
    console.trace('bootstrapping');
    const { access_token, expire_in, anonymous, username } = await this.request<
      IADSApiBootstrapResponse
    >({
      method: 'get',
      url: ApiTargets.BOOTSTRAP,
    });

    return { access_token, expire_in, anonymous, username };
  }
}
