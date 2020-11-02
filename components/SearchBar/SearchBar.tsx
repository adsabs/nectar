import { createStyles, makeStyles, Theme } from '@material-ui/core';
import React from 'react';

const SearchBar: React.FC<ISearchBarProps> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type="text"
          className="form-input block w-full pl-7 pr-12 sm:text-sm sm:leading-5"
          name="q"
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded-l-none rounded">
            search
          </button>
        </div>
      </div>
    </div>
  );

  // const classes = useStyles();

  // return (
  //   <Autocomplete
  //     id="search-input"
  //     options={['test', 'test2']}
  //     openOnFocus={false}
  //     renderInput={(params) => (
  //       <Paper className={classes.root} innerRef={params.InputProps.ref}>
  //         <InputBase
  //           placeholder="Search"
  //           name="q"
  //           defaultValue={value}
  //           {...params.inputProps}
  //           className={classes.input}
  //         />
  //         <QuickFields />
  //         <IconButton
  //           className={classes.searchButton}
  //           aria-label="search"
  //           type="submit"
  //         >
  //           <SearchIcon />
  //         </IconButton>
  //       </Paper>
  //     )}
  //   />
  // );
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
