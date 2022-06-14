import { Box } from '@chakra-ui/react';
import { ResponsiveLine, Serie } from '@nivo/line';
import { memo, ReactElement } from 'react';
import { Y_Axis } from '../types';

export interface ILineGraphProps {
  data: Serie[];
  ticks: string[];
  showLegend?: boolean;
  type?: Y_Axis;
}

export const LineGraph = memo(({ data, ticks, showLegend = true, type = 'linear' }: ILineGraphProps): ReactElement => {
  return (
    <Box width="100%" mt={5}>
      <div style={{ height: '500px' }}>
        <ResponsiveLine
          data={data}
          margin={{ top: 50, right: showLegend ? 110 : 50, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={
            type === 'linear'
              ? {
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                  stacked: false,
                  reverse: false,
                }
              : {
                  type: 'symlog',
                  reverse: true,
                }
          }
          curve="basis"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -40,
            legendOffset: 36,
            legendPosition: 'middle',
            tickValues: ticks,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legendPosition: 'middle',
          }}
          enablePoints={false}
          pointSize={0}
          enableGridX={false}
          pointLabelYOffset={-12}
          useMesh={true}
          legends={
            showLegend
              ? [
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]
              : []
          }
        />
      </div>
    </Box>
  );
});