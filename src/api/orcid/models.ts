import { isNilOrEmpty, isNumber, isObject } from 'ramda-adjunct';
import { IOrcidUser } from '@/api/orcid/types';
import { allPass, has } from 'ramda';
import { addSeconds, isValid } from 'date-fns';
import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import { isString } from '@/utils/common/guards';

const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;

export const isValidOrcidId = (id: unknown): id is string => {
  return isString(id) && orcidRegex.test(id);
};

export const isValidIOrcidUser = (obj: unknown): obj is IOrcidUser => {
  const hasAllKeys = allPass([
    has('access_token'),
    has('expires_in'),
    has('name'),
    has('orcid'),
    has('refresh_token'),
    has('scope'),
    has('token_type'),
  ]);

  if (!isObject(obj) || !hasAllKeys(obj)) {
    return false;
  }

  const typedObj = obj as IOrcidUser;

  if (
    !(
      isString(typedObj.access_token) &&
      isNumber(typedObj.expires_in) &&
      isString(typedObj.name) &&
      isString(typedObj.orcid) &&
      isString(typedObj.refresh_token) &&
      isString(typedObj.scope) &&
      isString(typedObj.token_type)
    )
  ) {
    return false;
  }

  const expiresAt = addSeconds(new Date(), typedObj.expires_in);

  return isValid(expiresAt);
};

export const isOrcidProfileEntry = (entry: unknown): entry is IOrcidProfileEntry => {
  if (isNilOrEmpty(entry)) {
    return false;
  }

  const { identifier, status, title, pubyear, pubmonth, updated, putcode, source } = entry as IOrcidProfileEntry;

  return (
    typeof identifier === 'string' &&
    typeof status === 'string' &&
    (status === 'verified' || status === 'not in ADS' || status === 'pending' || status === 'rejected') &&
    typeof title === 'string' &&
    (typeof pubyear === 'string' || pubyear === null || pubmonth === undefined) &&
    (typeof pubmonth === 'string' || pubmonth === null || pubmonth === undefined) &&
    typeof updated === 'string' &&
    (typeof putcode === 'string' || typeof putcode === 'number') &&
    Array.isArray(source) &&
    source.every((item) => typeof item === 'string')
  );
};
