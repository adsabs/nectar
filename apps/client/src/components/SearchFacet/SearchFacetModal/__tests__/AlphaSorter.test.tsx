import { render } from '@/test-utils';
import { AlphaSorter } from '@/components/SearchFacet/SearchFacetModal/AlphaSorter';
import { noop } from '@/utils';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';

test('renders without crashing', () => {
  render(<AlphaSorter letter="A" onLetterChange={noop} />);
});

test('calls the onLetterChange prop when a letter is selected', async () => {
  const onLetterChange = vi.fn();
  const { getByLabelText } = render(<AlphaSorter letter="All" onLetterChange={onLetterChange} />);

  const user = userEvent.setup();
  const letterC = getByLabelText('C');
  await user.click(letterC);

  expect(onLetterChange).toHaveBeenCalledWith('C');
});

test('renders the correct letters', () => {
  const { getByLabelText } = render(<AlphaSorter letter="All" onLetterChange={noop} />);

  expect(getByLabelText('All')).toBeInTheDocument();

  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    expect(getByLabelText(letter)).toBeInTheDocument();
  }
});

test('highlights the selected letter', () => {
  const { getByLabelText, rerender } = render(<AlphaSorter letter="All" onLetterChange={noop} />);

  const letterC = getByLabelText('C');
  const all = getByLabelText('All');
  expect(all).toBeChecked();
  expect(letterC).not.toBeChecked();
  rerender(<AlphaSorter letter="C" onLetterChange={noop} />);
  expect(letterC).toBeChecked();
});
