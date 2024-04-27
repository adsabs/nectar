import { authorAffiliationsKeys, useAuthorAffiliationExport } from '@/api/author-affiliation/author-affiliation';
import { FileType, useDownloadFile } from 'src/lib';
import { mergeLeft } from 'ramda';
import { Reducer, useEffect, useReducer } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { exportTypeFileMappings, exportTypes } from './models';
import { IAuthorAffState, useAuthorAffStore } from './store';

interface IExportModalState {
  mode: 'SELECTING' | 'EXPORTING' | 'DOWNLOADING';
  type: FileType;
  format: typeof exportTypes[number];
  selected: string[];
}

const initialState: IExportModalState = {
  mode: 'SELECTING',
  type: exportTypeFileMappings[0],
  format: exportTypes[0],
  selected: [],
};

type Action =
  | { type: 'SET_FORMAT'; format: typeof exportTypes[number] }
  | { type: 'SET_SELECTED'; selected: string[] }
  | { type: 'EXPORT' }
  | { type: 'DATA' }
  | { type: 'ERROR' }
  | { type: 'DONE' };

const update = (change: Partial<IExportModalState>, state: IExportModalState) =>
  mergeLeft<typeof change, typeof state>(change, state);

const reducer: Reducer<IExportModalState, Action> = (state, action) => {
  switch (action.type) {
    case 'SET_FORMAT':
      return update(
        {
          mode: 'SELECTING',
          format: action.format,
          type: exportTypeFileMappings[exportTypes.indexOf(action.format)],
        },
        state,
      );
    case 'SET_SELECTED':
      return update({ selected: action.selected }, state);
    case 'EXPORT':
      return update({ mode: 'EXPORTING' }, state);
    case 'DATA':
      return update({ mode: 'DOWNLOADING' }, state);

    case 'DONE':
    case 'ERROR':
      return update({ mode: 'SELECTING' }, state);

    default:
      return state;
  }
};

const selectors = {
  getFormattedSelection: (state: IAuthorAffState) => state.getFormattedSelection,
};
export const useExportModal = (props: { enabled: boolean }) => {
  const { enabled } = props;
  const qc = useQueryClient();
  const getFormattedSelection = useAuthorAffStore(selectors.getFormattedSelection);
  const [state, dispatch] = useReducer(reducer, initialState);

  // update state when the hook gets enabled (i.e. modal opened up)
  useEffect(() => {
    dispatch({ type: 'SET_SELECTED', selected: getFormattedSelection() });
  }, [enabled]);

  const { data, error, isError } = useAuthorAffiliationExport(
    {
      selected: state.selected,
      format: state.format,
    },
    { enabled: state.mode === 'EXPORTING' && state.selected.length > 0 },
  );

  // if exporting, then check the cache
  useEffect(() => {
    if (state.mode === 'EXPORTING') {
      const cachedData = qc.getQueryData(
        authorAffiliationsKeys.export({
          selected: state.selected,
          format: state.format,
        }),
      );

      // if there is data in there, we can go directly to download
      if (cachedData) {
        dispatch({ type: 'DATA' });
      }
    }
  }, [data, state.selected, state.format, state.mode]);

  // update state if we receive data, or error
  useEffect(() => {
    if (error) {
      dispatch({ type: 'ERROR' });
    }
  }, [error]);

  // hook to trigger download
  const { onDownload, linkHref, filename } = useDownloadFile(data, {
    appendDate: true,
    type: state.type,
    filename: 'authoraffiliation',
    timeout: 0,
    onDownloaded: () => dispatch({ type: 'DONE' }),
  });

  // trigger download on mode change
  useEffect(() => {
    if (state.mode === 'DOWNLOADING') {
      onDownload();
    }
  }, [state.mode]);

  return {
    isLoading: state.mode === 'EXPORTING' || state.mode === 'DOWNLOADING',
    onDone: () => dispatch({ type: 'DONE' }),
    format: state.format,
    onFetch: () => dispatch({ type: 'EXPORT' }),
    onFormatChange: (format: typeof exportTypes[number]) => dispatch({ type: 'SET_FORMAT', format }),
    downloadLink: linkHref,
    downloadFilename: filename,
    isError,
    error,
    numSelected: state.selected.length,
    noData: state.selected.length === 0,
  };
};
