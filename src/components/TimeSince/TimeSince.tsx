import { Box, Tooltip } from '@chakra-ui/react';
import { intlFormat, intlFormatDistance } from 'date-fns';

export const TimeSince = ({ date }: { date: string }) => {
  // date string here is missing the timezone, add it or the time is wrong
  const dateStr = new Date(`${date.match(/\+\d{2}:\d{2}$/) ? date : `${date}+00:00`}`);
  const formatted = intlFormatDistance(dateStr, new Date());
  return (
    <Tooltip
      label={intlFormat(dateStr, {
        hour12: false,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    >
      <Box tabIndex={-1}>{formatted}</Box>
    </Tooltip>
  );
};
