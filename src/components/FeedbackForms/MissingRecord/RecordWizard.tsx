import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  Stepper,
  StepSeparator,
  StepStatus,
  StepTitle,
  Textarea,
  useSteps,
} from '@chakra-ui/react';
import React, { useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { AuthorsField } from './AuthorsField';
import { AuthorsTableHandle } from './AuthorsTable';
import { KeywordsField } from './KeywordsField';
import { PubDateField } from './PubDateField';
import { ReferencesField } from './ReferencesField';
import { ReferencesTableHandle } from './ReferencesField';
import { UrlsField } from './UrlsField';
import { COLLECTIONS, FormValues } from './types';

interface WizardStep {
  title: string;
  description: string;
  fields: (keyof FormValues)[];
}

const STEPS: WizardStep[] = [
  {
    title: 'Contact',
    description: 'Your info',
    fields: ['name', 'email'],
  },
  {
    title: 'Publication',
    description: 'Record details',
    fields: ['title', 'collection', 'publication', 'pubDate', 'bibcode'],
  },
  {
    title: 'Authors',
    description: 'Authorship',
    fields: ['authors', 'noAuthors'],
  },
  {
    title: 'Content',
    description: 'Abstract & more',
    fields: ['abstract', 'keywords', 'urls'],
  },
  {
    title: 'References',
    description: 'Wrap up',
    fields: ['references', 'comments'],
  },
];

// first focusable field per step; steps with only custom components are omitted
const STEP_FOCUS: Partial<Record<number, keyof FormValues>> = {
  0: 'name',
  1: 'title',
  3: 'abstract',
  4: 'comments',
};

interface RecordWizardProps {
  onPreview: (e?: React.BaseSyntheticEvent) => void;
  isLoading: boolean;
}

export function RecordWizard({ onPreview, isLoading }: RecordWizardProps) {
  const {
    activeStep,
    goToNext,
    goToPrevious,
    setActiveStep: goToStep,
  } = useSteps({
    index: 0,
    count: STEPS.length,
  });

  const authorsRef = useRef<AuthorsTableHandle>(null);
  const referencesRef = useRef<ReferencesTableHandle>(null);
  const {
    trigger,
    register,
    control,
    setFocus,
    formState: { errors },
  } = useFormContext<FormValues>();

  const handleNext = async () => {
    // Flush any in-progress row before validating
    authorsRef.current?.flush();
    referencesRef.current?.flush();
    const valid = await trigger(STEPS[activeStep].fields);
    if (valid) {
      goToNext();
      const nextStep = activeStep + 1;
      const focusField = STEP_FOCUS[nextStep];
      if (focusField) {
        // defer until the next step's DOM is rendered
        setTimeout(() => setFocus(focusField), 0);
      }
    }
  };

  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <Box>
      <Stepper index={activeStep} mb={8} size="sm" colorScheme="blue">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeStep;
          return (
            <Step
              key={index}
              onClick={isCompleted ? () => goToStep(index) : undefined}
              cursor={isCompleted ? 'pointer' : undefined}
            >
              <StepIndicator>
                <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
              </StepIndicator>
              <Box flexShrink={0}>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          );
        })}
      </Stepper>

      <Box minH="300px">
        {activeStep === 0 && (
          <Flex direction={{ base: 'column', sm: 'row' }} gap={2}>
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input {...register('name')} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input {...register('email')} type="email" />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
          </Flex>
        )}

        {activeStep === 1 && (
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Collection</FormLabel>
              <Controller
                name="collection"
                control={control}
                render={({ field: { ref: _ref, ...rest } }) => (
                  <CheckboxGroup {...rest}>
                    <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between">
                      {COLLECTIONS.map((c) => (
                        <Checkbox key={`collection-${c.value}`} value={c.value}>
                          {c.label}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                )}
              />
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.title}>
              <FormLabel>Title</FormLabel>
              <Input {...register('title')} />
              <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
            </FormControl>
            <Flex direction={{ base: 'column', sm: 'row' }} gap={2}>
              <FormControl isRequired isInvalid={!!errors.publication}>
                <FormLabel>Publication</FormLabel>
                <Input {...register('publication')} />
                <FormErrorMessage>{errors.publication?.message}</FormErrorMessage>
              </FormControl>
              <PubDateField />
            </Flex>
            <FormControl>
              <FormLabel>Bibcode / DOI (optional)</FormLabel>
              <Input {...register('bibcode')} placeholder="e.g. 2024ApJ...123..456A" />
            </FormControl>
          </Stack>
        )}

        {activeStep === 2 && <AuthorsField ref={authorsRef} />}

        {activeStep === 3 && (
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Abstract</FormLabel>
              <Textarea {...register('abstract')} rows={8} />
            </FormControl>
            <KeywordsField />
            <UrlsField />
          </Stack>
        )}

        {activeStep === 4 && (
          <Stack spacing={4}>
            <ReferencesField ref={referencesRef} />
            <FormControl>
              <FormLabel>User Comments</FormLabel>
              <Textarea {...register('comments')} />
            </FormControl>
          </Stack>
        )}
      </Box>

      <HStack mt={6} justify="space-between">
        <Button variant="outline" onClick={goToPrevious} isDisabled={activeStep === 0 || isLoading}>
          Back
        </Button>
        {isLastStep ? (
          <Button onClick={onPreview} isLoading={isLoading}>
            Preview
          </Button>
        ) : (
          <Button onClick={handleNext} isDisabled={isLoading}>
            Next
          </Button>
        )}
      </HStack>
    </Box>
  );
}
