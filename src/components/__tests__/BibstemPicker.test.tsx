import * as stories from '@components/__stories__/BibstemPicker.stories';
import { composeStories } from '@storybook/testing-react';
import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MSWOnRequestMock, MSWOnResponseMock } from 'jest-setup';
import { rest } from 'msw';
import { map, path, pipe } from 'ramda';

const { Default: BibstemPickerSingle, Multi: BibstemPickerMultiple } = composeStories(stories);

const setup = (which: 'single' | 'multiple') => {
  const utils = render(which === 'single' ? <BibstemPickerSingle /> : <BibstemPickerMultiple />);
  return {
    user: userEvent.setup(),
    ...utils,
  };
};

const urls = pipe<[MSWOnRequestMock], Record<string, unknown>[], string[]>(
  path(['mock', 'calls']),
  map(path(['0', 'url', 'pathname'])),
);

describe('BibstemPicker', () => {
  it('Renders Single-version without error', () => {
    render(<BibstemPickerSingle />);
  });
  it('Renders Multi-version without error', () => {
    render(<BibstemPickerMultiple />);
  });

  it('shows default list on click, and updates value on select', async () => {
    const { container, findByTestId, findByRole, user } = setup('single');
    const hiddenInput = await findByTestId('hidden-input');
    const input = await findByRole('combobox');
    await user.click(input);
    await user.type(input, '{ArrowDown}{Enter}');

    expect(hiddenInput).toHaveValue('PhRvL');
    expect(container).toHaveTextContent('Physical Review Letters (PhRvL)');
  });

  it('properly calls api on typing', async () => {
    const { container, getAllByTestId, findByRole, user } = setup('single');
    const input = await findByRole('combobox');
    await act(async () => {
      await user.type(input, 'apj');
    });
    await waitFor(() => container.querySelector('#react-select-bibstem-picker-listbox'));
    const options = getAllByTestId('option');
    expect(options[0]).toHaveTextContent('ApJThe Astrophysical Journal (ApJ)');

    expect(urls(__mockServer__.onRequest as MSWOnRequestMock)).toEqual([
      '/api/bibstems/a',
      '/api/bibstems/ap',
      '/api/bibstems/apj',
    ]);
  });

  it('updates properly for multivalue', async () => {
    const { container, getAllByTestId, findByTestId, findByRole, user } = setup('multiple');
    const input = await findByRole('combobox');
    const hiddenInput = await findByTestId('hidden-input');
    await act(async () => {
      await user.type(input, 'apj');
      await waitFor(() => container.querySelector('#react-select-bibstem-picker-listbox'));
      await user.type(input, '{DownArrow}{Enter}');
    });

    // a pill was created with selectiojn
    expect(getAllByTestId('pill').map((v) => v.textContent)).toEqual(['ApJ']);

    expect(urls(__mockServer__.onRequest as MSWOnRequestMock)).toEqual([
      '/api/bibstems/a',
      '/api/bibstems/ap',
      '/api/bibstems/apj',
    ]);

    await act(async () => {
      await user.type(input, 'physics');
      await waitFor(() => container.querySelector('#react-select-bibstem-picker-listbox'));
      await user.type(input, '{DownArrow}{Enter}');
    });

    // 2 pills are created
    expect(getAllByTestId('pill').map((v) => v.textContent)).toEqual(['ApJ', 'JChPh']);
    expect(urls(__mockServer__.onRequest as MSWOnRequestMock)).toEqual([
      '/api/bibstems/a',
      '/api/bibstems/ap',
      '/api/bibstems/apj',
      '/api/bibstems/p',
      '/api/bibstems/ph',
      '/api/bibstems/phy',
      '/api/bibstems/phys',
      '/api/bibstems/physi',
      '/api/bibstems/physic',
      '/api/bibstems/physics',
    ]);

    // hidden input is updated with both values
    expect(hiddenInput).toHaveValue('ApJ,JChPh');

    await act(async () => {
      await user.type(input, '{BackSpace}');
    });

    // it's updated as we remove them
    expect(hiddenInput).toHaveValue('ApJ');

    await act(async () => {
      await user.type(input, '{BackSpace}');
    });

    expect(hiddenInput).toHaveValue('');
  });

  it('shows an error message when fetch fails', async () => {
    __mockServer__.use(
      rest.get(`*/api/bibstems/:term`, (req, res, ctx) => {
        return res(ctx.status(500));
      }),
    );

    const { container, getAllByTestId, findByRole, user } = setup('multiple');
    const input = await findByRole('combobox');
    await act(async () => {
      await user.type(input, 'apj');
    });

    // wait for the menu list to appear
    await waitFor(() => container.querySelector('#react-select-bibstem-picker-listbox'));

    expect(urls(__mockServer__.onRequest as MSWOnRequestMock)).toEqual([
      '/api/bibstems/a',
      '/api/bibstems/ap',
      '/api/bibstems/apj',
    ]);
    expect((__mockServer__.onResponse as MSWOnResponseMock).mock.calls.map((call) => call[0].status)).toEqual([
      500, 500, 500,
    ]);

    const options = getAllByTestId('option');
    expect(options.map((e) => e.textContent)).toEqual([
      // error message
      'Cannot fetch items for search "apj"',

      // custom insert
      'apjCustom Journal? insert "apj"',
    ]);

    // option container should be disabled
    expect(options[0].parentElement).toHaveAttribute('aria-disabled', 'true');
  });
});