import {
  createStyles,
  IconButton,
  InputBase,
  makeStyles,
  Paper,
  Theme,
} from '@material-ui/core';
import { Search as SearchIcon } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import React from 'react';
import QuickFields from './QuickFields';

const SearchBar: React.FC<ISearchBarProps> = ({ value, onChange }) => {
  const classes = useStyles();

  return (
    <Autocomplete
      id="search-input"
      options={['test', 'test2']}
      openOnFocus={false}
      renderInput={(params) => (
        <Paper className={classes.root} innerRef={params.InputProps.ref}>
          <InputBase
            placeholder="Search"
            name="q"
            defaultValue={value}
            {...params.inputProps}
            className={classes.input}
          />
          <QuickFields />
          <IconButton
            className={classes.searchButton}
            aria-label="search"
            type="submit"
          >
            <SearchIcon />
          </IconButton>
        </Paper>
      )}
    />
  );
};

interface ISearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: 0,
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
    searchButton: {
      borderRadius: '0 4px 4px 0',
      color: theme.palette.getContrastText(theme.palette.secondary.main),
      backgroundColor: theme.palette.secondary.main,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
      },
    },
  })
);

export default SearchBar;
