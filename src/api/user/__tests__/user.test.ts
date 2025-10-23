import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';

import api from '@/api/api';
import { fetchUserSettings, userKeys } from '@/api/user/user';
import { DEFAULT_USER_DATA } from '@/api/user/models';
import { logger } from '@/logger';

describe('fetchUserSettings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default user settings on authorization errors', async () => {
    const error = new AxiosError('Forbidden', AxiosError.ERR_BAD_RESPONSE, {}, undefined, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {
        method: 'GET',
        url: '/api/user/data',
      },
      data: {},
    });

    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    vi.spyOn(api, 'request').mockRejectedValue(error);

    const result = await fetchUserSettings({
      queryKey: userKeys.getUserSettings(),
    } as never);

    expect(result).toEqual(DEFAULT_USER_DATA);
    expect(result).not.toBe(DEFAULT_USER_DATA);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, wasFallback: true }),
      expect.any(String),
    );
  });

  it('rethrows non-authorization errors', async () => {
    const error = new AxiosError('Internal Server Error', AxiosError.ERR_BAD_RESPONSE, {}, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {
        method: 'GET',
        url: '/api/user/data',
      },
      data: {},
    });

    vi.spyOn(api, 'request').mockRejectedValue(error);

    await expect(
      fetchUserSettings({
        queryKey: userKeys.getUserSettings(),
      } as never),
    ).rejects.toThrow('Internal Server Error');
  });
});
