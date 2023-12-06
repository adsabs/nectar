import { Preview } from '@storybook/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StoreProvider, useCreateStore } from '../src/store/store';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { handlers } from '../src/mocks/handlers';
import { theme } from '../src/theme';
import { MathJaxProvider } from '../src/mathjax';
import { GTMProvider } from '@elgorditosalsero/react-gtm-hook';
import { useCreateQueryClient } from '@lib';

export const parameters = {
  chakra: { theme },
  msw: { handlers },
};

// start msw server
initialize();

const preview: Preview = {
  decorators: [
    (Story) => {
      const qc = useCreateQueryClient();
      qc.setDefaultOptions({
        queries: {
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
          retry: false,
        },
      });
      return (
        <GTMProvider>
          <MathJaxProvider>
            <QueryClientProvider client={qc}>
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
