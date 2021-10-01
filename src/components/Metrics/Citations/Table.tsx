import { Popover } from '@components/Popover/Popover';
import { QuestionMarkCircleIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import React, { ReactElement } from 'react';

export interface ICitationsTableData {
  numberOfCitingPapers: number[];
  totalCitations: number[];
  numberOfSelfCitations: number[];
  averageCitations: number[];
  medianCitations: number[];
  normalizedCitations: number[];
  refereedCitations: number[];
  averageRefereedCitations: number[];
  medianRefereedCitations: number[];
  normalizedRefereedCitations: number[];
}

export interface ICitationsTableProps {
  data: ICitationsTableData;
  isAbstract: boolean;
}

export const CitationsTable = (props: ICitationsTableProps): ReactElement => {
  const { data, isAbstract } = props;

  const hiddenAbsClass = clsx(isAbstract ? 'hidden' : '');

  const iconClass = 'default-icon text-gray-400';

  const helpLabel = <QuestionMarkCircleIcon className={iconClass} />;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>
            <span className="sr-only">no value</span>
          </th>
          <th>
            <span className="sr-only">no value</span>
          </th>
          <th className={hiddenAbsClass}>Totals</th>
          <th className={hiddenAbsClass}>Refereed</th>
        </tr>
      </thead>
      <tbody>
        <tr className={hiddenAbsClass}>
          <td>Number of citing papers</td>
          <td>
            <Popover
              label={helpLabel}
              title="Number of Citing Papers"
              message="Number of unique papers citing the papers in the submitted list."
              aria-hidden="true"
            />
            &nbsp;
          </td>
          <td>{data.numberOfCitingPapers[0]}</td>
          <td className={hiddenAbsClass}>{data.numberOfCitingPapers[1]}</td>
        </tr>
        <tr>
          <td>Total citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Total Citations"
              message="The total number of times all papers in the list were cited."
              aria-hidden="true"
            />
          </td>
          <td>{data.totalCitations[0]}</td>
          <td className={hiddenAbsClass}>{data.totalCitations[1]}</td>
        </tr>
        <tr className={hiddenAbsClass}>
          <td>Number of self-citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Number of Self-Citations"
              message="The number of citing papers that were also in the list from which the metrics were computed."
              aria-hidden="true"
            />
          </td>
          <td>{data.numberOfSelfCitations[0]}</td>
          <td>{data.numberOfSelfCitations[1]}</td>
        </tr>

        <tr className={hiddenAbsClass}>
          <td>Average citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Average Citations"
              message="The total number of citations divided by the number of papers."
              aria-hidden="true"
            />
          </td>
          <td>{data.averageCitations[0]}</td>
          <td>{data.averageCitations[1]}</td>
        </tr>
        <tr className={hiddenAbsClass}>
          <td>Median citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Median Citations"
              message="The median of the citation distribution."
              aria-hidden="true"
            />
          </td>
          <td>{data.medianCitations[0]}</td>
          <td>{data.medianCitations[1]}</td>
        </tr>

        <tr>
          <td>Normalized citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Normalized Citations"
              aria-hidden="true"
              message="For a list of N papers (i=1,...N), where N<sub>auth</sub><sup>i</sup> is the number of authors for publication i and C<sub>i</sub> the number of citations that this paper received, the normalized citation count for each article is C<sub>i</sub>/N<sub>auth</sub><sup>i</sup> ,and the 'normalized citations' for this list of N papers is the sum of these N numbers."
            />
          </td>
          <td>{data.normalizedCitations[0]}</td>
          <td className={hiddenAbsClass}>{data.normalizedCitations[1]}</td>
        </tr>

        <tr>
          <td>Refereed citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Refereed Citations"
              aria-hidden="true"
              message="Number of refereed citing papers."
            />
          </td>
          <td>{data.refereedCitations[0]}</td>
          <td className={hiddenAbsClass}>{data.refereedCitations[1]}</td>
        </tr>
        <tr className={hiddenAbsClass}>
          <td>Average refereed citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Average Refereed Citations"
              aria-hidden="true"
              message="The average number of citations from refereed publications to all/refereed publications in the list."
            />
          </td>
          <td>{data.averageRefereedCitations[0]}</td>
          <td>{data.averageRefereedCitations[1]}</td>
        </tr>

        <tr className={hiddenAbsClass}>
          <td>Median refereed citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Median Refereed Citations"
              aria-hidden="true"
              message="The average median of citations from refereed publications to all refereed publications in the list."
            />
          </td>
          <td>{data.medianRefereedCitations[0]}</td>
          <td>{data.medianRefereedCitations[1]}</td>
        </tr>
        <tr>
          <td>Normalized refereed citations</td>
          <td>
            <Popover
              label={helpLabel}
              title="Normalized Refereed Citations"
              aria-hidden="true"
              message="The normalized number of citations from refereed publications to all refereed publications in the list."
            />
          </td>
          <td>{data.normalizedRefereedCitations[0]}</td>
          <td className={hiddenAbsClass}>{data.normalizedRefereedCitations[1]}</td>
        </tr>
      </tbody>
    </table>
  );
};
