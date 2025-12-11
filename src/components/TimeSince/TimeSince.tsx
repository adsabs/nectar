import { Box, Tooltip } from '@chakra-ui/react';
import { intlFormat, intlFormatDistance } from 'date-fns';

export interface TimeSinceProps {
  date: string | null | undefined;
}

export const TimeSince = ({ date }: TimeSinceProps) => {
  if (!date?.trim()) {
    return null;
  }

  const hasTimezone = /[+-]\d{2}:\d{2}$/.test(date);
  const hasTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(date);

  let dateString = date;
  if (!hasTimezone) {
    if (hasTime) {
      dateString = `${date}+00:00`;
    } else {
      dateString = `${date}T00:00:00+00:00`;
    }
  }

  const dateStr = new Date(dateString);

  if (isNaN(dateStr.getTime())) {
    return null;
  }

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
