import { render } from '@testing-library/react';
import { noop } from '@utils';
import { describe, it } from 'vitest';
import { Default as Tags } from '../__stories__/Tags.stories';

const tagItems = [
  {
    id: 'apple',
    label: 'apple',
  },
  {
    id: 'orange',
    label: 'orange',
  },
  {
    id: 'banana',
    label: 'banana',
  },
  {
    id: 'pear',
    label: 'pear',
  },
];

const handleRemove = noop;

const handleClear = noop;

describe('Tags', () => {
  it('renders without crashing', () => {
    render(<Tags tagItems={tagItems} onRemove={handleRemove} onClear={handleClear} />);
  });
});
