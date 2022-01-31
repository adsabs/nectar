import { Pagination } from '@components/ResultList/Pagination';
import { render } from '@testing-library/react';
import { noop } from '@utils';

// mock the router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ query: {} })),
}));

enum Ids {
  CONTAINER = 'pagination-container',
  ITEM = 'pagination-item',
  NEXT = 'pagination-next',
  PREV = 'pagination-prev',
}

describe('Pagination', () => {
  it('should render without crashing', () => {
    render(<Pagination onPageChange={noop} />);
  });

  it('should render nothing if no pages are passed', () => {
    const { container } = render(<Pagination onPageChange={noop} />);
    expect(container.hasChildNodes()).toBeFalsy();
  });
});

// describe('usePagination (hook)', () => {
//   it('works', () => {
//     const fakeEvent = { preventDefault: () => {} } as MouseEvent<HTMLAnchorElement>;
//     const onPageChange = jest.fn((p: number) => {
//       console.log('page change!', p);

//       (useRouter as jest.Mock).mockImplementation(() => ({ query: { p } }));
//     });
//     const { result } = renderHook<IUsePaginationProps, IUsePagination>((props) => usePagination(props), {
//       initialProps: { totalResults: 500, numPerPage: 10, onPageChange },
//     });

//     console.log(result.current);

//     expect(result.current.page).toEqual(1);

//     // click next button
//     void act(() => result.current.handleNext.call(fakeEvent, fakeEvent) as undefined);

//     console.log(result.current);
//     expect(onPageChange).toHaveBeenCalledWith(2);
//   });
// });
// test('Pagination ', () => {
//   const { debug } = render(<Pagination onPageChange={() => {}} />);
//   console.log(debug());
// });
