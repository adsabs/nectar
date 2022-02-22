import { CopyIcon } from '@chakra-ui/icons';
import { IconButton, Text, useClipboard, UseClipboardOptions } from '@chakra-ui/react';
import { HTMLAttributes, ReactElement } from 'react';

export interface ICopyButtonProps extends HTMLAttributes<HTMLButtonElement> {
  text: string;
  options?: UseClipboardOptions;
}

export const CopyButton = (props: ICopyButtonProps): ReactElement => {
  const { text, options, ...rest } = props;
  const { hasCopied, onCopy } = useClipboard(text, options);

  return (
    <>
      <IconButton icon={<CopyIcon />} variant="link" aria-label="copy" onClick={onCopy} {...rest} />
      {hasCopied && (
        <Text display={'inline'} color={'blue.500'}>
          Copied!
        </Text>
      )}
    </>
  );
};
