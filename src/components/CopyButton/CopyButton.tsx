import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { Button, ButtonProps, IconButton, Tooltip, useClipboard, UseClipboardOptions } from '@chakra-ui/react';
import { useEffect } from 'react';

export interface ICopyButtonProps extends ButtonProps {
  text: string;
  onCopyComplete?: () => void;
  options?: UseClipboardOptions;
  iconPos?: 'left' | 'right';
}

export const SimpleCopyButton = (props: ICopyButtonProps) => {
  const { text, options, onCopyComplete, ...rest } = props;
  const { hasCopied, onCopy, setValue } = useClipboard(text, options);

  useEffect(() => {
    setValue(text);
  }, [text]);

  useEffect(() => {
    if (hasCopied) {
      onCopyComplete?.();
    }
  }, [hasCopied]);

  return (
    <Tooltip label={hasCopied ? 'Copied' : 'Copy to clipboard'}>
      {hasCopied ? (
        <IconButton aria-label="copied" icon={<CheckIcon />} variant="link" color="green.500" {...rest} />
      ) : (
        <IconButton icon={<CopyIcon />} variant="link" aria-label="copy to clipboard" onClick={onCopy} {...rest} />
      )}
    </Tooltip>
  );
};

export const LabeledCopyButton = (props: ICopyButtonProps & { label: string }) => {
  const { label, text, options, onCopyComplete, iconPos = 'left', ...rest } = props;
  const { hasCopied, onCopy, setValue } = useClipboard(text, options);

  useEffect(() => {
    setValue(text);
  }, [text]);

  useEffect(() => {
    if (hasCopied) {
      onCopyComplete?.();
    }
  }, [hasCopied]);

  return (
    <Button
      variant="link"
      aria-label="copy to clipboard"
      onClick={onCopy}
      {...(iconPos === 'left' ? { leftIcon: <CopyIcon /> } : { rightIcon: <CopyIcon /> })}
      {...rest}
    >
      {hasCopied ? 'Copied to clipboard!' : label}
    </Button>
  );
};
