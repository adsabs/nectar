import { BarDatum, ResponsiveBar } from '@nivo/bar';
import { ReactElement, useState } from 'react';
import { Box, Radio, RadioGroup, Stack } from '@chakra-ui/react';

export interface IMetricsGraphProps {
  data: BarDatum[];
  indexBy: string;
  keys: string[];
  ticks?: string[] | number[] | undefined;
  showLegend?: boolean;
  showGroupOptions?: boolean;
}

export const MetricsGraph = (props: IMetricsGraphProps): ReactElement => {
  const { data, indexBy, keys, ticks, showLegend = true, showGroupOptions = true } = props;
  const [groupType, setGroupType] = useState('stacked');

  return (
    <Box width="100%" mt={5}>
      {showGroupOptions && (
        <RadioGroup defaultChecked onChange={setGroupType} value={groupType}>
          <Stack direction="row">
            <Radio value="stacked">Stacked</Radio>
            <Radio value="grouped">Grouped</Radio>
          </Stack>
        </RadioGroup>
      )}
      <div style={{ height: '500px', marginTop: '20px' }}>
        <ResponsiveBar
          data={data}
          indexBy={indexBy}
          keys={keys}
          colors={{ scheme: 'category10' }}
          groupMode={groupType as 'stacked' | 'grouped'}
          axisBottom={{
            tickValues: ticks,
            tickRotation: -40,
          }}
          axisTop={null}
          axisRight={null}
          padding={0.3}
          margin={{ top: 100, right: 50, bottom: 50, left: 50 }}
          enableLabel={false}
          legends={
            showLegend
              ? [
                  {
                    dataFrom: 'keys',
                    anchor: 'top-left',
                    direction: 'column',
                    justify: false,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    translateY: -100,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]
              : undefined
          }
        />
      </div>
    </Box>
  );
};
