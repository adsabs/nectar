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
import { queryState } from '@recoil/atoms';
import React from 'react';
import { useRecoilState } from 'recoil';

const SearchBar: React.FC<ISearchBarProps> = ({}) => {
  const classes = useStyles();
  const [query, setQuery] = useRecoilState(queryState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery({ q: e.currentTarget.value });
  };

  return (
    <Paper className={classes.root}>
      <InputBase
        className={classes.input}
        placeholder="Search"
        name="q"
        onChange={handleChange}
        value={query.q}
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

interface ISearchBarProps {}

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
