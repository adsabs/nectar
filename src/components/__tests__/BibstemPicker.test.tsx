import * as stories from '@components/__stories__/BibstemPicker.stories';
import { composeStories } from '@storybook/testing-react';
import { act, createServerListenerMocks, render, urls, waitFor } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { expect, test } from 'vitest';

const { Default: BibstemPickerSingle, Multi: BibstemPickerMultiple } = composeStories(stories);

const setup = (which: 'single' | 'multiple') => {
  const utils = render(which === 'single' ? <BibstemPickerSingle /> : <BibstemPickerMultiple />);
  return {
    user: userEvent.setup(),
    ...utils,
  };
};

test('Renders Single-version without error', () => {
  expect(() => render(<BibstemPickerSingle />)).not.toThrow();
});
test('Renders Multi-version without error', () => {
  expect(() => render(<BibstemPickerMultiple />)).to.not.throw();
});

test('shows default list on click, and updates value on select', async () => {
  const { container, findByTestId, findByRole, user } = setup('single');
  const hiddenInput = await findByTestId('hidden-input');
  const input = await findByRole('combobox');
  await user.click(input);
  await user.type(input, '{ArrowDown}{Enter}');

  expect(hiddenInput.getAttribute('value')).toEqual('PhRvL');
  expect(container.textContent).toEqual('Physical Review Letters (PhRvL)');
});

test('properly calls api on typing', async ({ server }) => {
  const { onRequest } = createServerListenerMocks(server);
  onRequest.mock.calls;
  const { container, getAllByTestId, findByRole, user } = setup('single');
  const input = await findByRole('combobox');
  await act(async () => {
    await user.type(input, 'apj');
  });
  await waitFor(() => container.querySelector('#react-select-bibstem-picker-listbox'));
  const options = getAllByTestId('option');
  expect(options[0].textContent).toEqual('ApJThe Astrophysical Journal (ApJ)');

  expect(urls(onRequest)).toEqual(['/api/bibstems/a', '/api/bibstems/ap', '/api/bibstems/apj']);
});

test('updates properly for multivalue', async ({ server }) => {
  const { onRequest } = createServerListenerMocks(server);
  const { container, getAllByTestId, findByRole, user } = setup('multiple');
  const input = await findByRole('combobox');
  await act(async () => {
    await user.type(input, 'apj');
    await waitFor(() => container.querySelector('#react-select-bibstem-picker-listbox'));
    await user.type(input, '{DownArrow}{Enter}');
  });

  // a pill was created with selection
  expect(getAllByTestId('pill').map((v) => v.textContent)).toEqual(['ApJ']);

  expect(urls(onRequest)).toEqual(['/api/bibstems/a', '/api/bibstems/ap', '/api/bibstems/apj']);

  await act(async () => {
    await user.type(input, 'physics');
    await waitFor(() => container.querySelector('#react-select-bibstem-picker-listbox'));
    await user.type(input, '{DownArrow}{Enter}');
  });

  const pills = await waitFor(() => getAllByTestId('pill'));

  // 2 pills are created
  expect(pills.map((v) => v.textContent)).toEqual(['ApJ', 'JChPh']);
  expect(urls(onRequest)).toEqual([
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

  const hiddenInput = getAllByTestId('hidden-input')[0];

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

test.skip('shows an error message when fetch fails', async ({ server }) => {
  const { onRequest } = createServerListenerMocks(server);

  server.use(
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

  expect(urls(onRequest)).toEqual(['/api/bibstems/a', '/api/bibstems/ap', '/api/bibstems/apj']);

  // TODO: fix test
  // expect(onResponse.mock.calls.map((call) => call[0].status)).toEqual([500, 500, 500]);

  const options = getAllByTestId('option');

  expect(options.map((e) => e.textContent)).toEqual([
    // error message
    'Cannot fetch items for search "apj"',

    // custom insert
    'apjCustom Journal? insert "apj"',
  ]);

  // option container should be disabled
  expect(options[0].parentElement.hasAttribute('aria-disabled')).toBeTruthy();
});
