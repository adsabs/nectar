import { ApiTargets } from '@api';
import { rest } from 'msw';
import orcidNameResponse from '../responses/orcid/orcid-name.json';
import orcidWorksPostResponse from '../responses/orcid/orcid-works_post.json';
import orcidWorksGetResponse from '../responses/orcid/orcid-works_get.json';
import orcidWorksPutResponse from '../responses/orcid/orcid-works_put.json';
import orcidProfileResponse from '../responses/orcid/orcid-profile_full.json';
import orcidExchangeTokenResponse from '../responses/orcid/exchangeOAuthCode.json';
import orcidPreferencesResponse from '../responses/orcid/orcid-preferences.json';
import { IOrcidProfile, IOrcidResponse } from '@api/orcid/types';
import { path } from 'ramda';
import { api } from '@mocks/mockHelpers';

const route = (key: ApiTargets, path?: string) => `*${key}${typeof path === 'string' ? path : '*'}`;
let profile: IOrcidProfile = orcidProfileResponse as IOrcidProfile;
const getId = path(['external-ids', 'external-id', '0', 'external-id-value']);
const knownEntry = profile['2022BAAS...54b.022A'];

export const orcidHandlers = [
  rest.post(route(ApiTargets.ORCID_WORKS), async (req, res, ctx) => {
    const { bulk: works } = await req.json<IOrcidResponse['addWorks']>();

    const entries = works.map(({ work }) => {
      const id = getId(work);
      return [id, { ...knownEntry, putcode: api.putcode(), identifier: id }];
    });

    profile = { ...profile, ...Object.fromEntries(entries) };

    return res(ctx.json(orcidWorksPostResponse));
  }),
  rest.delete<null, { putcode: string }>(route(ApiTargets.ORCID_WORKS, '/:putcode'), (req, res, ctx) => {
    const putcode = Number(req.params.putcode);

    let found = null;
    for (const id in profile) {
      if (profile[id]?.putcode === putcode) {
        found = id;
        break;
      }
    }
    if (found) {
      delete profile[found];
    }

    return res(ctx.json({}));
  }),
  rest.put(route(ApiTargets.ORCID_WORKS), (req, res, ctx) => res(ctx.json(orcidWorksPutResponse))),
  rest.get(route(ApiTargets.ORCID_WORKS), (req, res, ctx) => res(ctx.json(orcidWorksGetResponse))),
  rest.get(route(ApiTargets.ORCID_PROFILE), (req, res, ctx) => res(ctx.json(profile))),
  rest.get(route(ApiTargets.ORCID_NAME), (req, res, ctx) => res(ctx.json(orcidNameResponse))),
  rest.get(route(ApiTargets.ORCID_EXCHANGE_TOKEN), (req, res, ctx) => res(ctx.json(orcidExchangeTokenResponse))),
  rest.get(route(ApiTargets.ORCID_PREFERENCES), (req, res, ctx) => res(ctx.json(orcidPreferencesResponse))),

  // passes incoming preferences as response
  rest.post(route(ApiTargets.ORCID_PREFERENCES), async (req, res, ctx) => res(ctx.json(await req.json()))),
];
