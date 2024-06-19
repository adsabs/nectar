import {
  chakra,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputProps,
  InputRightElement,
  Stack,
  Text,
  useCheckbox,
} from '@chakra-ui/react';
import { forwardRef } from 'react';
import { CheckIcon } from '@chakra-ui/icons';

interface IPasswordTextInputProps extends InputProps {
  onSwitch?: (hidden: boolean) => void;
}

export const PasswordTextInput = forwardRef<HTMLInputElement, IPasswordTextInputProps>((props, ref) => {
  const { onSwitch, ...inputProps } = props;
  const { getCheckboxProps, getInputProps, htmlProps, state } = useCheckbox({
    onChange: (e) => onSwitch?.(e.target.checked),
  });
  return (
    <>
      <InputGroup>
        <Input
          placeholder={state.isChecked ? '' : '*******'}
          {...inputProps}
          type={state.isChecked ? 'text' : 'password'}
          ref={ref}
          pr="12"
        />
        <InputRightElement>
          <chakra.label cursor="pointer" color="gray.600" mr="2" {...htmlProps}>
            <Input {...getInputProps()} required={false} type="checkbox" hidden />
            <Flex textDecoration="underline" {...getCheckboxProps()}>
              {state.isChecked ? 'Hide' : 'Show'}
            </Flex>
          </chakra.label>
        </InputRightElement>
      </InputGroup>
    </>
  );
});

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
  return (
    <Text
      fontWeight={valid ? 'bold' : 'auto'}
      color={valid ? 'auto' : 'gray.600'}
      fontSize="sm"
      aria-describedby="password"
    >
      {valid && <Icon as={CheckIcon} color="green.500" mr={2} aria-label="requirement is valid" />}
      {message}
    </Text>
  );
};
