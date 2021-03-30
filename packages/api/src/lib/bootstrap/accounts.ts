import { ApiTargets } from '../models';
import { Service } from '../service';
import { IADSApiBootstrapData, IADSApiBootstrapResponse } from './types';

export class BootstrapService extends Service {
  async bootstrap(): Promise<IADSApiBootstrapData> {
    const { access_token, expire_in, anonymous, username } = await this.request<
      IADSApiBootstrapResponse
    >({
      method: 'get',
      url: ApiTargets.BOOTSTRAP,
    });
    return { access_token, expire_in, anonymous, username };
  }
}
