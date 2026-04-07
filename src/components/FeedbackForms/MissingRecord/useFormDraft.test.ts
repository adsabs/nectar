import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useFormDraft } from './useFormDraft';
import { FormValues } from './types';

const DRAFT_KEY = 'feedback-draft:new-record';

const defaultValues: FormValues = {
  name: '',
  email: '',
  isNew: true,
  bibcode: '',
  collection: [],
  title: '',
  noAuthors: false,
  authors: [],
  publication: '',
  pubDate: '',
  urls: [],
  abstract: '',
  keywords: [],
  references: [],
  comments: '',
};

function setup(existingDraft?: Partial<FormValues>) {
  if (existingDraft) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...defaultValues, ...existingDraft }));
  }
  return renderHook(() => {
    const methods = useForm<FormValues>({ defaultValues });
    const draft = useFormDraft(DRAFT_KEY, methods);
    return { methods, draft };
  });
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('useFormDraft', () => {
  test('hasDraft is false when no draft saved', () => {
    const { result } = setup();
    expect(result.current.draft.hasDraft).toBe(false);
  });

  test('hasDraft is true when draft exists in localStorage on mount', () => {
    const { result } = setup({ name: 'Alice' });
    expect(result.current.draft.hasDraft).toBe(true);
  });

  test('clearDraft removes localStorage entry and sets hasDraft false', () => {
    const { result } = setup({ name: 'Alice' });
    act(() => result.current.draft.clearDraft());
    expect(result.current.draft.hasDraft).toBe(false);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  test('getDraftValues returns parsed draft when one exists', () => {
    const { result } = setup({ name: 'Alice', title: 'My Paper' });
    const values = result.current.draft.getDraftValues();
    expect(values?.name).toBe('Alice');
    expect(values?.title).toBe('My Paper');
  });

  test('getDraftValues returns null when no draft', () => {
    const { result } = setup();
    expect(result.current.draft.getDraftValues()).toBeNull();
  });

  test('saveDraft writes to localStorage and sets hasDraft true', () => {
    const { result } = setup();
    act(() => result.current.draft.saveDraft({ ...defaultValues, name: 'Bob', title: 'Test' }));
    const stored = JSON.parse(localStorage.getItem(DRAFT_KEY)!) as FormValues;
    expect(stored.name).toBe('Bob');
    expect(stored.title).toBe('Test');
    expect(result.current.draft.hasDraft).toBe(true);
  });

  test('key=null disables draft entirely — no reads or writes', () => {
    const { result } = renderHook(() => {
      const methods = useForm<FormValues>({ defaultValues });
      const draft = useFormDraft(null, methods);
      return { methods, draft };
    });
    expect(result.current.draft.hasDraft).toBe(false);
    expect(result.current.draft.getDraftValues()).toBeNull();
    act(() => result.current.draft.saveDraft({ ...defaultValues, name: 'Ghost' }));
    expect(result.current.draft.hasDraft).toBe(false);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  test('getDraftValues returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem(DRAFT_KEY, 'not-valid-json');
    const { result } = setup();
    expect(result.current.draft.getDraftValues()).toBeNull();
  });
});
