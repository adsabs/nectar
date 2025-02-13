import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import { Button, ButtonProps, IconButton, MenuItem, MenuItemProps, useClipboard } from '@chakra-ui/react';
import { ReactElement, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-html-to-clipboard';

export interface ICopyButtonProps extends ButtonProps {
  text: string;
  onCopyComplete?: () => void;
  timeout?: number;
  asHtml?: boolean;
  iconPos?: 'left' | 'right';
}

const DEFAULT_TIMEOUT = 1500;

export const SimpleCopyButton = (props: ICopyButtonProps): ReactElement => {
  const { text, onCopyComplete, timeout = DEFAULT_TIMEOUT, asHtml = false, ...rest } = props;

  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (hasCopied) {
      const timeoutId = setTimeout(() => {
        setHasCopied(false);
      }, timeout);

      return () => clearTimeout(timeoutId);
    }
  }, [hasCopied]);

  const handleCopied = () => {
    setHasCopied(true);
    onCopyComplete?.();
  };

  return (
    <CopyToClipboard text={text} onCopy={handleCopied} options={{ asHtml: asHtml }}>
      {hasCopied ? (
        <IconButton aria-label="copied" icon={<CheckIcon />} variant="link" color="green.500" {...rest} />
      ) : (
        <IconButton
          icon={<CopyIcon />}
          variant="link"
          aria-label="copy to clipboard"
          onClick={handleCopied}
          {...rest}
        />
      )}
    </CopyToClipboard>
  );
};

export const LabeledCopyButton = (props: ICopyButtonProps & { label: string }): ReactElement => {
  const { label, text, onCopyComplete, timeout = DEFAULT_TIMEOUT, iconPos = 'left', asHtml = false, ...rest } = props;
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (hasCopied) {
      const timeoutId = setTimeout(() => {
        setHasCopied(false);
      }, timeout);

      return () => clearTimeout(timeoutId);
    }
  }, [hasCopied]);

  const handleCopied = () => {
    setHasCopied(true);
    onCopyComplete?.();
  };

  return (
    <CopyToClipboard text={text} onCopy={handleCopied} options={{ asHtml: asHtml }}>
      <Button
        variant="link"
        aria-label="copy to clipboard"
        {...(iconPos === 'left' ? { leftIcon: <CopyIcon /> } : { rightIcon: <CopyIcon /> })}
        {...rest}
      >
        {hasCopied ? 'Copied to clipboard!' : label}
      </Button>
    </CopyToClipboard>
  );
};

export const CopyMenuItem = (props: MenuItemProps & { label: string; text: string }): ReactElement => {
  const { label, text, ...rest } = props;
  const { onCopy, setValue } = useClipboard(text);

  useEffect(() => {
    setValue(text);
  }, [text]);

  return (
    <MenuItem onClick={onCopy} {...rest}>
      {label} <CopyIcon mx={2} />
    </MenuItem>
  );
};
