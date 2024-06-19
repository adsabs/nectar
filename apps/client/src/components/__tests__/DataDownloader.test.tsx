import { render } from '@testing-library/react';
import { afterEach, describe, test, vi } from 'vitest';
import { composeStories } from '@storybook/react';
import * as stories from '../__stories__/DataDownloader.stories';

const { Default: DataDownloader } = composeStories(stories);

const defaultURI = 'blob:http://localhost:8000/9303db9e-5b75-4d87-9aa8-804d7e59c29b';

vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => defaultURI),
});

vi.stubGlobal('open', vi.fn());

afterEach(() => {
  vi.clearAllMocks();
});

describe('DataDownloader', () => {
  test('renders without crashing', () => {
    render(
      <DataDownloader
        label={'download'}
        getFileContent={function (): string {
          return 'col1, col2, col3';
        }}
        fileName={'file.csv'}
      />,
    );
  });
});
