import { render } from '@testing-library/react';
import { Default as DataDownloader } from '../__stories__/DataDownloader.stories';

describe('DataDownloader', () => {
  it('renders without crashing', () => {
    render(<DataDownloader />);
  });
});
