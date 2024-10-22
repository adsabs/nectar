import { IExportApiResponse } from '@/api/export/types';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';

type Fixture<T> = [number, T];

export const getResponse = (count: number): Fixture<IExportApiResponse> => {
  switch (count) {
    case 4:
      return [
        200,
        {
          msg: 'Retrieved 4 abstracts, starting with number 1.',
          export:
            "2020ASPC..527..505B Agile Methodologies in Teams with Highly Creative and Autonomous Members\n2020AAS...23528705A Life after Classic: An Astronomer's Guide to the new ADS\n2019ASPC..523..353B Fundamentals of Effective Cloud Management for the New NASA Astrophysics Data System\n2019AAS...23338108A Transitioning from ADS Classic to the new ADS search platform\n",
        },
      ];
    case 3:
      return [
        200,
        {
          msg: 'Retrieved 3 abstracts, starting with number 1.',
          export:
            "2020ASPC..527..505B Agile Methodologies in Teams with Highly Creative and Autonomous Members\n2020AAS...23528705A Life after Classic: An Astronomer's Guide to the new ADS\n2019ASPC..523..353B Fundamentals of Effective Cloud Management for the New NASA Astrophysics Data System\n",
        },
      ];
    case 2:
      return [
        200,
        {
          msg: 'Retrieved 2 abstracts, starting with number 1.',
          export:
            "2020ASPC..527..505B Agile Methodologies in Teams with Highly Creative and Autonomous Members\n2020AAS...23528705A Life after Classic: An Astronomer's Guide to the new ADS\n",
        },
      ];
    case 1:
      return [
        200,
        {
          msg: 'Retrieved 1 abstracts, starting with number 1.',
          export: '2020ASPC..527..505B Agile Methodologies in Teams with Highly Creative and Autonomous Members\n',
        },
      ];
  }
};

export const queryBasedSearchResponse: Fixture<IADSApiSearchResponse> = [
  200,
  {
    response: {
      numFound: 4,
      docs: [
        {
          bibcode: '2020AAS...23528705A',
          author: ['Accomazzi, A.', 'Kurtz, M.', 'Henneken, E.'],
          author_count: 13,
          id: '18677923',
          pubdate: '2020-01-00',
          title: ["Life after Classic: An Astronomer's Guide to the new ADS"],
        },
        {
          bibcode: '2020ASPC..527..505B',
          author: ['Blanco-Cuaresma, S.', 'Accomazzi, A.', 'Kurtz, M. J.'],
          author_count: 14,
          id: '19960874',
          pubdate: '2020-00-00',
          title: ['Agile Methodologies in Teams with Highly Creative and Autonomous Members'],
        },
        {
          bibcode: '2019ASPC..523..353B',
          author: ['Blanco-Cuaresma, Sergi', 'Accomazzi, Alberto', 'Kurtz, Michael J.'],
          author_count: 14,
          id: '17577946',
          pubdate: '2019-10-00',
          title: ['Fundamentals of Effective Cloud Management for the New NASA Astrophysics Data System'],
        },
        {
          bibcode: '2019AAS...23338108A',
          author: ['Accomazzi, Alberto', 'Kurtz, Michael J.', 'Henneken, Edwin'],
          author_count: 12,
          id: '15583916',
          pubdate: '2019-01-00',
          title: ['Transitioning from ADS Classic to the new ADS search platform'],
        },
      ],
    },
  },
];

export const bibcodes = ['2020ASPC..527..505B', '2020AAS...23528705A', '2019ASPC..523..353B'];
export const mockQuery: IADSApiSearchParams = {
  q: 'bibcode:(2020ASPC..527..505B OR 2020AAS...23528705A OR 2019ASPC..523..353B OR 2019AAS...23338108A)',
  sort: ['date desc'],
};
