import { StoreSlice } from '@store';

export type Notification = {
  id: NotificationId;
  message: string;
  status: 'success' | 'error' | 'warning' | 'info';
};

export interface INotificationState {
  notification: Notification;
  lastSeenNotification: Notification;
}

export interface INotificationAction {
  setNotification: (notification: NotificationId) => void;
  resetNotification: () => void;
}

const initialState: INotificationState = {
  notification: null,
  lastSeenNotification: null,
};

export const notificationSlice: StoreSlice<INotificationState & INotificationAction> = (set, get) => ({
  notification: initialState.notification,
  lastSeenNotification: initialState.notification,

  setNotification: (id) =>
    set(
      () => {
        return {
          notification: getNotification(id),
        };
      },
      false,
      'notification/setNotification',
    ),
  resetNotification: () =>
    set(
      { notification: initialState.notification, lastSeenNotification: get().notification },
      false,
      'notification/resetNotification',
    ),
});

export const NOTIFICATIONS: Record<NotificationId, Notification> = {
  'orcid-auth-failed': {
    id: 'orcid-auth-failed',
    status: 'error',
    message: 'There was an issue authenticating with ORCiD. Please try again later.',
  },
  'account-deleted-success': {
    id: 'account-deleted-success',
    status: 'success',
    message: 'Your account has been deleted.',
  },
  'account-logout-success': {
    id: 'account-logout-success',
    status: 'success',
    message: 'You have been logged out.',
  },
  'account-login-required': {
    id: 'account-login-required',
    status: 'warning',
    message: 'You must be logged in to view that page.',
  },
  'api-connect-failed': {
    id: 'api-connect-failed',
    status: 'error',
    message: 'There was a problem contacting the API, please reload the page and try again.',
  },
  'account-login-success': {
    id: 'account-login-success',
    status: 'success',
    message: 'You have been logged in.',
  },
  'account-login-failed': {
    id: 'account-login-failed',
    status: 'error',
    message: 'There was an issue logging in. Please check your credentials.',
  },
  'account-logout-failed': {
    id: 'account-logout-success',
    status: 'error',
    message: 'There was an issue logging out. Please try again.',
  },
  'account-register-success': {
    id: 'account-register-success',
    status: 'success',
    message: 'Your account has been created. Please check your email to verify your account.',
  },
  'verify-email-success': {
    id: 'verify-email-success',
    status: 'success',
    message: 'Your email has been verified.',
  },
  'account-reset-password-success': {
    id: 'account-reset-password-success',
    status: 'success',
    message: 'Your password has been reset.',
  },
  'verify-account-success': {
    id: 'verify-account-success',
    status: 'success',
    message: 'Your account has been verified.',
  },
  'verify-account-was-valid': {
    id: 'verify-account-was-valid',
    status: 'success',
    message: 'Your account was already verified.',
  },
  'verify-token-invalid': {
    id: 'verify-token-invalid',
    status: 'error',
    message: 'The verification token was invalid.',
  },
  'verify-account-failed': {
    id: 'verify-account-failed',
    status: 'error',
    message: 'There was an issue verifying your account. Please try again.',
  },
};

export type NotificationId =
  | 'orcid-auth-failed'
  | 'account-deleted-success'
  | 'account-logout-success'
  | 'account-login-required'
  | 'account-login-success'
  | 'account-login-failed'
  | 'account-logout-failed'
  | 'account-register-success'
  | 'verify-email-success'
  | 'account-reset-password-success'
  | 'verify-account-success'
  | 'verify-account-was-valid'
  | 'verify-token-invalid'
  | 'verify-account-failed'
  | 'api-connect-failed';

export const getNotification = (id: NotificationId) => (id in NOTIFICATIONS ? NOTIFICATIONS[id] : null);
