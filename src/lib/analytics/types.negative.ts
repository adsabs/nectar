import { track } from './track';

export const obsoleteEventName = () => {
  // @ts-expect-error 'citation_export' was renamed to 'export'
  track('citation_export', { export_type: 'download', export_format: 'bibtex' });
  // @ts-expect-error 'app_mode_change' was renamed to 'discipline_change'
  track('app_mode_change', { discipline: 'ASTROPHYSICS' });
  // @ts-expect-error 'author_list_open' was renamed to 'author_list_opened'
  track('author_list_open');
  // @ts-expect-error 'author_list_export' was renamed to 'author_list_exported'
  track('author_list_export');
  // @ts-expect-error 'web_vitals' was deleted
  track('web_vitals', { web_vitals_name: 'LCP' });
};

export const obsoleteParameterName = () => {
  // @ts-expect-error the 'mode' parameter was renamed to 'discipline'
  track('discipline_change', { mode: 'ASTROPHYSICS' });
};

export const missingRequiredParameter = () => {
  // @ts-expect-error 'bibcode' is required
  track('result_click', { rank: 0 });
  // @ts-expect-error 'step_id' is required on tour_cancel, nullable but not omittable
  track('tour_cancel', { tour_type: 'home' });
  // @ts-expect-error 'discipline' is required
  track('discipline_change', {});
  // @ts-expect-error an event with required parameters cannot be called bare
  track('result_click');
};

export const payloadPairedWithWrongEvent = () => {
  // @ts-expect-error a tour payload does not belong to a facet event
  track('facet_applied', { tour_type: 'home', step_id: 'welcome' });
  // @ts-expect-error an export payload does not belong to result_click
  track('result_click', { export_type: 'download', export_format: 'bibtex' });
  // @ts-expect-error an event taking no parameters rejects a payload
  track('author_list_opened', { bibcode: '2020ApJ...900L..21F' });
};

export const misspelledOptionalKeyInlineLiteral = () => {
  track('full_text_click', {
    source_name: 'Publisher',
    is_open_access: true,
    bibcode: '2020ApJ...900L..21F',
    // @ts-expect-error 'ranking' is not a parameter of full_text_click
    ranking: 3,
  });
};

export const misspelledOptionalKeyViaVariable = () => {
  const payload = {
    source_name: 'Publisher',
    is_open_access: true,
    bibcode: '2020ApJ...900L..21F',
    ranking: 3,
  };
  // @ts-expect-error excess keys are rejected even when the payload is not a fresh literal
  track('full_text_click', payload);
};

export const wrongParameterType = () => {
  // @ts-expect-error 'rank' is a number
  track('result_click', { rank: '0', bibcode: '2020ApJ...900L..21F' });
};

export const misspelledNestedKey = () => {
  track('view_item', {
    ecommerce: {
      items: [
        {
          item_id: '2020ApJ...900L..21F',
          item_name: 'A Galaxy',
          quantity: 1,
          // @ts-expect-error 'item_catagory' is not a parameter of the view_item item shape
          item_catagory: 'astronomy',
        },
      ],
    },
  });
};

export const retiredNestedKey = () => {
  track('view_item', {
    ecommerce: {
      // @ts-expect-error 'value' was dropped from view_item
      value: 0,
      // @ts-expect-error 'currency' was dropped from view_item
      currency: 'USD',
      items: [{ item_id: 'X', item_name: 'X', quantity: 1 }],
    },
  });
};

export const misspelledNestedKeyViaVariable = () => {
  const items = [{ item_id: 'X', item_name: 'X', quantity: 1, item_catagory: 'astronomy' }];
  // @ts-expect-error excess nested keys are rejected via a variable-held payload too
  track('view_item', { ecommerce: { items } });
};
