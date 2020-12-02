import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import NumFound from '../numfound';
expect.extend(toHaveNoViolations);

test('renders correctly', async () => {
  const { container } = render(<NumFound numFound={10} />);
  expect(container).toMatchSnapshot();
  expect(container).toHaveTextContent('Your search returned 10 results');
});

test('Has no accessibility violations', async () => {
  render(<NumFound numFound={10} />);
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
});
