import { createServerListenerMocks, render } from '@/test-utils';
import { ClassicForm } from '@/components/ClassicForm';
import { expect, test, TestContext, vi } from 'vitest';
import { rest } from 'msw';
import { queryByAttribute } from '@testing-library/dom';

const router = {
  pathname: '/',
  push: vi.fn(),
  asPath: '/',
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

test('renders without crashing', () => render(<ClassicForm />));

test('has correct initial values', () => {
  const { getByTestId, getByRole, getAllByRole } = render(<ClassicForm />);

  // limit query checkboxes
  expect(getByRole('checkbox', { name: /Astronomy/i })).toBeChecked();
  expect(getByRole('checkbox', { name: /Physics/i })).not.toBeChecked();
  expect(getByRole('checkbox', { name: /General/i })).not.toBeChecked();
  expect(getByRole('checkbox', { name: /Earth Science/i })).not.toBeChecked();

  // property checkboxes
  expect(getByRole('checkbox', { name: /Refereed only/i })).not.toBeChecked();
  expect(getByRole('checkbox', { name: /Articles only/i })).not.toBeChecked();

  // radio buttons
  getAllByRole('radio', { name: /And/i }).forEach((radio) => expect(radio).toBeChecked());
  getAllByRole('radio', { name: /Or/i }).forEach((radio) => expect(radio).not.toBeChecked());
  getAllByRole('radio', { name: /Boolean/i }).forEach((radio) => expect(radio).not.toBeChecked());

  // textboxes should all be empty
  expect(getAllByRole('textbox')).toHaveLength(6);
  getAllByRole('textbox').forEach((textbox) => expect(textbox).toHaveValue(''));

  expect(getByTestId('bibstem-picker-hidden-input')).toHaveValue('');
  expect(getByTestId('sort-select')).toHaveValue('score');

  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});

test('checkboxes updates query properly', async () => {
  const { getByTestId, getByRole, user } = render(<ClassicForm />);

  // limit query checkboxes
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getByRole('checkbox', { name: /Astronomy/i }));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getByRole('checkbox', { name: /Physics/i }));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getByRole('checkbox', { name: /General/i }));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getByRole('checkbox', { name: /Earth Science/i }));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();

  // property checkboxes
  await user.click(getByRole('checkbox', { name: /Refereed only/i }));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getByRole('checkbox', { name: /Articles only/i }));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});

test('author textbox updates query', async () => {
  const { getByTestId, getByRole, user } = render(<ClassicForm />);
  const getRadio = (name: string, logic: 'And' | 'Or' | 'Boolean') =>
    getByRole('radio', {
      name: (aName, el) => el.getAttribute('name') === `logic_${name}` && aName === logic,
    });

  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Author/i }), 'Smith, J');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Author/i }), '\nSmith, A\nJames, B');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Author/i }), '\n-Smith, John\n=Smith, John\n^Smith, J$');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getRadio('author', 'Or'));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});

test('object textbox updates query', async () => {
  const { getByTestId, getByRole, user } = render(<ClassicForm />);
  const getRadio = (name: string, logic: 'And' | 'Or' | 'Boolean') =>
    getByRole('radio', {
      name: (aName, el) => el.getAttribute('name') === `logic_${name}` && aName === logic,
    });

  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Object/i }), 'foo');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Object/i }), '\nbar\nbaz');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getRadio('object', 'Or'));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});

test('title textbox updates query', async () => {
  const { getByTestId, getByRole, user } = render(<ClassicForm />);
  const getRadio = (name: string, logic: 'And' | 'Or' | 'Boolean') =>
    getByRole('radio', {
      name: (aName, el) => el.getAttribute('name') === `logic_${name}` && aName === logic,
    });

  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Title/i }), 'foo');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Title/i }), ' bar baz');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getRadio('title', 'Or'));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getRadio('title', 'Boolean'));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});

test('abstract textbox updates query', async () => {
  const { getByTestId, getByRole, user } = render(<ClassicForm />);
  const getRadio = (name: string, logic: 'And' | 'Or' | 'Boolean') =>
    getByRole('radio', {
      name: (aName, el) => el.getAttribute('name') === `logic_${name}` && aName === logic,
    });

  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Abstract/i }), 'foo');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.type(getByRole('textbox', { name: /Abstract/i }), ' bar baz');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getRadio('abstract_keywords', 'Or'));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
  await user.click(getRadio('abstract_keywords', 'Boolean'));
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});

test('publications textbox updates query', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  server.use(
    rest.get<{ term: string }>('*/api/bibstems/:term', (req, res, ctx) => {
      if (req.params.term === 'a') {
        return res(ctx.json([{ value: 'ApJ', label: ['The Astrophysical Journal'] }]));
      } else if (req.params.term === 'b') {
        return res(ctx.json([{ value: 'BGeo', label: ['Biogeosciences'] }]));
      }
      return res(ctx.json([]));
    }),
  );

  const { getByTestId, getAllByTestId, container, user, getByRole } = render(<ClassicForm />);

  // selects from the default list
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '{Enter}');
  expect(getAllByTestId('pill').map((pill) => pill.textContent)).toMatchSnapshot();
  expect(getByTestId('bibstem-picker-hidden-input').getAttribute('value')).toMatchSnapshot();

  // selects from the default list again
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '{Enter}');
  expect(getAllByTestId('pill').map((pill) => pill.textContent)).toMatchSnapshot();
  expect(getByTestId('bibstem-picker-hidden-input').getAttribute('value')).toMatchSnapshot();

  // select one from async list
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), 'a');
  expect(queryByAttribute('id', container, /.*bibstem-picker-listbox/i)).toMatchSnapshot();
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '{Enter}');
  expect(getByTestId('bibstem-picker-hidden-input').getAttribute('value')).toMatchSnapshot();

  // select one from async list but negates it
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '-b');
  expect(queryByAttribute('id', container, /.*bibstem-picker-listbox/i)).toMatchSnapshot();
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '{Enter}');
  expect(getByTestId('bibstem-picker-hidden-input').getAttribute('value')).toMatchSnapshot();

  // creates a custom bibstem
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), 'e');
  expect(queryByAttribute('id', container, /.*bibstem-picker-listbox/i)).toMatchSnapshot();
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '{Enter}');
  expect(getByTestId('bibstem-picker-hidden-input').getAttribute('value')).toMatchSnapshot();

  // creates a negated custom bibstem
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '-e');
  expect(queryByAttribute('id', container, /.*bibstem-picker-listbox/i)).toMatchSnapshot();
  await user.type(getByRole('combobox', { name: /Bibstem Picker/i }), '{Enter}');
  expect(getByTestId('bibstem-picker-hidden-input').getAttribute('value')).toMatchSnapshot();

  // check the server mock to make sure we made the right calls
  expect(onRequest.mock.calls).toHaveLength(4);
  expect(onRequest.mock.calls.map((call) => call[0].url.pathname)).toMatchSnapshot();

  // finally check the generated query to confirm it's been updated correctly
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});

test('pubdate updates the query', async () => {
  const { getByTestId, user, getByRole } = render(<ClassicForm />);

  // set the start date
  await user.type(getByRole('textbox', { name: /Publication Date Start/i }), '2020/01');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();

  // set the end date
  await user.type(getByRole('textbox', { name: /Publication Date End/i }), '2021/01');
  expect(getByTestId('generated-query').textContent).toMatchSnapshot();
});
