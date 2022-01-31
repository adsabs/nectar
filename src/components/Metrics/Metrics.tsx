import { IADSApiMetricsResponse } from '@api';
import { useMetrics } from '@hooks/useMetrics';
import { ReactElement } from 'react';
import { CitationsTable } from './CitationsTable';
import { ReadsTable } from './ReadsTable';
interface IMetricsProps {
  metrics: IADSApiMetricsResponse;
  isAbstract: boolean;
}

export const Metrics = (props: IMetricsProps): ReactElement => {
  const { metrics, isAbstract } = props;

  const { citationsTable, readsTable } = useMetrics(metrics);

  const headingClass = 'bg-gray-100 text-3xl h-16 p-2 font-light flex items-center my-5';

  return (
    <>
      {citationsTable ? (
        <section>
          <div className={headingClass}>
            <h3>Citations</h3>
          </div>
          <CitationsTable data={citationsTable} isAbstract={isAbstract} />
        </section>
      ) : null}
      {readsTable ? (
        <section>
          <div className={headingClass}>
            <h3>Reads</h3>
          </div>
          <ReadsTable data={readsTable} isAbstract={isAbstract} />
        </section>
      ) : null}
    </>
  );
};
