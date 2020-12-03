import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import NumFound from '../numfound';
expect.extend(toHaveNoViolations);

test('renders correctly with no props', async () => {
  const { container } = render(<NumFound />);
  expect(container).toMatchSnapshot();
  expect(container).toHaveTextContent('Your search returned 0 results');
});

test('renders correctly with prop', async () => {
  const { container } = render(<NumFound numFound={10} />);
  expect(container).toHaveTextContent('Your search returned 10 results');
});

test('Has no accessibility violations', async () => {
  render(<NumFound />);
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
});
