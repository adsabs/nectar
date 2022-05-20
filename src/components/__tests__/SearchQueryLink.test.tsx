import { render } from '@testing-library/react';
import { Default as SearchQueryLink } from '../__stories__/SearchQueryLink.stories';

describe('SearchQueryLink', () => {
  it.skip('renders without crashing', () => {
    render(<SearchQueryLink params={{ q: '' }} />);
  });
});
