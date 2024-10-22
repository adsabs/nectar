import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { rest } from 'msw';
import { omit } from 'ramda';
import allNotifications from '../responses/notifications/all-notifications.json';
import allEntities from '../responses/notifications/notification-entities.json';
import {
  IADSApiAddNotificationParams,
  IADSApiEditNotificationParams,
  IADSApiNotificationsReponse,
  INotification,
} from '@/api/vault/types';
import { ApiTargets } from '@/api/models';

const notifications = [...allNotifications] as IADSApiNotificationsReponse;

const entities = allEntities as { [key in string]: INotification };

export const notificationsHandlers = [
  rest.get(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS, '/:id'), (req, res, ctx) => {
    const id = req.params.id as string;
    return res(ctx.json([entities[id]]));
  }),

  rest.get(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS), (req, res, ctx) => {
    return res(ctx.json(notifications));
  }),

  // add
  rest.post<IADSApiAddNotificationParams, { id: string }>(
    apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS),
    (req, res, ctx) => {
      const { type, template = null, data = null, classes = [], frequency, name = 'added example' } = req.body;
      const entity: INotification = {
        id: 7,
        name,
        qid: null,
        type,
        active: true,
        stateful: false,
        frequency: type === 'query' ? frequency : template === 'arxiv' ? 'daily' : 'weekly',
        template: template,
        classes: classes,
        data: data,
        created: '2024-03-06T22:43:36.874097+00:00',
        updated: '2024-03-06T22:43:36.874097+00:00',
      };

      entities['7'] = entity;

      notifications.push(omit(['qid', 'stateful', 'classes'], entity));

      return res(ctx.json(entity));
    },
  ),

  // edit
  rest.put<IADSApiEditNotificationParams, { id: string }>(
    apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS, '/:id'),
    (req, res, ctx) => {
      const id = req.params.id;
      entities[id] = { ...entities[id], ...req.body };
      const t = notifications.find((n) => n.id === parseInt(id));
      t.data = entities[id].data;
      t.active = entities[id].active;
      t.name = entities[id].name;

      return res(ctx.json(entities[id]));
    },
  ),

  // del
  rest.delete(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS, '/:id'), (req, res, ctx) => {
    const id = req.params.id as string;
    const index = notifications.findIndex((n) => n.id === parseInt(id));
    notifications.splice(index, 1); // remove
    return res(ctx.json(notifications));
  }),

  // get queries
  rest.get(apiHandlerRoute(ApiTargets.MYADS_NOTIFICATIONS_QUERY), (req, res, ctx) => {
    return res(
      ctx.json([
        {
          q: 'star',
          sort: 'date desc',
        },
        {
          q: 'star',
          sort: 'date desc',
        },
        {
          q: 'star',
          sort: 'date desc',
        },
      ]),
    );
  }),

  rest.post(apiHandlerRoute(ApiTargets.MYADS_STORAGE_QUERY), (req, res, ctx) => {
    return res(ctx.json({ qid: '12345678', numFound: 1 }));
  }),
];
