import { Menu, MenuList } from '@chakra-ui/react';
import { act, render, waitFor } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyMenuItem, LabeledCopyButton, SimpleCopyButton } from './CopyButton';

const mocks = vi.hoisted(() => ({
  copyToClipboard: vi.fn(),
}));

vi.mock('@/lib/clipboard', () => ({ copyToClipboard: mocks.copyToClipboard }));

beforeEach(() => {
  mocks.copyToClipboard.mockReset();
  mocks.copyToClipboard.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
};

const renderMenuItem = (props: Parameters<typeof CopyMenuItem>[0]) =>
  render(
    <Menu isOpen>
      <MenuList>
        <CopyMenuItem {...props} />
      </MenuList>
    </Menu>,
  );

describe('SimpleCopyButton', () => {
  it('delegates the copy to the clipboard helper', async () => {
    const { getByLabelText, user } = render(<SimpleCopyButton text="2003NanoL...3..459S" />);

    await user.click(getByLabelText('copy to clipboard'));

    expect(mocks.copyToClipboard).toHaveBeenCalledWith({ content: '2003NanoL...3..459S', asHtml: false });
  });

  it('passes asHtml through for an HTML payload', async () => {
    const { getByLabelText, user } = render(<SimpleCopyButton text="<i>Nano</i>" asHtml />);

    await user.click(getByLabelText('copy to clipboard'));

    expect(mocks.copyToClipboard).toHaveBeenCalledWith({ content: '<i>Nano</i>', asHtml: true });
  });

  it('reports success once the write resolves', async () => {
    const onCopyComplete = vi.fn();
    const { getByLabelText, user } = render(<SimpleCopyButton text="x" onCopyComplete={onCopyComplete} />);

    await user.click(getByLabelText('copy to clipboard'));

    await waitFor(() => expect(getByLabelText('copied')).toBeInTheDocument());
    expect(onCopyComplete).toHaveBeenCalledTimes(1);
  });

  it('does not report success when the write is rejected (criterion 13)', async () => {
    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
    const onCopyComplete = vi.fn();
    const { getByLabelText, queryByLabelText, user } = render(
      <SimpleCopyButton text="x" onCopyComplete={onCopyComplete} />,
    );

    await user.click(getByLabelText('copy to clipboard'));
    await settle();

    expect(queryByLabelText('copied')).not.toBeInTheDocument();
    expect(onCopyComplete).not.toHaveBeenCalled();
    expect(getByLabelText('copy to clipboard')).toBeInTheDocument();
  });
});

describe('LabeledCopyButton', () => {
  it('delegates the copy to the clipboard helper', async () => {
    const { getByText, user } = render(<LabeledCopyButton label="Copy" text="citation text" />);

    await user.click(getByText('Copy'));

    expect(mocks.copyToClipboard).toHaveBeenCalledWith({ content: 'citation text', asHtml: false });
  });

  it('reports success once the write resolves', async () => {
    const { getByText, user } = render(<LabeledCopyButton label="Copy" text="x" />);

    await user.click(getByText('Copy'));

    await waitFor(() => expect(getByText('Copied to clipboard!')).toBeInTheDocument());
  });

  it('does not report success when the write is rejected (criterion 13)', async () => {
    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
    const onCopyComplete = vi.fn();
    const { getByText, queryByText, user } = render(
      <LabeledCopyButton label="Copy" text="x" onCopyComplete={onCopyComplete} />,
    );

    await user.click(getByText('Copy'));
    await settle();

    expect(queryByText('Copied to clipboard!')).not.toBeInTheDocument();
    expect(onCopyComplete).not.toHaveBeenCalled();
    expect(getByText('Copy')).toBeInTheDocument();
  });
});

describe('CopyMenuItem', () => {
  it('delegates the copy to the clipboard helper', async () => {
    const { getByText, user } = renderMenuItem({ label: 'Copy Citation', text: 'Star, A.', asHtml: true });

    await user.click(getByText('Copy Citation'));

    expect(mocks.copyToClipboard).toHaveBeenCalledWith({ content: 'Star, A.', asHtml: true });
  });

  it('reports success once the write resolves', async () => {
    const onCopyComplete = vi.fn();
    const { getByText, user } = renderMenuItem({ label: 'Copy Citation', text: 'x', onCopyComplete });

    await user.click(getByText('Copy Citation'));

    await waitFor(() => expect(onCopyComplete).toHaveBeenCalledTimes(1));
  });

  it('does not report success when the write is rejected (criterion 13)', async () => {
    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
    const onCopyComplete = vi.fn();
    const { getByText, user } = renderMenuItem({ label: 'Copy Citation', text: 'x', onCopyComplete });

    await user.click(getByText('Copy Citation'));
    await settle();

    expect(onCopyComplete).not.toHaveBeenCalled();
  });
});

describe('a rejected write is signalled without losing the retry affordance', () => {
  beforeEach(() => {
    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
  });

  it('surfaces a failure status on SimpleCopyButton', async () => {
    const { getByLabelText, findByRole, user } = render(<SimpleCopyButton text="x" />);

    await user.click(getByLabelText('copy to clipboard'));

    expect(await findByRole('status')).toHaveTextContent(/copy failed/i);
  });

  it('keeps SimpleCopyButton clickable so the reader can retry', async () => {
    const { getByLabelText, user } = render(<SimpleCopyButton text="x" />);

    await user.click(getByLabelText('copy to clipboard'));
    await settle();

    const button = getByLabelText('copy to clipboard');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('retries on a second click and succeeds', async () => {
    const { getByLabelText, user } = render(<SimpleCopyButton text="x" />);

    await user.click(getByLabelText('copy to clipboard'));
    await settle();

    mocks.copyToClipboard.mockResolvedValue(undefined);
    await user.click(getByLabelText('copy to clipboard'));

    await waitFor(() => expect(getByLabelText('copied')).toBeInTheDocument());
  });

  it('surfaces a failure status on LabeledCopyButton without replacing its label', async () => {
    const { getByText, findByRole, user } = render(<LabeledCopyButton label="Copy" text="x" />);

    await user.click(getByText('Copy'));

    expect(await findByRole('status')).toHaveTextContent(/copy failed/i);
    expect(getByText('Copy')).toBeInTheDocument();
  });

  it('clears the failure status after the timeout', async () => {
    const { getByLabelText, queryByRole, user } = render(<SimpleCopyButton text="x" timeout={50} />);

    await user.click(getByLabelText('copy to clipboard'));
    await waitFor(() => expect(queryByRole('status')).not.toBeNull());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });

    expect(queryByRole('status')).toBeNull();
  });

  it('shows no failure status on a successful copy', async () => {
    mocks.copyToClipboard.mockResolvedValue(undefined);
    const { getByLabelText, queryByRole, user } = render(<SimpleCopyButton text="x" />);

    await user.click(getByLabelText('copy to clipboard'));
    await settle();

    expect(queryByRole('status')).toBeNull();
  });
});

describe('success and failure states are mutually exclusive (REV finding 2)', () => {
  it('clears the copied label when a later write fails', async () => {
    const { getByText, queryByText, findByRole, user } = render(<LabeledCopyButton label="Copy" text="x" />);

    await user.click(getByText('Copy'));
    await waitFor(() => expect(getByText('Copied to clipboard!')).toBeInTheDocument());

    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
    await user.click(getByText('Copied to clipboard!'));

    expect(await findByRole('status')).toHaveTextContent(/copy failed/i);
    expect(queryByText('Copied to clipboard!')).not.toBeInTheDocument();
  });

  it('never shows the copied label and the failure status together', async () => {
    const { getByText, queryByText, queryByRole, user } = render(<LabeledCopyButton label="Copy" text="x" />);

    await user.click(getByText('Copy'));
    await waitFor(() => expect(getByText('Copied to clipboard!')).toBeInTheDocument());

    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
    await user.click(getByText('Copied to clipboard!'));
    await settle();

    const bothShown = queryByText('Copied to clipboard!') !== null && queryByRole('status') !== null;
    expect(bothShown).toBe(false);
  });
});
