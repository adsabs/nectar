import { Static, Type as T } from '@fastify/type-provider-typebox';

import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity } from '../../client/src/api';

export const bootstrapResponseSchema = T.Object({
  username: T.String(),
  scopes: T.Array(T.String()),
  client_id: T.String(),
  access_token: T.String(),
  client_name: T.String(),
  token_type: T.String(),
  ratelimit: T.Number(),
  anonymous: T.Boolean(),
  client_secret: T.String(),
  expires_at: T.String(),
  refresh_token: T.String(),
  individual_ratelimits: T.Optional(T.Number()),
  given_name: T.Optional(T.String()),
  family_name: T.Optional(T.String()),
});

export type BootstrapResponse = Static<typeof bootstrapResponseSchema>;

export const loginPayloadSchema = T.Object({
  credentials: T.Object({
    email: T.String(),
    password: T.String(),
  }),
  csrf: T.String(),
});

export type LoginPayload = Static<typeof loginPayloadSchema>;

export const loginResponseSchema = T.Object({
  api: T.Object({
    token: T.String(),
  }),
  user: T.Object({
    name: T.String(),
    settings: T.Unknown(),
    isAnonymous: T.Boolean(),
  }),
});

export type LoginResponse = Static<typeof loginResponseSchema>;

export const loginErrorResponseSchema = T.Object({
  errorKey: T.Union([
    T.Literal('csrf-invalid'),
    T.Literal('login-error'),
    T.Literal('login-error-bootstrap'),
    T.Literal('login-error-user-data'),
    T.Literal('login-error-unexpected'),
  ]),
  friendlyMessage: T.String(),
  actualError: T.Optional(T.String()),
});

export type LoginErrorResponse = Static<typeof loginErrorResponseSchema>;

export const apiLoginResponseSchema = T.Object({
  message: T.Optional(T.String()),
  error: T.Optional(T.String()),
});

export type APILoginResponse = Static<typeof apiLoginResponseSchema>;

export const csrfResponseSchema = T.Object({
  csrf: T.String(),
});

export type CSRFResponse = Static<typeof csrfResponseSchema>;

export const userSchema = T.Object({
  expire: T.String(),
  token: T.String(),
  name: T.String(),
  anonymous: T.Boolean(),
});

export type ScixUser = Static<typeof userSchema>;

export const sessionSchema = T.Object({
  user: userSchema,
  externalSession: T.Optional(T.String()),
});
export type ScixSession = Static<typeof sessionSchema>;

export const sessionResponseSchema = T.Object({
  user: userSchema,
});

export const sessionErrorResponseSchema = T.Object({
  friendlyMessage: T.String(),
  actualError: T.String(),
});

export const searchParamsSchema = T.Object({
  q: T.String({ default: '*:*' }),
  sort: T.Optional(T.Array(T.String(), { default: ['score desc', 'date desc'] })),
  p: T.Optional(T.Number({ default: 1 })),
  n: T.Optional(T.Number({ default: 10 })),
  facet: T.Optional(T.Boolean()),
  fl: T.Optional(T.String()),
  fq: T.Optional(T.String()),
});

export type NectarUserData = Static<typeof sessionResponseSchema>;
export type NectarSessionErrorResponse = Static<typeof sessionErrorResponseSchema>;

export type CommonError = {
  statusCode: number;
  errorMsg: string;
  friendlyMessage: string;
};

export type DetailsResponse = {
  doc?: IDocsEntity;
  query?: IADSApiSearchParams;
  error: null;
};

export type SearchResponse = {
  response?: IADSApiSearchResponse;
  query: IADSApiSearchParams;
  error: CommonError;
};
