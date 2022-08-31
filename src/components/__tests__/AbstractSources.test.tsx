import { render } from '@test-utils';
import { describe, it } from 'vitest';
import { Default as AbstractSources } from '../__stories__/AbstractSources.stories';

describe('AbstractSources', () => {
  it('renders without crashing', () => {
    render(<AbstractSources />);
  });
});
