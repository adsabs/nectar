import { RouterContext } from 'next/dist/shared/lib/router-context';
import * as nextImage from 'next/image';
import { useCreateStore, StoreProvider } from '@store';
import { theme } from '@theme';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { handlers } from '@mocks/handlers';

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
  msw: {
    handlers,
  },
};

// Initialize MSW
initialize();

export const decorators = [
  (Story) => {
    return (
      <StoreProvider createStore={useCreateStore({})}>
        <Story />
      </StoreProvider>
    );
  },
  mswDecorator,
];
