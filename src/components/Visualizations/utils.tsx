import { Serie } from '@nivo/line';

export const getLineGraphYearTicks = (data: Serie[], maxTicks: number) => {
  if (data[0].data.length <= maxTicks) {
    return undefined;
  }
  const ticks: string[] = [];

  const nPerTick = Math.ceil(data[0].data.length / maxTicks);
  data[0].data.forEach(({ x }) => {
    if (+x % nPerTick === 0) {
      ticks.push(x as string);
    }
  });

  return ticks;
};
