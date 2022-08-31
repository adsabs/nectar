import { ITagItem } from '@components/Tags';
import { render } from '@testing-library/react';
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

const handleRemove = (item: ITagItem) => {
  console.log('Remove ', item.label);
};

const handleClear = () => {
  console.log('clear');
};

describe('Tags', () => {
  it('renders without crashing', () => {
    render(<Tags tagItems={tagItems} onRemove={handleRemove} onClear={handleClear} />);
  });
});
