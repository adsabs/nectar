import { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoreProvider, useCreateStore } from '../src/store/store';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../src/mocks/handlers';
import { theme } from '../src/theme';
import { MathJaxProvider } from '../src/mathjax';
import { GTMProvider } from '@elgorditosalsero/react-gtm-hook';

export const parameters = {
  chakra: { theme },
  msw: { handlers },
};

// start msw server
initialize();

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
const preview: Preview = {
  decorators: [
    (Story) => {
      return (
        <GTMProvider>
          <MathJaxProvider>
            <QueryClientProvider client={queryClient}>
              <StoreProvider createStore={useCreateStore({})}>
                <Story />
              </StoreProvider>
            </QueryClientProvider>
          </MathJaxProvider>
        </GTMProvider>
      );
    },
  ],
  loaders: [mswLoader],
};

export default preview;
