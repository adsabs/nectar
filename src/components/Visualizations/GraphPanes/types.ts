import { IADSApiAuthorNetworkNodeKey, IADSApiPaperNetworkNodeKey } from '@/api';

export interface IView {
  id: string;
  label: string;
  valueToUse: IADSApiPaperNetworkNodeKey | IADSApiAuthorNetworkNodeKey;
}
