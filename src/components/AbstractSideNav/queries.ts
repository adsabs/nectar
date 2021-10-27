import Adsapi, { IDocsEntity } from '@api';
import { BasicStatsKey, CitationsStatsKey, MetricsResponseKey } from '@api/lib/metrics/types';
import { useAPI } from '@hooks';
import { useQuery } from 'react-query';

export const useHasGraphics = (doc: IDocsEntity): boolean => {
  const { api } = useAPI();

  const { data: hasGraphics } = useQuery(['hasGraphics', doc.bibcode], () => fetchHasGraphics(api, doc.bibcode), {
    enabled: !!doc,
  });

  return hasGraphics;
};

export const useHasMetrics = (doc: IDocsEntity): boolean => {
  const { api } = useAPI();
  const { data: hasMetrics } = useQuery(['hasMetrics', doc.bibcode], () => fetchHasMetrics(api, doc.bibcode), {
    enabled: !!doc,
  });

  return hasMetrics;
};

export const fetchHasGraphics = async (api: Adsapi, bibcode: string): Promise<boolean> => {
  const result = await api.graphics.query({ bibcode });
  return result.isOk();
};

export const fetchHasMetrics = async (api: Adsapi, bibcode: string): Promise<boolean> => {
  const result = await api.metrics.query({ bibcode });

  if (result.isErr()) {
    return false;
  }

  const metrics = result.value;
  const hasCitations =
    metrics && metrics[MetricsResponseKey.CITATION_STATS][CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS] > 0;
  const hasReads = metrics && metrics[MetricsResponseKey.BASIC_STATS][BasicStatsKey.TOTAL_NUMBER_OF_READS] > 0;

  return hasCitations || hasReads;
};
