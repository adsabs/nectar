import { render } from '@testing-library/react';
import { Default as SearchQueryLink } from '../__stories__/SearchQueryLink.stories';

describe('SearchQueryLink', () => {
  it('renders without crashing', () => {
    render(<SearchQueryLink />);
  });
});
