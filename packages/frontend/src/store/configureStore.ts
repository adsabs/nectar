import { createStore } from '@reduxjs/toolkit';
import { createWrapper, MakeStore } from 'next-redux-wrapper';
import rootReducer, { RootState } from './reducers';

// create a makeStore function
export const makeStore: MakeStore<RootState> = () => createStore(rootReducer);

// export an assembled wrapper
export const wrapper = createWrapper<RootState>(makeStore, { debug: true });
