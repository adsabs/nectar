import { Button, ButtonProps } from '@material-ui/core';
import { ArrowBack as ArrowBackIcon } from '@material-ui/icons';
import { useRouter } from 'next/router';

const GoBackButton: React.FC<ButtonProps> = (props) => {
  const router = useRouter();

  const handleClick = () => {
    console.log(router);
    router.back();
  };

  return (
    <Button
      variant="contained"
      color="default"
      size="small"
      startIcon={<ArrowBackIcon />}
      onClick={handleClick}
      {...props}
    >
      Go Back
    </Button>
  );
};

export default GoBackButton;
