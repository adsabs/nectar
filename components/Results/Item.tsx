import {
  Card,
  CardContent,
  Typography,
  makeStyles,
  Theme,
  createStyles,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      margin: '10px 0 10px 0',
    },
  })
);

const Item: React.FC<IItemProps> = ({ articleData }) => {
  const classes = useStyles();

  return (
    <Card variant="outlined" className={classes.root}>
      <CardContent>
        <Typography variant="h6" color="textPrimary" component="p">
          {articleData.title}
        </Typography>
      </CardContent>
    </Card>
  );
};

interface IItemProps {
  articleData: any;
}

export default Item;
