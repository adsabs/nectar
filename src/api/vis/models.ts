import { Bibcode } from '@api/search';
import { IADSApiVisParams } from './types';

export const getAuthorNetworkParams = (bibcodes: Bibcode[]): IADSApiVisParams => ({
  bibcodes,
});
