import { Box, Tooltip } from '@chakra-ui/react';
import { formatAbsoluteDateTime, formatRelativeDate } from '@/utils/common/formatters';

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

  const formatted = formatRelativeDate(dateStr);
  return (
    <Tooltip label={formatAbsoluteDateTime(dateStr)}>
      <Box tabIndex={-1}>{formatted}</Box>
    </Tooltip>
  );
};
