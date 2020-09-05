import { Typography } from '@material-ui/core';

const Copyright: React.FC = () => (
  <Typography
    variant="body2"
    color="textSecondary"
    align="center"
  >{`© The SAO/NASA Astrophysics Data System ${new Date().getFullYear()}`}</Typography>
);

export default Copyright;
