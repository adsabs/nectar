import { Button } from '@chakra-ui/button';
import { Checkbox, CheckboxGroup } from '@chakra-ui/checkbox';
import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/form-control';
import { CalendarIcon } from '@chakra-ui/icons';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/input';
import { Flex, HStack, Stack } from '@chakra-ui/layout';
import { Radio, RadioGroup } from '@chakra-ui/radio';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';
import { Textarea } from '@chakra-ui/textarea';
import VisuallyHidden from '@chakra-ui/visually-hidden';
import { BibstemPicker, Sort } from '@components';
import { APP_DEFAULTS } from '@config';
import { useErrorMessage } from '@hooks/useErrorMessage';
import { useIsClient } from '@hooks/useIsClient';
import { useRouter } from 'next/router';
import PT from 'prop-types';
import { FormEventHandler } from 'react';
import { Controller, useForm, UseFormRegisterReturn } from 'react-hook-form';
import { getSearchQuery } from './helpers';
import { IClassicFormState } from './types';

const propTypes = {
  ssrError: PT.string,
};

export const defaultClassicFormState: IClassicFormState = {
  limit: ['astronomy'],
  author: '',
  logic_author: 'and',
  object: '',
  logic_object: 'and',
  pubdate_start: '',
  pubdate_end: '',
  title: '',
  logic_title: 'and',
  abstract_keywords: '',
  logic_abstract_keywords: 'and',
  property: [],
  bibstems: '',
  sort: APP_DEFAULTS.SORT,
};

export interface IClassicFormProps {
  ssrError: string;
}

export const ClassicForm = (props: IClassicFormProps) => {
  const isClient = useIsClient();
  const router = useRouter();
  const [queryError, setQueryError] = useErrorMessage<string>(props.ssrError);

  const { register, control, handleSubmit } = useForm<IClassicFormState>({
    defaultValues: defaultClassicFormState,
  });

  const formSubmit: FormEventHandler = (e) => {
    e.preventDefault();

    void handleSubmit((params) => {
      try {
        void router.push({ pathname: '/search', search: getSearchQuery(params) });
      } catch (e) {
        setQueryError((e as Error)?.message);
      }
    })(e);
  };

  return (
    <form method="post" action={router.route} onFilterSubmit={formSubmit} aria-describedby="form-title">
      <Stack direction="column" spacing={5}>
        <VisuallyHidden as="h2" id="form-title">
          Classic Form
        </VisuallyHidden>

        {/* Collection selection */}
        <FormControl>
          <FormLabel>Limit Query</FormLabel>
          <CheckboxGroup defaultValue={['astronomy']}>
            <HStack>
              <Checkbox value="astronomy" {...register('limit')}>
                Astronomy
              </Checkbox>
              <Checkbox value="physics" {...register('limit')}>
                Physics
              </Checkbox>
              <Checkbox value="general" {...register('limit')}>
                General
              </Checkbox>
            </HStack>
          </CheckboxGroup>
        </FormControl>

        {/* Author text area */}
        <FormControl>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor={'author'}>Author</FormLabel>
            <LogicRadios variant="andor" radioProps={register('logic_author')} />
          </Flex>
          <Textarea {...register('author')} as="textarea" id="author" rows={3} />
          <FormHelperText>Author names, enter (Last, First M) one per line</FormHelperText>
        </FormControl>

        {/* Object text area */}
        <FormControl>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor={'object'}>Object</FormLabel>
            <LogicRadios variant="andor" radioProps={register('logic_object')} />
          </Flex>
          <Textarea {...register('object')} as="textarea" id="object" rows={3} />
          <FormHelperText>SIMBAD object search (one per line)</FormHelperText>
        </FormControl>

        {/* Publication dates */}
        <Stack direction={['column', 'row']} justifyContent="space-evenly" spacing={5}>
          <FormControl>
            <FormLabel>Publication Date Start</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" children={<CalendarIcon color="gray.300" />} />
              <Input placeholder="YYYY/MM" {...register('pubdate_start')} />
            </InputGroup>
            <FormHelperText>Ex: "2011/04"</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Publication Date End</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" children={<CalendarIcon color="gray.300" />} />
              <Input placeholder="YYYY/MM" {...register('pubdate_end')} />
            </InputGroup>
            <FormHelperText>Ex: "2014/12"</FormHelperText>
          </FormControl>
        </Stack>

        {/* Title */}
        <FormControl>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor="title">Title</FormLabel>
            <LogicRadios variant="all" radioProps={register('logic_title')} />
          </Flex>
          <Input {...register('title')} />
          <FormHelperText>Ex: "Content of the Future in the ADS"</FormHelperText>
        </FormControl>

        {/* Abstract / Keywords */}
        <FormControl>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor="abstract_keywords">Abstract / Keywords</FormLabel>
            <LogicRadios variant="all" radioProps={register('logic_abstract_keywords')} />
          </Flex>
          <Input {...register('abstract_keywords')} />
          <FormHelperText>Ex: "Dark Energy"</FormHelperText>
        </FormControl>

        {/* Property */}
        <FormControl>
          <FormLabel htmlFor="property">Property</FormLabel>
          <CheckboxGroup>
            <HStack spacing={4}>
              <Checkbox fontWeight="bold" value="refereed-only" {...register('property')}>
                Refereed only
              </Checkbox>
              <Checkbox fontWeight="bold" value="articles-only" {...register('property')}>
                Articles only
              </Checkbox>
            </HStack>
          </CheckboxGroup>
        </FormControl>

        {/* BibstemPicker */}
        {isClient ? (
          <Controller
            name="bibstems"
            control={control}
            render={({ field }) => (
              <FormControl>
                <FormLabel>Publications</FormLabel>
                <BibstemPicker isMultiple onChange={(items) => field.onChange(items)} />
                <FormHelperText>Ex. "A&amp;A" or "-A&amp;A"</FormHelperText>
              </FormControl>
            )}
          />
        ) : (
          <FormControl>
            <FormLabel htmlFor="bibstem">Publication</FormLabel>
            <Input placeholder="Publication" {...register('bibstems')} />
            <FormHelperText>Start typing to search journal database (ex. "ApJ")</FormHelperText>
          </FormControl>
        )}

        {/* Sort */}
        <FormControl>
          <FormLabel>Sort</FormLabel>
          <Controller
            name="sort"
            control={control}
            render={({ field }) => (
              <Sort
                name={field.name}
                onChange={(sort) => field.onChange(sort)}
                sort={field.value}
                innerSelectProps={{
                  onBlur: field.onBlur,
                }}
                fullWidth
                useNativeWhenNoJs
              />
            )}
          />
        </FormControl>

        {/* Error processing form */}
        {queryError && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>There was a problem parsing input!</AlertTitle>
            <AlertDescription>{queryError}</AlertDescription>
          </Alert>
        )}

        <FormControl>
          <Button type="submit">Search</Button>
        </FormControl>
      </Stack>
    </form>
  );
};

ClassicForm.propTypes = propTypes;

const LogicRadios = (props: { variant: 'andor' | 'all'; radioProps: UseFormRegisterReturn }) => {
  const { variant, radioProps } = props;
  return (
    <RadioGroup defaultValue="and">
      <Stack spacing={4} direction="row">
        <Radio size="sm" {...radioProps} value="and">
          And
        </Radio>
        <Radio size="sm" {...radioProps} value="or">
          Or
        </Radio>
        {variant === 'all' && (
          <Radio size="sm" {...radioProps} value="boolean">
            Boolean
          </Radio>
        )}
      </Stack>
    </RadioGroup>
  );
};
