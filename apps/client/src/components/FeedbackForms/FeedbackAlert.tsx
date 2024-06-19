import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  AlertStatus,
  AlertTitle,
  CloseButton,
  Flex,
  useDisclosure,
} from '@chakra-ui/react';

interface IFeedbackAlertProps extends AlertProps {
  status: AlertStatus;
  title: string;
  description?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const FeedbackAlert = ({ status, title, description, isOpen, onClose, ...props }: IFeedbackAlertProps) => {
  const { isOpen: isShown, onClose: onClosed } = useDisclosure({ isOpen, onClose, id: title, defaultIsOpen: false });
  return isShown ? (
    <Alert status={status} variant="subtle" {...props}>
      <Flex direction="row" justifyContent="space-between" w="full" alignItems="center">
        <Flex>
          <AlertIcon />
          <AlertTitle>{title}</AlertTitle>
          {description && <AlertDescription>{description}</AlertDescription>}
        </Flex>
        <CloseButton onClick={onClosed} />
      </Flex>
    </Alert>
  ) : null;
};
