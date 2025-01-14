import { orcidHandlers } from '@/mocks/handlers/orcid';
import { userHandlers } from '@/mocks/responses/user/user';
import { objectsHandlers } from '@/mocks/handlers/objects';
import { accountHandlers } from '@/mocks/handlers/accounts';
import { authorAffiliationHandlers } from '@/mocks/handlers/author-affiliation';
import { searchHandlers } from '@/mocks/handlers/search';
import { exportHandlers } from '@/mocks/handlers/export';
import { metricsHandlers } from '@/mocks/handlers/metrics';
import { graphicsHandlers } from '@/mocks/handlers/graphics';
import { referenceHandlers } from '@/mocks/handlers/reference';
import { myadsHandlers } from '@/mocks/handlers/myads';
import { bibstemHandlers } from '@/mocks/handlers/bibstems';
import { librariesHandlers } from '@/mocks/handlers/libraries';
import { notificationsHandlers } from './handlers/notifications';
import { resolverHandlers } from '@/mocks/handlers/resolver';

export const handlers = [
  ...accountHandlers,
  ...authorAffiliationHandlers,
  ...bibstemHandlers,
  ...exportHandlers,
  ...resolverHandlers,
  ...graphicsHandlers,
  ...metricsHandlers,
  ...myadsHandlers,
  ...objectsHandlers,
  ...orcidHandlers,
  ...referenceHandlers,
  ...searchHandlers,
  ...userHandlers,
  ...librariesHandlers,
  ...notificationsHandlers,
];
