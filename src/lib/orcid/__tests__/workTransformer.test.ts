import { expect, test } from 'vitest';
import { transformADStoOrcid } from '@/lib/orcid/workTransformer';
import { IOrcidWork } from '@/api/orcid/types';
import { IDocsEntity } from '@/api/search/types';

const mockDoc: IDocsEntity = {
  bibcode: '2023RvMPP...7...17M',
  abstract:
    "The solar atmosphere is known to be replete with magneto-hydrodynamic wave modes, and there has been significant investment in understanding how these waves propagate through the Sun's atmosphere and deposit their energy into the plasma. The waves' journey is made interesting by the vertical variation in plasma quantities that define the solar atmosphere. In addition to this large-scale inhomogeneity, a wealth of fine-scale structure through the chromosphere and corona has been brought to light by high-resolution observations over the last couple of decades. This fine-scale structure represents inhomogeneity that is thought to be perpendicular to the local magnetic fields. The implications of this form of inhomogeneity on wave propagation is still being uncovered, but is known to fundamentally change the nature of MHD wave modes. It also enables interesting physics to arise including resonances, turbulence and instabilities. Here, we review some of the key insights into how the inhomogeneity influences Alfvénic wave propagation through the Sun's atmosphere, discussing both inhomogeneities parallel and perpendicular to the magnetic field.",
  alternate_bibcode: ['2022arXiv220805222M'],
  author: ['Morton, R. J.', 'Sharma, R.', 'Tajfirouze, E.', 'Miriyala, H.'],
  doctype: 'article',
  doi: ['10.1007/s41614-023-00118-3'],
  identifier: [
    '2023RvMPP...7...17M',
    '2022arXiv220805222M',
    '10.1007/s41614-023-00118-3',
    '10.48550/arXiv.2208.05222',
    'arXiv:2208.05222',
  ],
  orcid_pub: ['0000-0001-5678-9002', '0000-0002-0197-9041', '-', '0000-0002-2235-3216'],
  pub: 'Reviews of Modern Plasma Physics',
  pubdate: '2023-12-00',
  title: ['Alfvénic waves in the inhomogeneous solar atmosphere'],
  orcid_user: ['0000-0001-5678-9002', '-', '-', '-'],
};

const expected: IOrcidWork = {
  'external-ids': {
    'external-id': [
      {
        'external-id-type': 'bibcode',
        'external-id-value': '2023RvMPP...7...17M',
        'external-id-relationship': 'SELF',
      },
      {
        'external-id-type': 'doi',
        'external-id-value': '10.1007/s41614-023-00118-3',
        'external-id-relationship': 'SELF',
      },
    ],
  },
  'publication-date': { year: { value: '2023' }, month: { value: '12' } },
  contributors: {
    contributor: [
      {
        'credit-name': { value: 'Morton, R. J.' },
        'contributor-attributes': { 'contributor-role': 'AUTHOR', 'contributor-sequence': 'FIRST' },
        'contributor-orcid': {
          path: '0000-0001-5678-9002',
          host: 'orcid.org',
          uri: 'http://orcid.org/0000-0001-5678-9002',
        },
      },
      {
        'credit-name': { value: 'Sharma, R.' },
        'contributor-attributes': { 'contributor-role': 'AUTHOR', 'contributor-sequence': 'ADDITIONAL' },
        'contributor-orcid': {
          path: '0000-0002-0197-9041',
          host: 'orcid.org',
          uri: 'http://orcid.org/0000-0002-0197-9041',
        },
      },
      {
        'credit-name': { value: 'Tajfirouze, E.' },
        'contributor-attributes': { 'contributor-role': 'AUTHOR', 'contributor-sequence': 'ADDITIONAL' },
      },
      {
        'credit-name': { value: 'Miriyala, H.' },
        'contributor-attributes': { 'contributor-role': 'AUTHOR', 'contributor-sequence': 'ADDITIONAL' },
        'contributor-orcid': {
          path: '0000-0002-2235-3216',
          host: 'orcid.org',
          uri: 'http://orcid.org/0000-0002-2235-3216',
        },
      },
    ],
  },
  'short-description':
    "The solar atmosphere is known to be replete with magneto-hydrodynamic wave modes, and there has been significant investment in understanding how these waves propagate through the Sun's atmosphere and deposit their energy into the plasma. The waves' journey is made interesting by the vertical variation in plasma quantities that define the solar atmosphere. In addition to this large-scale inhomogeneity, a wealth of fine-scale structure through the chromosphere and corona has been brought to light by high-resolution observations over the last couple of decades. This fine-scale structure represents inhomogeneity that is thought to be perpendicular to the local magnetic fields. The implications of this form of inhomogeneity on wave propagation is still being uncovered, but is known to fundamentally change the nature of MHD wave modes. It also enables interesting physics to arise including resonances, turbulence and instabilities. Here, we review some of the key insights into how the inhomogeneity influences Alfvénic wave propagation through the Sun's atmosphere, discussing both inhomogeneities parallel and perpendicular to the magnetic field.",
  'journal-title': { value: 'Reviews of Modern Plasma Physics' },
  type: 'JOURNAL_ARTICLE',
  title: { title: { value: 'Alfvénic waves in the inhomogeneous solar atmosphere' } },
};

test('transforms works properly', () => {
  expect(transformADStoOrcid(mockDoc)).toStrictEqual<IOrcidWork>(expected);
});

test('simplifies output to only include values passed', () => {
  expect(
    transformADStoOrcid({
      title: ['test'],
    }),
  ).toStrictEqual({
    title: { title: { value: 'test' } },
  });
});
