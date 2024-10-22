import { IADSApiSearchParams } from '@/api/search/types';

export interface IADSVaultExecuteQueryParams {
  qid: string;
}

export interface IADSApiVaultResponse {
  qid: string;
  numfound: number;
}

export type LibraryLinkServer = {
  gif: string;
  name: string;
  link: string;
};
export type IADSApiLibraryLinkServersResponse = LibraryLinkServer[];

export type NotificationFrequency = 'daily' | 'weekly';

export type NotificationTemplate = 'arxiv' | 'authors' | 'citations' | 'keyword';

export type NotificationType = 'template' | 'query';

export interface INotification {
  active?: boolean;
  created: string;
  data?: string;
  frequency?: NotificationFrequency;
  id: number;
  name?: string;
  template?: NotificationTemplate;
  type: NotificationType;
  updated: string;
  qid?: string;
  stateful?: boolean;
  classes?: string[];
}

export type IADSApiNotificationsReponse = Omit<INotification, 'qid' | 'stateful' | 'classes'>[];

export type IADSApiNotificationParams = Pick<INotification, 'id'>;

export type IADSApiNotificationReponse = INotification[];

export type IADSApiAddNotificationParams = Omit<INotification, 'id' | 'created' | 'updated'>;

export type IADSApiAddNotificationResponse = INotification;

export type IADSApiEditNotificationParams = Pick<INotification, 'id'> & Partial<INotification>;

export type IADSApiEditNotificationResponse = INotification;

export type IADSApiDeleteNotificationParams = Pick<INotification, 'id'>;

export type IADSApiDeleteNotificationResponse = INotification;

export type IADSApiNotificationQueryParams = Pick<INotification, 'id'>;

export type IADSApiNotificationQueryResponse = IADSApiSearchParams[];
