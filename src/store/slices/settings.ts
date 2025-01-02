import { SearchFacetID } from '@/components/SearchFacet/types';
import { StoreSlice } from '@/store';
import { AppMode } from '@/types';
import { filter, is, pipe, propEq, uniq, without } from 'ramda';
import { IADSApiUserDataResponse } from '@/api/user/types';

export interface ISettingsState {
  settings: {
    searchFacets: {
      order: SearchFacetID[];
      state: Record<SearchFacetID, SearchFacetState>;
      open: boolean;
      ignored: SearchFacetID[];
    };
    // user: Record<string, unknown>;
    user: Partial<IADSApiUserDataResponse>;
  };
}

export interface ISettingsAction {
  // search facets
  getSearchFacetState: (id: SearchFacetID) => SearchFacetState;
  setSearchFacetState: (id: SearchFacetID, state: Partial<SearchFacetState>) => void;
  setSearchFacetOrder: (order: SearchFacetID[]) => void;
  hideSearchFacet: (id: SearchFacetID) => void;
  showSearchFacet: (id: SearchFacetID, index?: number) => void;
  toggleSearchFacetsOpen: (value?: boolean | unknown) => void;
  resetSearchFacets: () => void;
  getHiddenSearchFacets: () => SearchFacetID[];

  // user settings
  setUserSettings: (userSettings: Partial<IADSApiUserDataResponse>) => void;
  resetUserSettings: () => void;
}

type SearchFacetState = {
  hidden: boolean;
  expanded: boolean;
};

export const defaultSettings: ISettingsState['settings'] = {
  searchFacets: {
    order: [
      'author',
      'collections',
      'refereed',
      'institutions',
      'keywords',
      'publications',
      'bibgroups',
      'simbad',
      'ned',
      'data',
      'vizier',
      'pubtype',
      'planetary',
      'uat',
    ],
    state: {
      ['author']: { hidden: false, expanded: true },
      ['collections']: { hidden: false, expanded: true },
      ['refereed']: { hidden: false, expanded: true },
      ['institutions']: { hidden: false, expanded: false },
      ['keywords']: { hidden: false, expanded: false },
      ['publications']: { hidden: false, expanded: false },
      ['bibgroups']: { hidden: false, expanded: false },
      ['simbad']: { hidden: false, expanded: false },
      ['ned']: { hidden: false, expanded: false },
      ['data']: { hidden: false, expanded: false },
      ['vizier']: { hidden: false, expanded: false },
      ['pubtype']: { hidden: false, expanded: false },
      ['planetary']: { hidden: false, expanded: false },
      ['uat']: { hidden: false, expanded: false },
    },
    open: true,
    ignored: [],
  },
  user: {},
};

export const settingsSlice: StoreSlice<ISettingsState & ISettingsAction> = (set, get) => ({
  settings: defaultSettings,
  hideSearchFacet: (id) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            order: without([id], state.settings.searchFacets?.order ?? []),
            state: {
              ...state.settings.searchFacets?.state,
              [id]: { ...state.settings.searchFacets?.state[id], hidden: true },
            },
          },
        },
      }),
      false,
      'set/hideSearchFacet',
    ),
  showSearchFacet: (id, index = -1) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            order:
              index === -1
                ? uniq([...state.settings.searchFacets.order, id])
                : uniq([
                    ...state.settings.searchFacets.order.slice(0, index),
                    id,
                    ...state.settings.searchFacets.order.slice(index),
                  ]),
            state: {
              ...state.settings.searchFacets.state,
              [id]: { ...state.settings.searchFacets.state[id], hidden: false },
            },
          },
        },
      }),
      false,
      'set/showSearchFacet',
    ),
  setSearchFacetState: (id, newState) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            state: {
              ...state.settings.searchFacets.state,
              [id]: { ...state.settings.searchFacets.state[id], ...newState },
            },
          },
        },
      }),
      false,
      'settings/setSearchFacetState',
    ),
  getSearchFacetState: (id) => get().settings.searchFacets.state[id],
  setSearchFacetOrder: (order) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            order,
          },
        },
      }),
      false,
      'settings/setSearchFacetOrder',
    ),
  toggleSearchFacetsOpen: (value) =>
    set(
      (state) => ({
        settings: {
          ...state.settings,
          searchFacets: {
            ...state.settings.searchFacets,
            open: is(Boolean, value) ? value : !state.settings.searchFacets.open,
          },
        },
      }),
      false,
      'settings/toggleSearchFacetsOpen',
    ),
  resetSearchFacets: () => {
    set(
      {
        settings: {
          ...get().settings,
          searchFacets: {
            ...defaultSettings.searchFacets,
            ignored: getIgnoredSearchFacets(get().mode),
          },
        },
      },
      false,
      'settings/resetSearchFacets',
    );
  },
  getHiddenSearchFacets: () => {
    const state = get();
    return pipe(
      filter(propEq('hidden', true)),
      (v) => Object.keys(v) as SearchFacetID[],
    )(state.settings.searchFacets.state);
  },
  setUserSettings: (user) =>
    set((state) => ({ settings: { ...state.settings, user } }), false, 'settings/setUserSettings'),
  resetUserSettings: () =>
    set((state) => ({ settings: { ...state.settings, user: null } }), false, 'settings/resetUser'),
});

const getIgnoredSearchFacets = (mode: AppMode): SearchFacetID[] => {
  switch (mode) {
    case AppMode.EARTH_SCIENCE:
      return ['simbad', 'ned', 'vizier'];

    default:
      return [];
  }
};
