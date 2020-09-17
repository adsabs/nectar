import {
  Grid,
  Typography,
  makeStyles,
  Theme,
  createStyles,
} from '@material-ui/core';
import { DocsEntity } from '@api/search';
import { format } from 'date-fns';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    item: {
      marginTop: theme.spacing(2),
    },
    title: {
      flexBasis: '20%',
      [theme.breakpoints.down('sm')]: {
        flexBasis: '100%',
      },
      '& > *': {
        fontWeight: 'bold',
      },
    },
  })
);

const AttributeList: React.FC<IAttributeListProps> = ({ doc }) => {
  const classes = useStyles();
  const attribs = React.useMemo(() => processDoc(doc), [doc]);

  return (
    <>
      {attribs.map(({ name, value }) => (
        <Grid container wrap="wrap" key={name} className={classes.item}>
          <Grid item className={classes.title}>
            <Typography variant="body1">{name}:</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1">{value}</Typography>
          </Grid>
        </Grid>
      ))}
    </>
  );
};

interface IAttributeListProps {
  doc: DocsEntity;
}

export default AttributeList;

const processDoc = (doc: DocsEntity) => {
  const { pub_raw, pubdate, doi, bibcode, pubnote, keyword } = doc;

  const attribs = new Set<{ name: string; value: string }>();

  if (pub_raw) {
    attribs.add({ name: 'Publication', value: pub_raw });
  }

  if (pubdate) {
    try {
      attribs.add({
        name: 'Publication Date',
        value: format(new Date(pubdate.replace('-00', '-01')), 'MMMM yyyy'),
      });
    } catch (e) {
      // skip
    }
  }

  if (doi) {
    attribs.add({ name: 'DOI', value: doi.join(', ') });
  }

  if (bibcode) {
    attribs.add({ name: 'Bibcode', value: bibcode });
  }

  if (keyword) {
    attribs.add({ name: 'Keywords', value: keyword.join(';') });
  }

  if (pubnote) {
    attribs.add({ name: 'E-Print Comments', value: pubnote.join(',') });
  }

  return [...attribs];
};
