import { ApiTargets } from '@api';
import { rest } from 'msw';
import orcidNameResponse from '../responses/orcid/orcid-name.json';
import orcidWorksPostResponse from '../responses/orcid/orcid-works_post.json';
import orcidWorksGetResponse from '../responses/orcid/orcid-works_get.json';
import orcidWorksPutResponse from '../responses/orcid/orcid-works_put.json';
import orcidProfileResponse from '../responses/orcid/orcid-profile_full.json';
import orcidExchangeTokenResponse from '../responses/orcid/exchangeOAuthCode.json';

const route = (key: ApiTargets, path?: string) => `*${key}${typeof path === 'string' ? path : '*'}`;
export const orcidHandlers = [
  rest.post(route(ApiTargets.ORCID_WORKS), (req, res, ctx) => {
    return res(ctx.json(orcidWorksPostResponse));
  }),
  rest.put(route(ApiTargets.ORCID_WORKS), (req, res, ctx) => {
    return res(ctx.json(orcidWorksPutResponse));
  }),
  rest.get(route(ApiTargets.ORCID_WORKS), (req, res, ctx) => {
    return res(ctx.json(orcidWorksGetResponse));
  }),
  rest.get(route(ApiTargets.ORCID_PROFILE), (req, res, ctx) => {
    return res(ctx.json(orcidProfileResponse));
  }),
  rest.get(route(ApiTargets.ORCID_NAME), (req, res, ctx) => {
    return res(ctx.json(orcidNameResponse));
  }),
  rest.get(route(ApiTargets.ORCID_EXCHANGE_TOKEN), (req, res, ctx) => {
    return res(ctx.json(orcidExchangeTokenResponse));
  }),
];
