import { IStandardAlertProps, StandardAlertMessage } from '@/components';
import { parseAPIError } from '@/utils';

interface IFormMessage extends IStandardAlertProps {
  show: boolean;
  error?: Error | unknown;
}
export const FormMessage = (props: IFormMessage) => {
  const { show, error, ...alertProps } = props;

  if (show && error) {
    return <StandardAlertMessage {...alertProps} description={parseAPIError(error)} status="error" />;
  }

  return show ? <StandardAlertMessage {...alertProps} /> : null;
};
