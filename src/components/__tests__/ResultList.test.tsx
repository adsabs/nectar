import { render } from '@testing-library/react';
import { Default as ResultList } from '../__stories__/ResultList.stories';

describe('ResultList', () => {
  it('renders without crashing', () => {
    render(<ResultList docs={[]} showActions={true}/>);
  });
});
