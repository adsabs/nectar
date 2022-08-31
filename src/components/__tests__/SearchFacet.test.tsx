import { composeStories } from '@storybook/testing-react';
import { render } from '@test-utils';
import { findAllByTestId, findByTestId, getAllByRole, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { head } from 'ramda';
import { describe, expect, it } from 'vitest';
import * as stories from '../__stories__/SearchFacet.stories';

const { Tree: SearchFacetTree } = composeStories(stories);

const setup = () => {
  const utils = render(
    <SearchFacetTree field="first_author_facet_hier" hasChildren logic={{ single: ['and'], multiple: ['and'] }} />,
  );

  return { user: userEvent.setup(), ...utils };
};

describe('SearchFacet', () => {
  it('renders without crashing', async ({ server }) => {
    const { user, getByTestId, getAllByTestId } = setup();

    await waitFor(() => getByTestId('search-facet-list'));
    const root = head(getAllByTestId('search-facet-item-root'));
    const expand = await findByTestId(root, 'search-facet-expand', { exact: true });
    server.use(
      rest.get('*/search/query', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            facet_counts: {
              facet_fields: {
                first_author_facet_hier: ['1/Kohler, S/Kohler, Susanna', 519, '1/Kohler, S/Köhler, S', 1],
              },
            },
          }),
        );
      }),
    );
    await user.click(expand);

    await waitFor(() => findAllByTestId(root, 'facet-checkbox-child'));
    const checkboxes = getAllByRole(root, 'checkbox');

    const expectChecked = (...cbx: boolean[]) => {
      cbx.forEach((expected, i) => {
        expected ? expect(checkboxes[i]).toBeChecked() : expect(checkboxes[i]).not.toBeChecked();
      });
    };

    // root and 2 children in this tree

    // none selected
    expectChecked(false, false, false);

    // click the root checkbox
    await user.click(checkboxes[0]);

    // all should be selected
    expectChecked(true, true, true);

    await user.click(checkboxes[0]);

    // all should be deselected
    expectChecked(false, false, false);

    // flip them all back
    await user.click(checkboxes[0]);

    // now all selected again
    expectChecked(true, true, true);

    // selecting a child should deselect the child AND the root
    await user.click(checkboxes[1]);
    expectChecked(false, false, true);

    // root should be indeterminate
    expect(checkboxes[0]).toBePartiallyChecked();

    // reselect the first child, all children should be selected causing the
    // root to be checked again
    await user.click(checkboxes[1]);
    expectChecked(true, true, true);
  }, 10000);
});
