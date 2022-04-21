import { server } from '@mocks/server';
import { setGlobalConfig } from '@storybook/testing-react';
import '@testing-library/jest-dom';
import * as globalStorybookConfig from './.storybook/preview';

setGlobalConfig(globalStorybookConfig);

// start mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
