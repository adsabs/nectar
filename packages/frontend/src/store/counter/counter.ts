import { createSlice } from '@reduxjs/toolkit';
import keys from '../keys';
import { RootState } from '../reducers';

export type CounterState = {
  count: number;
};

const initialState: CounterState = {
  count: 0,
};

const slice = createSlice({
  name: keys.COUNTER,
  initialState,
  reducers: {
    inc: state => {
      return {
        ...state,
        count: state.count + 1,
      };
    },
    dec: state => {
      return {
        ...state,
        count: state.count - 1,
      };
    },
  },
});

export const { inc, dec } = slice.actions;

export const counterSelector = (state: RootState) => state.counter;

export const counterReducer = slice.reducer;
