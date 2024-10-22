import { Button, Icon, Input, InputGroup, InputProps, InputRightElement, Stack, Text } from '@chakra-ui/react';
import { forwardRef, useState } from 'react';
import { CheckIcon } from '@chakra-ui/icons';
import { useColorModeColors } from '@/lib/useColorModeColors';

interface IPasswordTextInputProps extends InputProps {
  onSwitch?: (hidden: boolean) => void;
}

export const PasswordTextInput = forwardRef<HTMLInputElement, IPasswordTextInputProps>((props, ref) => {
  const { onSwitch, ...inputProps } = props;
  const [showPwd, setShowPwd] = useState(false);

  const handleToggleShowPwd = () => {
    onSwitch?.(!showPwd);
    setShowPwd((prev) => !prev);
  };

  return (
    <>
      <InputGroup>
        <Input
          placeholder={showPwd ? '' : '*******'}
          {...inputProps}
          type={showPwd ? 'text' : 'password'}
          ref={ref}
          pr="12"
        />
        <InputRightElement mx={2}>
          <Button variant="link" tabIndex={0} onClick={handleToggleShowPwd}>
            {showPwd ? 'Hide' : 'Show'}
          </Button>
        </InputRightElement>
      </InputGroup>
    </>
  );
});
PasswordTextInput.displayName = 'PasswordTextInput';

export const passwordValidators = {
  uppercase: (password: string) => /[A-Z]/.test(password),
  lowercase: (password: string) => /[a-z]/.test(password),
  digit: (password: string) => /\d/.test(password),
};

export const PasswordRequirements = ({ password }: { password: string }) => {
  const dirty = password?.length !== 0;
  return (
    <Stack direction="row" px="4" mt="2" justifyContent="space-between">
      <Stack dir="column">
        <Req message="One lowercase letter." valid={dirty && passwordValidators.lowercase(password)} />
        <Req message="One uppercase letter." valid={dirty && passwordValidators.uppercase(password)} />
      </Stack>
      <Stack dir="column">
        <Req message="One number." valid={dirty && passwordValidators.digit(password)} />
        <Req message="At least 4 characters." valid={dirty && password.length >= 4} />
      </Stack>
    </Stack>
  );
};

export const Req = ({ message, valid }: { message: string; valid: boolean }) => {
  const { text } = useColorModeColors();
  return (
    <Text fontWeight={valid ? 'bold' : 'auto'} color={valid ? 'auto' : text} fontSize="sm" aria-describedby="password">
      {valid && <Icon as={CheckIcon} color="green.500" mr={2} aria-label="requirement is valid" />}
      {message}
    </Text>
  );
};
