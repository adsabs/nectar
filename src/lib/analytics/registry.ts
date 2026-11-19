import type { ParamDescriptor } from './types';

export const EVENT_REGISTRY = {
  abstract_tab_view: {
    params: {
      tab: { type: 'string', required: true, nullable: false },
      bibcode: { type: 'string', required: true, nullable: false },
    },
  },
  author_list_exported: {
    params: {},
  },
  author_list_opened: {
    params: {},
  },
  discipline_change: {
    params: {
      discipline: { type: 'string', required: true, nullable: false },
    },
  },
  export: {
    params: {
      export_type: { type: 'string', required: true, nullable: false },
      export_format: { type: 'string', required: true, nullable: false },
    },
  },
  facet_applied: {
    params: {
      facet_field: { type: 'string', required: true, nullable: false },
      facet_logic: { type: 'string', required: true, nullable: false },
    },
  },
  full_text_click: {
    params: {
      source_name: { type: 'string', required: true, nullable: false },
      is_open_access: { type: 'boolean', required: true, nullable: false },
      bibcode: { type: 'string', required: true, nullable: false },
      rank: { type: 'number', required: true, nullable: true },
    },
  },
  result_click: {
    params: {
      rank: { type: 'number', required: true, nullable: false },
      bibcode: { type: 'string', required: true, nullable: false },
    },
  },
  search_example_click: {
    params: {
      search_example: { type: 'string', required: true, nullable: false },
    },
  },
  search_no_results: {
    params: {
      query: { type: 'string', required: true, nullable: false },
      query_type: { type: 'string', required: true, nullable: false },
    },
  },
  tour_cancel: {
    params: {
      tour_type: { type: 'string', required: true, nullable: false },
      step_id: { type: 'string', required: true, nullable: true },
    },
  },
  tour_complete: {
    params: {
      tour_type: { type: 'string', required: true, nullable: false },
    },
  },
  tour_start: {
    params: {
      tour_type: { type: 'string', required: true, nullable: false },
      is_mobile: { type: 'boolean', required: true, nullable: false },
    },
  },
  tour_step: {
    params: {
      tour_type: { type: 'string', required: true, nullable: false },
      step_id: { type: 'string', required: true, nullable: false },
    },
  },
  user_update: {
    params: {
      user_id: { type: 'string', required: true, nullable: true },
    },
  },
  view_item: {
    params: {
      ecommerce: {
        type: 'object',
        required: true,
        nullable: false,
        params: {
          items: {
            type: 'object[]',
            required: true,
            nullable: false,
            params: {
              item_id: { type: 'string', required: true, nullable: false },
              item_name: { type: 'string', required: true, nullable: false },
              item_brand: { type: 'string', required: false, nullable: true },
              item_category: { type: 'string', required: false, nullable: true },
              item_variant: { type: 'string', required: false, nullable: true },
              quantity: { type: 'number', required: true, nullable: false },
            },
          },
        },
      },
    },
  },
} as const satisfies Record<string, { readonly params: Readonly<Record<string, ParamDescriptor>> }>;

export const EVENT_NAMES = Object.keys(EVENT_REGISTRY) as ReadonlyArray<keyof typeof EVENT_REGISTRY>;
