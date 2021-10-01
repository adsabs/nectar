import { Popover } from '@components/Popover/Popover';
import { QuestionMarkCircleIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import { ReactElement } from 'react';

export interface IReadsTableData {
  totalNumberOfReads: number[];
  averageNumberOfReads: number[];
  medianNumberOfReads: number[];
  totalNumberOfDownloads: number[];
  averageNumberOfDownloads: number[];
  medianNumberOfDownloads: number[];
}

export interface IReadsTableProps {
  data: IReadsTableData;
  isAbstract: boolean;
}

export const ReadsTable = (props: IReadsTableProps): ReactElement => {
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
        <tr>
          <td>Total number of reads</td>
          <td>
            <Popover
              label={helpLabel}
              title={'Total Number of Reads'}
              message={
                "The total number of times all papers were read. For each paper, a read is counted if an ADS user runs a search in our system and then requests to either view the paper's full bibliographic record or download the fulltext."
              }
            />
          </td>
          <td>{data.totalNumberOfReads[0]}</td>
          <td className={hiddenAbsClass}>{data.totalNumberOfReads[1]}</td>
        </tr>
        <tr className={hiddenAbsClass}>
          <td>Average number of reads</td>
          <td>
            <Popover
              label={helpLabel}
              title="<b>Average Number of Reads</b>"
              message="The total number of reads divided by the number of papers."
            />
          </td>
          <td>{data.averageNumberOfReads[0]}</td>
          <td className={hiddenAbsClass}>{data.averageNumberOfReads[1]}</td>
        </tr>
        <tr className={hiddenAbsClass}>
          <td>Median number of reads</td>
          <td>
            <Popover
              label={helpLabel}
              title={'Median Number of Reads'}
              message={'The median of the reads distribution.'}
            />
          </td>
          <td>{data.medianNumberOfReads[0]}</td>
          <td className={hiddenAbsClass}>{data.medianNumberOfReads[1]}</td>
        </tr>

        <tr>
          <td>Total number of downloads</td>
          <td>
            <Popover
              label={helpLabel}
              title="Total Number of Downloads"
              message="The total number of times full text (article or e-print) was accessed."
            />
          </td>
          <td>{data.totalNumberOfDownloads[0]}</td>
          <td className={hiddenAbsClass}>{data.totalNumberOfDownloads[1]}</td>
        </tr>
        <tr className={hiddenAbsClass}>
          <td>Average number of downloads</td>
          <td>
            <Popover
              label={helpLabel}
              title="Average Number of Downloads"
              message="The total number of downloads divided by the number of papers."
            />
          </td>
          <td>{data.averageNumberOfDownloads[0]}</td>
          <td className={hiddenAbsClass}>{data.averageNumberOfDownloads[1]}</td>
        </tr>

        <tr className={hiddenAbsClass}>
          <td>Median number of downloads</td>
          <td>
            <Popover
              label={helpLabel}
              title="Median Number of Downloads"
              message="The median of the downloads distribution."
            />
          </td>
          <td>{data.medianNumberOfDownloads[0]}</td>
          <td className={hiddenAbsClass}>{data.medianNumberOfDownloads[1]}</td>
        </tr>
      </tbody>
    </table>
  );
};
