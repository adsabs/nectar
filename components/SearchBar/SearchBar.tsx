import React from 'react';
import { useRecoilState } from 'recoil';
import { queryState } from '@recoil/atoms';
import { useRouter } from 'next/router';
import {
  makeStyles,
  Theme,
  createStyles,
  Paper,
  InputBase,
  IconButton,
  Divider,
} from '@material-ui/core';
import { Search } from '@material-ui/icons';

const SearchBar: React.FC<ISearchBarProps> = () => {
  const classes = useStyles();
  const [query, setQuery] = useRecoilState(queryState);
  const [value, setValue] = React.useState(query);
  const router = useRouter();
  React.useEffect(() => {
    if (value !== query) {
      setValue(query);
    }
    router.push({ query: { q: query } });
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
  };
  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault();
    setQuery(value);
  };

  const formProps = {
    action: '/search/query',
    method: 'get',
    onSubmit: handleSubmit,
  };

  return (
    <Paper component="form" className={classes.root} {...formProps}>
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
