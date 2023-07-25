import { ExportApiFormatKey, useGetExportCitation } from '@api';
import { IFeedbackParams } from '@api/feedback';
import { Flex, HStack, FormControl, FormLabel, Input, Button, AlertStatus, useDisclosure } from '@chakra-ui/react';
import { useStore } from '@store';
import { Field, FieldProps, Form, Formik, FormikProps } from 'formik';
import { omit } from 'ramda';
import { useEffect, useRef, useState } from 'react';
import { PreviewModal } from '../PreviewModal';
import { MissingReferenceTable } from './MissingReferenceTable';
import { FormValues } from './types';

export const MissingReferenceForm = ({
  onOpenAlert,
}: {
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
}) => {
  const username = useStore((state) => state.user.username);

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    references: [],
  };

  const formikRef = useRef<FormikProps<FormValues>>();

  const [params, setParams] = useState<IFeedbackParams>(null);

  const { data: refStringsData, error: refStringsError } = useGetExportCitation(
    {
      format: ExportApiFormatKey.custom,
      customFormat: '%R (%1l (%Y), %Q)',
      bibcode: formikRef.current?.values.references.map((r) => r.cited),
    },
    { enabled: !!params },
  );

  // once refstrings are fetched, finish setting params and open preview
  useEffect(() => {
    if (refStringsError) {
      onOpenAlert({ status: 'error', title: 'Error processing data' });
    } else if (refStringsData) {
      const refStrings = refStringsData.export.split(/\n/g);
      setParams((prev) => ({
        ...prev,
        references: formikRef.current.values.references.map(({ citing, cited }, index) => ({
          citing,
          cited,
          refstring: refStrings[index],
        })),
      }));
      openPreview();
    }
  }, [refStringsData, refStringsError]);

  // clear params when preview closed
  useEffect(() => {
    if (!isPreviewOpen) {
      setParams(null);
    }
  }, [isPreviewOpen]);

  const handlePreview = (values: FormValues) => {
    const { email, name } = values;

    setParams({
      origin: 'user_submission',
      'g-recaptcha-response': null,
      _subject: 'Missing References',
      name,
      email,
      references: null,
    });
  };

  // submitted
  const handleOnSuccess = () => {
    onOpenAlert({ status: 'success', title: 'Feedback submitted successfully' });
    formikRef.current.resetForm();
  };

  // submission error
  const handleError = (error: string) => {
    onOpenAlert({ status: 'error', title: error });
  };

  return (
    <Formik initialValues={initialFormValues} onSubmit={handlePreview} innerRef={formikRef}>
      {({ values }) => (
        <>
          <Form>
            <Flex direction="column" gap={4} my={2}>
              <HStack gap={2}>
                <Field name="name">
                  {({ field }: FieldProps) => (
                    <FormControl isRequired>
                      <FormLabel>Name</FormLabel>
                      <Input {...field} autoFocus />
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
              <MissingReferenceTable />
              <HStack mt={2}>
                <Button type="submit">Preview</Button>
                <Button type="reset" variant="outline">
                  Reset
                </Button>
              </HStack>
            </Flex>
          </Form>
          {/* intentionally make this remount each time so that recaptcha is regenerated */}
          {isPreviewOpen && (
            <PreviewModal
              isOpen={true}
              title="Preview Missing Reference Feedback"
              submitterInfo={JSON.stringify({ name: values.name, email: values.email }, null, 2)}
              mainContentTitle="Missing References"
              mainContent={JSON.stringify(omit(['name', 'email'], values), null, 2)}
              onClose={closePreview}
              onSuccess={handleOnSuccess}
              onError={handleError}
              params={params}
            />
          )}
        </>
      )}
    </Formik>
  );
};
