import { useCallback, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { UseFormReturn } from 'react-hook-form';
import { isBrowser } from '@/utils/common/guards';
import { FormValues } from './types';

function readDraft(key: string): FormValues | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as FormValues) : null;
  } catch {
    return null;
  }
}

export interface FormDraft {
  hasDraft: boolean;
  getDraftValues: () => FormValues | null;
  saveDraft: (values: FormValues) => void;
  clearDraft: () => void;
  cancelPendingSave: () => void;
}

export function useFormDraft(key: string | null, formMethods: UseFormReturn<FormValues>): FormDraft {
  const [hasDraft, setHasDraft] = useState(() => key !== null && readDraft(key) !== null);

  const saveDraft = useCallback(
    (values: FormValues) => {
      if (key === null || !isBrowser()) {
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(values));
        setHasDraft(true);
      } catch {
        // Storage write failures are non-fatal; form continues without draft persistence.
      }
    },
    [key],
  );

  const debouncedSave = useDebouncedCallback(saveDraft, 500);

  const clearDraft = useCallback(() => {
    if (key === null || !isBrowser()) {
      return;
    }
    debouncedSave.cancel();
    try {
      localStorage.removeItem(key);
    } catch {
      // Best-effort; storage may be unavailable.
    }
    setHasDraft(false);
  }, [key, debouncedSave]);

  const cancelPendingSave = useCallback(() => {
    debouncedSave.cancel();
  }, [debouncedSave]);

  const getDraftValues = useCallback((): FormValues | null => (key !== null ? readDraft(key) : null), [key]);

  // Auto-save on watch changes — only when the form is dirty (user has made edits).
  // Gating on isDirty prevents reset() calls from overwriting a valid saved draft.
  useEffect(() => {
    if (key === null) {
      return;
    }
    const subscription = formMethods.watch((values) => {
      if (!formMethods.formState.isDirty) {
        return;
      }
      debouncedSave(values as FormValues);
    });
    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
    // formMethods is stable for the lifetime of a given form instance; exclude from deps
    // to avoid tearing down and re-creating the watch subscription on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, debouncedSave]);

  return { hasDraft, getDraftValues, saveDraft, clearDraft, cancelPendingSave };
}
