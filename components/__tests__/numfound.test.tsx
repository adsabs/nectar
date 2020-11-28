import { render } from '@testing-library/react';
import React from 'react';
import NumFound from '../numfound';

test('renders correctly', async () => {
  const { container } = render(<NumFound numFound={10} />);
  expect(container).toMatchSnapshot();
  expect(container).toHaveTextContent('Your search returned 10 results');
});
