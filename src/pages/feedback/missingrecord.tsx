import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Text,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Button,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import {
  Collection,
  FormValues,
  IAuthor,
  IReference,
  IUrl,
  JsonPreviewModal,
  PreviewPanel,
  RecordPanel,
} from '@components/FeedbackForms';
import { useStore } from '@store';
import { Field, FieldProps, Form, Formik, FormikHelpers, FormikState } from 'formik';
import { NextPage } from 'next';
import { useState } from 'react';

const Record: NextPage = () => {
  const toast = useToast({ duration: 3000 });
  const username = useStore((state) => state.getUsername());

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    bibcode: '',
    collection: [] as Collection[],
    title: '',
    authors: [] as IAuthor[],
    publications: '',
    pubDate: new Date(),
    urls: [] as IUrl[],
    abstract: '',
    keywords: [] as string[],
    references: [] as IReference[],
    comments: '',
  };

  const [isNew, setIsNew] = useState(true);
  const [recordLoaded, setRecordLoaded] = useState(false);
  const [preview, setPreview] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure(); // for opening json view

  const handleTabChange = (i: number) => {
    setIsNew(i === 0);
  };

  const handleRecordLoaded = () => {
    setRecordLoaded(true);
  };

  const handlePreview = (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    setPreview(true);
    setSubmitting(false);
  };

  const handleClosePreview = () => {
    setPreview(false);
  };

  const handleSubmit = (values: FormValues, resetForm: (nextState?: Partial<FormikState<FormValues>>) => void) => {
    // TODO:
    console.log(values);
    toast({ status: 'success', title: 'Successfully submitted' });
    setPreview(false);
    resetForm();
  };

  return (
    <Formik initialValues={initialFormValues} onSubmit={handlePreview}>
      {({ values, isSubmitting, resetForm }) => (
        <>
          {!preview ? (
            <FeedbackLayout title="Submit or Correct an Abstract for the SciX Abstract Service">
              <Text my={2}>
                Please use the following form to submit a new bibliographic record to ADS or correct an existing record.
              </Text>

              <Form>
                <Flex direction="column" gap={4} my={2}>
                  <HStack gap={2}>
                    <Field name="name">
                      {({ field }: FieldProps) => (
                        <FormControl isRequired>
                          <FormLabel>Name</FormLabel>
                          <Input {...field} />
                        </FormControl>
                      )}
                    </Field>
                    <Field name="email">
                      {({ field }: FieldProps) => (
                        <FormControl isRequired>
                          <FormLabel>Email</FormLabel>
                          <Input type="email" {...field} />
                        </FormControl>
                      )}
                    </Field>
                  </HStack>
                  <Tabs variant="enclosed-colored" onChange={handleTabChange} mt={5} size="lg">
                    <TabList>
                      <Tab>New Record</Tab>
                      <Tab>Edit Record</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel p={5} pt={8}>
                        <RecordPanel isNew />
                      </TabPanel>
                      <TabPanel p={5} pt={8}>
                        <RecordPanel isNew={false} onRecordLoaded={handleRecordLoaded} />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                  {(isNew || (!isNew && recordLoaded)) && (
                    <HStack mt={2}>
                      <Button type="submit" isLoading={isSubmitting}>
                        Preview
                      </Button>
                      <Button type="reset" variant="outline">
                        Reset
                      </Button>
                    </HStack>
                  )}
                </Flex>
              </Form>
            </FeedbackLayout>
          ) : (
            <FeedbackLayout title="Preview Submission for Abstract for the SciX Abstract Service">
              <Button my={2} variant="link" onClick={onOpen}>
                View in JSON format
              </Button>
              <PreviewPanel data={values} />
              <HStack mt={2}>
                <Button onClick={() => handleSubmit(values, resetForm)}>Submit</Button>
                <Button variant="outline" onClick={handleClosePreview}>
                  Back
                </Button>
              </HStack>
            </FeedbackLayout>
          )}
          <JsonPreviewModal data={values} isOpen={isOpen} onClose={onClose} />
        </>
      )}
    </Formik>
  );
};

export default Record;
