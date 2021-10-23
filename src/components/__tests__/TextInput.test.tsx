import { render } from '@testing-library/react';
import { Default as TextInput } from '../__stories__/TextInput.stories';

describe('TextInput', () => {
  it('renders without crashing', () => {
    render(<TextInput />);
  });
});
