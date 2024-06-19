import { Text, TextProps } from '@chakra-ui/react';
import { SimpleLink } from '@/components';

export const RecaptchaMessage = (props: TextProps) => {
  return (
    <Text fontSize="sm" color="gray.500" mt="4" {...props}>
      This site is protected by reCAPTCHA and the Google
      <SimpleLink display="inline" href={'https://policies.google.com/privacy'}>
        {' '}
        Privacy Policy
      </SimpleLink>{' '}
      and
      <SimpleLink display="inline" href={'https://policies.google.com/terms'}>
        {' '}
        Terms of Service
      </SimpleLink>{' '}
      apply.
    </Text>
  );
};
