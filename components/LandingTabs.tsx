import Link from '@components/Link';
import { Paper, PaperProps, Theme, useMediaQuery } from '@material-ui/core';
import { createStyles, makeStyles, withStyles } from '@material-ui/styles';
import { useRouter } from 'next/router';
import React from 'react';

const Tab = withStyles((theme: Theme) => ({
  root: {
    borderRadius: '4px 4px 0 0',
    backgroundColor: (props: ITabProps) =>
      props.selected ? theme.palette.background.default : 'rgba(0,0,0,50%)',
    color: (props: ITabProps) =>
      props.selected
        ? theme.palette.text.primary
        : theme.palette.getContrastText('#000'),
    fontSize: '20px',
    textAlign: 'center',
    padding: '12px',
    width: '160px',
  },
}))(Paper);

interface ITabProps extends PaperProps {
  selected: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& ul': {
        display: 'flex',
        listStyle: 'none',
        margin: 0,
        padding: 0,
      },
    },
  })
);
const LandingTabs = () => {
  const classes = useStyles();
  const { asPath } = useRouter();
  const smallScreen = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

  if (smallScreen) {
    return null;
  }

  return (
    <nav className={classes.root}>
      <ul>
        <li>
          <Link href="/classic-form">
            <Tab selected={asPath === '/classic-form'}>Classic Form</Tab>
          </Link>
        </li>
        <li>
          <Link href="/">
            <Tab selected={asPath === '/'}>Modern Form</Tab>
          </Link>
        </li>
        <li>
          <Link href="/paper-form">
            <Tab selected={asPath === '/paper-form'}>Paper Form</Tab>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default LandingTabs;
