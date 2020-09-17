import {
  createStyles,
  Divider,
  IconButton,
  InputBase,
  makeStyles,
  Paper,
  Theme,
} from '@material-ui/core';
import { Search } from '@material-ui/icons';
import React from 'react';

const SearchBar: React.FC<ISearchBarProps> = ({ query }) => {
  const classes = useStyles();
  const [value, setValue] = React.useState(query);
  // const router = useRouter();
  React.useEffect(() => {
    if (value !== query) {
      setValue(query);
    }
    // router.push({ query: { q: query } });
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
  };

  return (
    <Paper className={classes.root}>
      <InputBase
        className={classes.input}
        placeholder="Search"
        name="q"
        onChange={handleChange}
        value={value}
      />
      <Divider className={classes.divider} orientation="vertical" />
      <IconButton
        className={classes.iconButton}
        aria-label="search"
        type="submit"
      >
        <Search />
      </IconButton>
    </Paper>
  );
};

interface ISearchBarProps {
  query?: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1,
    },
    iconButton: {
      padding: 10,
    },
    divider: {
      height: 28,
      margin: 4,
    },
  })
);

export default SearchBar;
