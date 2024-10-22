import { Button, Center, Heading, Icon, ModalBody, ModalHeader, Skeleton, Stack } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PlanetaryApiResponse } from '@/pages/api/experiments/planetary';
import axios from 'axios';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { isNil } from 'ramda';
import { GlobeAltIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';

import * as Q from '@/query-utils';
import { Select } from '@/components/Select';
import { makeSearchParams } from '@/utils/common/search';
import { IADSApiSearchParams } from '@/api/search/types';
import { useVaultBigQuerySearch } from '@/api/vault/vault';

const BIGQUERY_THRESHOLD = 20;

export const PlanetaryFeatures = (props: { onClose: () => void }) => {
  const { onClose } = props;
  const [body, setBody] = useState<string | null>();
  const [type, setType] = useState<string | null>();
  const [feature, setFeature] = useState<string | null>();
  const router = useRouter();

  const { data: submissionResult, mutate: submit } = useMutation({
    mutationKey: ['/api/experiments/planetary', { body, type, feature }],
    mutationFn: async (body: { body: string; type: string; feature: string }) => {
      const { data } = await axios.post<PlanetaryApiResponse>('/api/experiments/planetary', body);
      return data;
    },
    onSuccess: (data) => {
      if (data.bibcodes.length <= BIGQUERY_THRESHOLD) {
        const params: IADSApiSearchParams = {
          q: `full:("${getPlainFeatureName(feature)}") identifier:(${wrapAndJoin(data.bibcodes)})`,
        };
        const search = makeSearchParams(params);
        void router.push({ pathname: '/search', search });
        onClose();
      }
    },
  });

  const { data: bigQueryResult } = useVaultBigQuerySearch(submissionResult?.bibcodes ?? [], {
    enabled: submissionResult?.bibcodes?.length > BIGQUERY_THRESHOLD,
  });

  useEffect(() => {
    if (bigQueryResult?.qid) {
      const params = Q.setFQ('selection', `docs(${bigQueryResult.qid})`, {
        q: `full:("${getPlainFeatureName(feature)}")`,
      });
      const search = makeSearchParams(params);
      void router.push({ pathname: '/search', search });
      onClose();
    }
  }, [bigQueryResult]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isNil(body) || isNil(type) || isNil(feature)) {
      return;
    }
    submit({ body, type, feature });
  };

  return (
    <>
      <ModalHeader>
        <Center>
          <Heading as="h2" size="md">
            Search Planetary Features {'  '}
            <Icon as={GlobeAltIcon} fontSize="24" />
          </Heading>
        </Center>
      </ModalHeader>
      <ModalBody p="6">
        <form onSubmit={handleSubmit}>
          <Stack spacing="6">
            <BodySelect onChange={setBody} />
            <TypeSelect body={body} onChange={setType} />
            <FeatureSelect body={body} type={type} onChange={setFeature} />
            <Button type="submit" disabled={isNil(body) || isNil(type) || isNil(type)}>
              Search
            </Button>
          </Stack>
        </form>
      </ModalBody>
    </>
  );
};

const arrayToSelectOption = (value: Array<string>) => value.map((v) => ({ id: v, value: v, label: v }));
const getPlainFeatureName = (feature: string) => feature.split(' (')[0];
const wrapAndJoin = (bibcodes: Array<string>) => bibcodes.map((b) => `"${b}"`).join(' OR ');

const BodySelect = ({ onChange }: { onChange: (value: string) => void }) => {
  const { data, isLoading } = useQuery(['/api/experiments/planetary'], {
    queryFn: async ({ queryKey: [url] }) => {
      const { data } = await axios.get<PlanetaryApiResponse>(url);
      return data;
    },
  });

  const formattedData = useMemo(() => arrayToSelectOption(data?.bodies ?? []), [data]);
  useEffect(() => {
    if (data?.bodies?.length === 1) {
      onChange(data.bodies[0]);
    }
  }, [data]);

  return (
    <Skeleton isLoaded={!isLoading}>
      <Select
        hideLabel={false}
        label="Body"
        id="body"
        options={formattedData}
        name="body"
        onChange={(value) => onChange(value.id)}
        isSearchable
        defaultValue={formattedData[0]}
      />
    </Skeleton>
  );
};
const TypeSelect = ({ body, onChange }: { body?: string; onChange: (value: string) => void }) => {
  const { data, isLoading } = useQuery<
    PlanetaryApiResponse,
    PlanetaryApiResponse,
    PlanetaryApiResponse,
    [string, { body?: string; type?: string; feature?: string }]
  >(['/api/experiments/planetary', { body }], {
    queryFn: async ({ queryKey: [url, params] }) => {
      const { data } = await axios.get<PlanetaryApiResponse>(url, { params });
      return data;
    },
    enabled: !!body,
  });

  const formattedData = useMemo(() => arrayToSelectOption(data?.types ?? []), [data]);

  useEffect(() => {
    if (data?.types?.length > 0) {
      onChange(data.types[0]);
    }
  }, [data]);

  return (
    <Skeleton isLoaded={!isLoading}>
      <Select
        hideLabel={false}
        label="Type"
        id="type"
        options={formattedData}
        name="type"
        onChange={(value) => onChange(value.id)}
        isSearchable
        defaultValue={formattedData[0]}
      />
    </Skeleton>
  );
};

const FeatureSelect = ({
  body,
  type,
  onChange,
}: {
  body?: string;
  type?: string;
  onChange: (value: string) => void;
}) => {
  const { data, isLoading } = useQuery<
    PlanetaryApiResponse,
    PlanetaryApiResponse,
    PlanetaryApiResponse,
    [string, { body?: string; type?: string; feature?: string }]
  >(['/api/experiments/planetary', { body, type }], {
    queryFn: async ({ queryKey: [url, params] }) => {
      const { data } = await axios.get<PlanetaryApiResponse>(url, { params });
      return data;
    },
    enabled: !!body && !!type,
  });

  const formattedData = useMemo(() => arrayToSelectOption(data?.features ?? []), [data]);

  useEffect(() => {
    if (data?.features?.length > 0) {
      onChange(data.features[0]);
    }
  }, [data]);

  return (
    <Skeleton isLoaded={!isLoading}>
      <Select
        hideLabel={false}
        label="Features"
        id="features"
        name="features"
        options={formattedData}
        isSearchable
        defaultValue={formattedData[0]}
        onChange={(value) => onChange(value.id)}
      />
    </Skeleton>
  );
};
