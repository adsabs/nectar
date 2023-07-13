import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  AlertStatus,
  AlertTitle,
  CloseButton,
  Flex,
} from '@chakra-ui/react';

interface IFeedbackAlertProps extends AlertProps {
  status: AlertStatus;
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackAlert = ({ status, title, description, isOpen, onClose, ...props }: IFeedbackAlertProps) => {
  return isOpen ? (
    <Alert status={status} variant="subtle" {...props}>
      <Flex direction="row" justifyContent="space-between" w="full" alignItems="center">
        <Flex>
          <AlertIcon />
          <AlertTitle>{title}</AlertTitle>
          {description && <AlertDescription>{description}</AlertDescription>}
        </Flex>
        <CloseButton onClick={onClose} />
      </Flex>
    </Alert>
  ) : null;
};
