import { render } from '@test-utils';
import { describe, it } from 'vitest';
import { Default as TextInput } from '../__stories__/TextInput.stories';

describe('TextInput', () => {
  it('renders without crashing', () => {
    render(<TextInput />);
  });
});
