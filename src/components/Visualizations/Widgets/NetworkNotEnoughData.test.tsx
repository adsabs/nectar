import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NetworkNotEnoughData } from './NetworkNotEnoughData';

const baseProps = {
  paperLimit: 5,
  maxPaperLimit: 100,
  onChangePaperLimit: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // DataDownloader builds an object URL on render; jsdom lacks the impl.
  window.URL.createObjectURL = vi.fn(() => 'blob:mock');
});

describe('NetworkNotEnoughData', () => {
  test('keeps the paper limit control reachable in the error state', () => {
    render(<NetworkNotEnoughData {...baseProps} />);
    expect(screen.getByText('Could not generate')).toBeInTheDocument();
    expect(screen.getByLabelText('max number of papers')).toBeInTheDocument();
  });

  test('raising the limit and applying calls onChangePaperLimit with the new value', () => {
    render(<NetworkNotEnoughData {...baseProps} />);
    fireEvent.change(screen.getByLabelText('max number of papers'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(baseProps.onChangePaperLimit).toHaveBeenCalledWith(50);
  });

  test('omits the download button when there is no usable data', () => {
    render(<NetworkNotEnoughData {...baseProps} />);
    expect(screen.queryByRole('button', { name: /download csv data/i })).not.toBeInTheDocument();
  });

  test('renders the download button when usable data is provided', () => {
    const getFileContent = vi.fn(() => 'a,b\n1,2\n');
    render(<NetworkNotEnoughData {...baseProps} csv={{ getFileContent, fileName: 'network.csv' }} />);
    expect(screen.getByRole('button', { name: /download csv data/i })).toBeInTheDocument();
  });
});
