import { useCallback, useState } from 'react';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';
import { useStore } from '@/store';
import { AppMode, LocalSettings } from '@/types';
import { LandingFormPreference, UserDataKeys } from '@/api/user/types';

export type LandingFormKey = 'modern' | 'classic' | 'paper';

const FORM_KEY_TO_URL: Record<LandingFormKey, string> = {
  modern: '/',
  classic: '/classic-form',
  paper: '/paper-form',
};

const PREFERENCE_TO_URL: Record<string, string> = {
  [LandingFormPreference.Modern]: '/',
  [LandingFormPreference.Classic]: '/classic-form',
  [LandingFormPreference.Paper]: '/paper-form',
};

const URL_TO_FORM_KEY: Record<string, LandingFormKey> = {
  '/': 'modern',
  '/classic-form': 'classic',
  '/paper-form': 'paper',
};

interface UseLandingFormPreferenceResult {
  landingFormUrl: string;
  persistCurrentForm: (form: LandingFormKey) => void;
}

// Initialize localStorage value synchronously to avoid double-render
function getInitialLastUsedForm(): LandingFormKey | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(LocalSettings.LAST_LANDING_FORM);
  return stored && isValidFormKey(stored) ? stored : null;
}

export const useLandingFormPreference = (): UseLandingFormPreferenceResult => {
  const { isAuthenticated } = useSession();
  const { settings } = useSettings({ suspense: false }, true);
  const mode = useStore((state) => state.mode);
  const [lastUsedForm, setLastUsedForm] = useState<LandingFormKey | null>(
    getInitialLastUsedForm
  );

  const persistCurrentForm = useCallback((form: LandingFormKey) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LocalSettings.LAST_LANDING_FORM, form);
      setLastUsedForm(form);
    }
  }, []);

  const landingFormUrl = getLandingFormUrl({
    isAuthenticated,
    userPreference: settings?.[UserDataKeys.HOMEPAGE],
    lastUsedForm,
    mode,
  });

  return {
    landingFormUrl,
    persistCurrentForm,
  };
};

function isValidFormKey(value: string): value is LandingFormKey {
  return value === 'modern' || value === 'classic' || value === 'paper';
}

interface GetLandingFormUrlParams {
  isAuthenticated: boolean;
  userPreference: string | undefined;
  lastUsedForm: LandingFormKey | null;
  mode: AppMode;
}

function getLandingFormUrl({
  isAuthenticated,
  userPreference,
  lastUsedForm,
  mode,
}: GetLandingFormUrlParams): string {
  // Form tabs only exist in Astrophysics mode
  if (mode !== AppMode.ASTROPHYSICS) {
    return '/';
  }

  // For authenticated users with an explicit preference (not "Auto")
  if (isAuthenticated && userPreference && userPreference !== LandingFormPreference.Auto) {
    const url = PREFERENCE_TO_URL[userPreference];
    if (url) {
      return url;
    }
  }

  // For unauthenticated users or "Auto" preference, use localStorage
  if (lastUsedForm) {
    return FORM_KEY_TO_URL[lastUsedForm];
  }

  // Default to modern form
  return '/';
}

export { FORM_KEY_TO_URL, PREFERENCE_TO_URL, URL_TO_FORM_KEY, getLandingFormUrl };
