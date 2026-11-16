import { CheckIcon, CopyIcon, WarningIcon } from '@chakra-ui/icons';
import { Button, ButtonProps, IconButton, MenuItem, MenuItemProps, VisuallyHidden } from '@chakra-ui/react';
import { ReactElement, useEffect, useState } from 'react';

import { copyToClipboard } from '@/lib/clipboard';

interface ICopyProps {
  text: string;
  onCopyComplete?: () => void;
  timeout?: number;
  asHtml?: boolean;
}

export interface ICopyButtonProps extends ICopyProps, ButtonProps {
  iconPos?: 'left' | 'right';
}

const DEFAULT_TIMEOUT = 1500;

interface UseCopyActionInput {
  text: string;
  asHtml: boolean;
  timeout: number;
  onCopyComplete?: () => void;
}

interface UseCopyActionResult {
  hasCopied: boolean;
  hasFailed: boolean;
  copy: () => void;
}

const useCopyAction = ({ text, asHtml, timeout, onCopyComplete }: UseCopyActionInput): UseCopyActionResult => {
  const [hasCopied, setHasCopied] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (!hasCopied && !hasFailed) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHasCopied(false);
      setHasFailed(false);
    }, timeout);
    return () => clearTimeout(timeoutId);
  }, [hasCopied, hasFailed, timeout]);

  const copy = (): void => {
    copyToClipboard({ content: text, asHtml })
      .then(() => {
        setHasCopied(true);
        setHasFailed(false);
        onCopyComplete?.();
      })
      .catch((): void => {
        setHasCopied(false);
        setHasFailed(true);
      });
  };

  return { hasCopied, hasFailed, copy };
};

const FailureStatus = (): ReactElement => (
  <>
    <WarningIcon color="orange.500" aria-hidden="true" />
    <VisuallyHidden role="status">Copy failed</VisuallyHidden>
  </>
);

export const SimpleCopyButton = (props: ICopyButtonProps): ReactElement => {
  const { text, onCopyComplete, timeout = DEFAULT_TIMEOUT, asHtml = false, ...rest } = props;
  const { hasCopied, hasFailed, copy } = useCopyAction({ text, asHtml, timeout, onCopyComplete });

  return (
    <>
      {hasCopied ? (
        <IconButton aria-label="copied" icon={<CheckIcon />} variant="link" color="green.500" {...rest} />
      ) : (
        <IconButton icon={<CopyIcon />} variant="link" aria-label="copy to clipboard" onClick={copy} {...rest} />
      )}
      {hasFailed && <FailureStatus />}
    </>
  );
};

export const LabeledCopyButton = (props: ICopyButtonProps & { label: string }): ReactElement => {
  const { label, text, onCopyComplete, timeout = DEFAULT_TIMEOUT, iconPos = 'left', asHtml = false, ...rest } = props;
  const { hasCopied, hasFailed, copy } = useCopyAction({ text, asHtml, timeout, onCopyComplete });

  return (
    <>
      <Button
        variant="link"
        aria-label="copy to clipboard"
        onClick={copy}
        {...(iconPos === 'left' ? { leftIcon: <CopyIcon /> } : { rightIcon: <CopyIcon /> })}
        {...rest}
      >
        {hasCopied ? 'Copied to clipboard!' : label}
      </Button>
      {hasFailed && <FailureStatus />}
    </>
  );
};

export const CopyMenuItem = (props: MenuItemProps & ICopyProps & { label: string }): ReactElement => {
  const { label, text, timeout = DEFAULT_TIMEOUT, onCopyComplete, asHtml = false, ...rest } = props;
  const { copy } = useCopyAction({ text, asHtml, timeout, onCopyComplete });

  return (
    <MenuItem onClick={copy} {...rest}>
      {label} <CopyIcon mx={2} />
    </MenuItem>
  );
};
