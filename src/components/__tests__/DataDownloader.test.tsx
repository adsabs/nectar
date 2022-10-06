import { render } from '@testing-library/react';
import { Default as DataDownloader } from '../__stories__/DataDownloader.stories';
import { describe, test } from 'vitest';

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
