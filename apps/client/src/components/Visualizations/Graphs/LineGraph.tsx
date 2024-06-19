import { Box, useColorMode } from '@chakra-ui/react';
import { useNivoDarkTheme } from '@/lib/useNivoDarkTheme';
import { ResponsiveLine, Serie } from '@nivo/line';
import { memo, ReactElement } from 'react';
import { X_Axis, Y_Axis } from '../types';

export interface ILineGraphProps {
  data: Serie[];
  ticks: string[] | number[];
  showLegend?: boolean;
  yScaleType?: Y_Axis;
  xScaleType: X_Axis;
}

export const LineGraph = memo(
  ({ data, ticks, showLegend = true, yScaleType = 'linear', xScaleType }: ILineGraphProps): ReactElement => {
    const { colorMode } = useColorMode();
    const darkTheme = useNivoDarkTheme();

    return (
      <Box width="100%" mt={5}>
        <div style={{ height: '500px' }}>
          <ResponsiveLine
            theme={colorMode === 'dark' ? darkTheme : null}
            data={data}
            margin={{ top: 50, right: showLegend ? 110 : 50, bottom: 50, left: 60 }}
            colors={{ scheme: 'category10' }}
            xScale={xScaleType === 'linear' ? { type: 'linear', min: 'auto', max: 'auto' } : { type: 'point' }}
            yScale={
              yScaleType === 'linear'
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
            curve="monotoneX"
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
            enablePoints
            pointSize={5}
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
  },
);
