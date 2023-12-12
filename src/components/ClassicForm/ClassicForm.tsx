import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Checkbox,
  CheckboxGroup,
  Code,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
  VisuallyHidden,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { BibstemPicker, Expandable, IRawClassicFormState, SimpleCopyButton, SimpleLink, Sort } from '@components';
import { APP_DEFAULTS } from '@config';
import { useErrorMessage } from '@lib/useErrorMessage';
import { useIsClient } from '@lib/useIsClient';
import { useRouter } from 'next/router';
import PT from 'prop-types';
import { FormEventHandler, useMemo } from 'react';
import { Control, Controller, useForm, UseFormRegisterReturn, useWatch } from 'react-hook-form';
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
    <form method="post" action={router.route} onSubmit={formSubmit} aria-describedby="form-title">
      <Stack direction="column" spacing={5} aria-describedby="form-title">
        <VisuallyHidden as="h2" id="form-title">
          Classic Form
        </VisuallyHidden>

        {/* Collection selection */}
        <FormControl aria-labelledby="collection-group">
          <VisuallyHidden id="collection-group">Collection</VisuallyHidden>
          <FormLabel>Limit Query</FormLabel>
          <CheckboxGroup defaultValue={['astronomy']}>
            <HStack spacing="6">
              <Checkbox value="astronomy" {...register('limit')}>
                Astronomy
              </Checkbox>
              <Checkbox value="physics" {...register('limit')}>
                Physics
              </Checkbox>
              <Checkbox value="general" {...register('limit')}>
                General
              </Checkbox>
              <Checkbox value="earthscience" {...register('limit')}>
                Earth Science
              </Checkbox>
            </HStack>
          </CheckboxGroup>
        </FormControl>

        {/* Author text area */}
        <FormControl aria-labelledby="author-group">
          <VisuallyHidden id="author-group">Author</VisuallyHidden>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor={'author'}>Author</FormLabel>
            <LogicRadios variant="andor" radioProps={register('logic_author')} />
          </Flex>
          <Textarea
            {...register('author')}
            as="textarea"
            id="author"
            rows={3}
            placeholder={`Smith, John A\nSmith, Jane B`}
          />
          <FormHelperText lineHeight="5">
            <Text>Author names, enter (Last, First M) one per line.</Text>
            <Text fontWeight="bold">Example Operators:</Text>
            <Text>
              Use <Code>-</Code> to filter out an author. (Ex: <Code>-Smith, John</Code>)
            </Text>
            <Text>
              Use <Code>=</Code> to restrict name expansion. For example <Code>=Smith, Jim</Code> will match "Smith,
              Jim" but not "Smith, James".
            </Text>
            <Text>
              Surround name with <Code>^ $</Code> to match papers with only one particular author. (Ex:{' '}
              <Code>^Smith, J$</Code>)
            </Text>
            <Text>
              <SimpleLink href="https://ui.adsabs.harvard.edu/help/search/search-syntax#author">Learn More</SimpleLink>
            </Text>
          </FormHelperText>
        </FormControl>

        {/* Object text area */}
        <FormControl aria-labelledby="object-group">
          <VisuallyHidden id="object-group">Object</VisuallyHidden>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor="object">Object</FormLabel>
            <LogicRadios variant="andor" radioProps={register('logic_object')} />
          </Flex>
          <Textarea
            {...register('object')}
            as="textarea"
            id="object"
            rows={3}
            placeholder={`M 31\nHD 187642\nSgr A*`}
          />
          <FormHelperText>SIMBAD object search, one per line.</FormHelperText>
        </FormControl>

        {/* Publication dates */}
        <Stack
          direction={['column', 'row']}
          justifyContent="space-evenly"
          spacing={5}
          role="group"
          aria-labelledby="publication-group"
          data-testid="publication-dates"
        >
          <FormControl>
            <VisuallyHidden id="publication-group">Publication</VisuallyHidden>
            <FormLabel htmlFor="pubdate_start">Publication Date Start</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" children={<CalendarIcon color="gray.300" />} />
              <Input placeholder="YYYY/MM" type="text" {...register('pubdate_start')} />
            </InputGroup>
            <FormHelperText>Ex: "2011/04"</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="pubdate_end">Publication Date End</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" children={<CalendarIcon color="gray.300" />} />
              <Input placeholder="YYYY/MM" {...register('pubdate_end')} />
            </InputGroup>
            <FormHelperText>Ex: "2014/12"</FormHelperText>
          </FormControl>
        </Stack>

        {/* Title */}
        <FormControl aria-labelledby="title-group">
          <VisuallyHidden id="title-group">Title</VisuallyHidden>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor="title">Title</FormLabel>
            <LogicRadios variant="all" radioProps={register('logic_title')} />
          </Flex>
          <Input {...register('title')} />
          <FormHelperText>Ex: "Content of the Future in the ADS"</FormHelperText>
        </FormControl>

        {/* Abstract / Keywords */}
        <FormControl aria-labelledby="abstract-keywords-group">
          <VisuallyHidden id="abstract-keywords-group">Abstract / Keywords</VisuallyHidden>
          <Flex direction="row" justifyContent="space-between">
            <FormLabel htmlFor="abstract_keywords">Abstract / Keywords</FormLabel>
            <LogicRadios variant="all" radioProps={register('logic_abstract_keywords')} />
          </Flex>
          <Input {...register('abstract_keywords')} />
          <FormHelperText>Ex: "Dark Energy"</FormHelperText>
        </FormControl>

        {/* Property */}
        <FormControl aria-labelledby="property-group">
          <VisuallyHidden id="property-group">Property</VisuallyHidden>
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
              <FormControl aria-labelledby="bibstem">
                <VisuallyHidden id="bibstem">Publications</VisuallyHidden>
                <FormLabel htmlFor="bibstem-picker">Publications</FormLabel>
                <BibstemPicker isMultiple onChange={(items) => field.onChange(items)} id="bibstem-picker" />
                <FormHelperText>Ex. "A&amp;A" or "-A&amp;A"</FormHelperText>
              </FormControl>
            )}
          />
        ) : (
          <FormControl aria-labelledby="bibstem">
            <VisuallyHidden id="bibstem">Publications</VisuallyHidden>
            <FormLabel htmlFor="bibstem">Publication</FormLabel>
            <Input placeholder="Publication" {...register('bibstems')} />
            <FormHelperText>Start typing to search journal database (ex. "ApJ")</FormHelperText>
          </FormControl>
        )}

        {/* Sort */}
        <FormControl aria-labelledby="sort">
          <VisuallyHidden id="sort">Sort</VisuallyHidden>
          <FormLabel htmlFor="sort">Sort</FormLabel>
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

        <CurrentQuery control={control} />
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

const CurrentQuery = (props: { control: Control<IClassicFormState> }) => {
  const { control } = props;
  const values = useWatch<IClassicFormState>({ control });
  const query = useMemo(() => {
    try {
      return new URLSearchParams(getSearchQuery(values as IRawClassicFormState)).get('q');
    } catch (e) {
      return <Text color="red.500">{(e as Error)?.message}</Text>;
    }
  }, [values]);

  return (
    <Expandable
      title="Generated Query"
      description={
        <HStack>
          <Code>{query}</Code>
          {typeof query === 'string' ? <SimpleCopyButton text={query} /> : null}
        </HStack>
      }
    ></Expandable>
  );
};
