import { IADSApiSearchParams, useVaultBigQuerySearch } from '@api';
import { Button } from '@chakra-ui/react';
import * as Q from '@query-utils';
import { AppState, useStore } from '@store';
import { makeSearchParams, parseQueryFromUrl } from '@utils';
import { useRouter } from 'next/router';
import { Reducer, useEffect, useReducer } from 'react';

export const SecondOrderOpsLinks = () => {
  const { onLimit, onExclude } = useSecondOrderOps();

  return (
    <>
      <Button variant="link" type="button" fontWeight="normal" onClick={onLimit}>
        Limit To
      </Button>
      <Button variant="link" type="button" fontWeight="normal" onClick={onExclude}>
        Exclude
      </Button>
    </>
  );
};

const selectors = {
  docs: (state: AppState) => state.docs.selected,
};

// based on the type of docs query, create a new FQ with that value
const getQuery = (type: 'limit' | 'exclude', qid: string, query: Q.Query) => {
  const label = `selection_${type}`;
  const q = type === 'limit' ? `docs(${qid})` : `-docs(${qid})`;
  return Q.setFQ(label, q, query, { asIs: true });
};

interface State {
  enabled: boolean;
  type: 'limit' | 'exclude';
}

const initialState: State = { type: null, enabled: false };

const reducer: Reducer<State, { type: 'setType'; payload: State['type'] } | { type: 'reset' }> = (state, action) => {
  if (action.type === 'setType') {
    return { type: action.payload, enabled: true };
  } else if (action.type === 'reset') {
    return initialState;
  }

  return state;
};

const useSecondOrderOps = () => {
  const selected = useStore(selectors.docs);
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { data: res } = useVaultBigQuerySearch(selected, { enabled: state.enabled });

  useEffect(() => {
    if (res?.qid && state.type !== null) {
      // get qid from response
      const qid = res.qid;

      // parse and create new search params
      const parsedQuery = parseQueryFromUrl(router.asPath);
      const search = makeSearchParams(getQuery(state.type, qid, parsedQuery) as IADSApiSearchParams);

      // reset state, so enabled doesn't persist
      dispatch({ type: 'reset' });

      // trigger the new search
      void router.push({ pathname: '/search', search });
    }
  }, [res, state.type]);

  return {
    onLimit: () => dispatch({ type: 'setType', payload: 'limit' }),
    onExclude: () => dispatch({ type: 'setType', payload: 'exclude' }),
  };
};
