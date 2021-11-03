import { IUsePagination, IUsePaginationProps, usePagination } from '@components/Pagination';
import { renderHook } from '@testing-library/react-hooks';
import { useRouter } from 'next/router';

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

const setPage = (p: string) => (useRouter as jest.Mock).mockImplementation(() => ({ query: { p } }));

describe('usePagination (hook)', () => {
  it('generates proper values based on props', () => {
    const tests: [IUsePaginationProps, string][] = [
      [{ totalResults: 10, numPerPage: 10 }, '["/?p=1","/?p=1",[{"index":1,"href":"/?p=1"}],1,1,10,true,true,1,true]'],
      [
        { totalResults: 10000, numPerPage: 10 },
        '["/?p=2","/?p=1",[{"index":1,"href":"/?p=1"},{"index":2,"href":"/?p=2"},{"index":3,"href":"/?p=3"},{"index":4,"href":"/?p=4"}],1,1,10,true,false,1000,false]',
      ],
      [
        { totalResults: -38382, numPerPage: 2929333 },
        '["/?p=2","/?p=1",[{"index":1,"href":"/?p=1"},{"index":2,"href":"/?p=2"},{"index":3,"href":"/?p=3"},{"index":4,"href":"/?p=4"}],1,1,10,true,false,3838,false]',
      ],
      [{ totalResults: 0, numPerPage: 0 }, '["/?p=1","/?p=1",[{"index":1,"href":"/?p=1"}],1,1,10,true,true,1,true]'],
      [
        { totalResults: 11, numPerPage: 10 },
        '["/?p=2","/?p=1",[{"index":1,"href":"/?p=1"},{"index":2,"href":"/?p=2"}],1,1,10,true,false,2,false]',
      ],
    ];

    const { result, rerender } = renderHook<IUsePaginationProps, IUsePagination>((props) => usePagination(props), {
      initialProps: { totalResults: 10, numPerPage: 10 },
    });

    tests.forEach(([props, expected]) => {
      rerender(props);
      const values = JSON.stringify(Object.values(result.current));
      expect(values).toEqual(expected);
    });
  });

  it('reacts to query param changes', () => {
    const { result, rerender } = renderHook<IUsePaginationProps, IUsePagination>((props) => usePagination(props), {
      initialProps: { totalResults: 200, numPerPage: 10 },
    });
    const tests: [IUsePaginationProps, string, string][] = [
      [
        { totalResults: 200, numPerPage: 10 },
        '3',
        '["/?p=4","/?p=2",[{"index":1,"href":"/?p=1"},{"index":2,"href":"/?p=2"},{"index":3,"href":"/?p=3"},{"index":4,"href":"/?p=4"},{"index":5,"href":"/?p=5"},{"index":6,"href":"/?p=6"}],3,21,30,false,false,20,false]',
      ],
      [
        { totalResults: 200, numPerPage: 10 },
        '-20',
        '["/?p=2","/?p=1",[{"index":1,"href":"/?p=1"},{"index":2,"href":"/?p=2"},{"index":3,"href":"/?p=3"},{"index":4,"href":"/?p=4"}],1,1,10,true,false,20,false]',
      ],
      [
        { totalResults: 200, numPerPage: 10 },
        '500',
        '["/?p=20","/?p=19",[{"index":17,"href":"/?p=17"},{"index":18,"href":"/?p=18"},{"index":19,"href":"/?p=19"},{"index":20,"href":"/?p=20"}],20,191,200,false,true,20,false]',
      ],
    ];

    tests.forEach(([props, page, expected]) => {
      setPage(page);
      rerender(props);
      const values = JSON.stringify(Object.values(result.current));
      expect(values).toEqual(expected);
    });
  });
});
