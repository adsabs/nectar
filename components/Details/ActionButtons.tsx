import Link from '@components/Link';
import { Button, Grid } from '@material-ui/core';
import { ArrowBack, ArrowForward } from '@material-ui/icons';
import { resultState } from '@recoil/atoms';
import { findIndex, propEq } from 'ramda';
import React from 'react';
import { useRecoilValue } from 'recoil';

/**
 * Button bar at the bottom of details page which will house next/prev  buttons
 */
const ActionsButtons: React.FC<{ id: string }> = ({ id }) => {
  const { docs, numFound } = useRecoilValue(resultState);

  console.log(docs);

  const currentIndex = findIndex(propEq('id', id), docs);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < numFound - 1;
  const prevUrl =
    currentIndex > -1 && hasPrev
      ? `/abs/${docs[currentIndex - 1].bibcode}`
      : '';
  const nextUrl =
    currentIndex > -1 && hasNext
      ? `/abs/${docs[currentIndex + 1].bibcode}`
      : '';

  const handleClick = () => {};

  return (
    <Grid container justify="space-between">
      <Link href={prevUrl}>
        <Button
          disabled={!hasPrev}
          variant="contained"
          color="default"
          size="small"
          startIcon={<ArrowBack />}
          onClick={handleClick}
        >
          Prev
        </Button>
      </Link>

      <Link href={nextUrl}>
        <Button
          disabled={!hasNext}
          variant="contained"
          color="default"
          size="small"
          startIcon={<ArrowForward />}
          onClick={handleClick}
        >
          Next
        </Button>
      </Link>
    </Grid>
  );
};

export default ActionsButtons;
