import { IADSApiAuthorNetworkNodeKey, IADSApiPaperNetworkNodeKey } from '@/api/vis/types';

export interface IView {
  id: string;
  label: string;
  valueToUse: IADSApiPaperNetworkNodeKey | IADSApiAuthorNetworkNodeKey;
}
