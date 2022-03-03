import { RouterContext } from 'next/dist/shared/lib/router-context';
import * as nextImage from 'next/image';
import { useCreateStore, StoreProvider } from '@store';
import { theme } from '@theme';

Object.defineProperty(nextImage, 'default', {
  configurable: true,
  value: (props) => <img {...props} />,
});

export const parameters = {
  nextRouter: {
    Provider: RouterContext.Provider,
  },
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  chakra: {
    theme,
  },
};

export const decorators = [
  (Story) => {
    return (
      <StoreProvider createStore={useCreateStore({})}>
        <Story />
      </StoreProvider>
    );
  },
];
