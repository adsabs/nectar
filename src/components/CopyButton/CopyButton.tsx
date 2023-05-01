import { CopyIcon } from '@chakra-ui/icons';
import { Button, ButtonProps, IconButton, Text, useClipboard, UseClipboardOptions } from '@chakra-ui/react';
import { ReactElement, useEffect } from 'react';

export interface ICopyButtonProps extends ButtonProps {
  text: string;
  options?: UseClipboardOptions;
}

export const SimpleCopyButton = (props: ICopyButtonProps): ReactElement => {
  const { text, options, ...rest } = props;
  const { hasCopied, onCopy, setValue } = useClipboard(text, options);

  useEffect(() => {
    setValue(text);
  }, [text]);

  return (
    <>
      <IconButton icon={<CopyIcon />} variant="link" aria-label="copy to clipboard" onClick={onCopy} {...rest} />
      {hasCopied && (
        <Text display={'inline'} color={'blue.500'}>
          Copied!
        </Text>
      )}
    </>
  );
};

export const LabeledCopyButton = (props: ICopyButtonProps & { label: string }): ReactElement => {
  const { label, text, options, ...rest } = props;
  const { hasCopied, onCopy, setValue } = useClipboard(text, options);

  useEffect(() => {
    setValue(text);
  }, [text]);

  return (
    <>
      <Button leftIcon={<CopyIcon />} variant="link" aria-label="copy to clipboard" onClick={onCopy} {...rest}>
        {hasCopied ? 'Copied to clipboard!' : label}
      </Button>
    </>
  );
};
