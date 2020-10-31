import {
  createStyles,
  FormControlLabel,
  FormGroup,
  makeStyles,
  Switch,
  Theme,
} from '@material-ui/core';
import { yellow } from '@material-ui/core/colors';
import React from 'react';
import useDarkMode from 'use-dark-mode';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    switchBase: {
      color: yellow['A100'],
      '&$checked': {
        color: yellow['A100'],
      },
      '&$checked + $track': {
        backgroundColor: yellow['A100'],
      },
    },
    checked: {},
    track: {},
  })
);

const ThemeToggle: React.FC = () => {
  const { value: isDark, toggle } = useDarkMode(false);
  const classes = useStyles();

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch
            classes={{
              switchBase: classes.switchBase,
            }}
            checked={!isDark}
            onChange={() => toggle()}
            name="toggle dark mode"
          />
        }
        label={isDark ? 'Dark' : 'Light'}
      />
    </FormGroup>
  );
};

export default ThemeToggle;
