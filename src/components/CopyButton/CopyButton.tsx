import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { Button, ButtonProps, IconButton, Tooltip, useClipboard, UseClipboardOptions } from '@chakra-ui/react';
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
      <Tooltip label={hasCopied ? 'Copied' : 'Copy to clipboard'}>
        {hasCopied ? (
          <IconButton aria-label="copied" icon={<CheckIcon />} variant="link" color="green.500" {...rest} />
        ) : (
          <IconButton icon={<CopyIcon />} variant="link" aria-label="copy to clipboard" onClick={onCopy} {...rest} />
        )}
      </Tooltip>
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
