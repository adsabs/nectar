import type { BarDatum, BarSvgProps, BarTooltipProps } from '@nivo/bar';
import { ResponsiveBar } from '@nivo/bar';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Box, Flex, HStack, Radio, RadioGroup, Stack, useColorMode } from '@chakra-ui/react';
import { useNivoDarkTheme } from '@/lib/useNivoDarkTheme';
import { categoricalColorSchemes } from '@nivo/colors';
import { BasicTooltip } from '@nivo/tooltip';

export interface IBarGraphProps extends Omit<BarSvgProps<BarDatum>, 'height' | 'width'> {
  data: BarDatum[];
  indexBy: string;
  keys: string[];
  ticks?: string[] | number[] | undefined;
  showLegend?: boolean;
  showGroupOptions?: boolean;
  height?: string;
}

export const BarGraphColors = categoricalColorSchemes.category10;

export const CustomBarTooltip = ({ keys, bar }: { keys: string[]; bar: BarTooltipProps<BarDatum> }) => {
  const row = bar.data;
  const getValue = (key: string): number => (row[key] as number) ?? 0;
  const total = keys.reduce((acc, key) => acc + getValue(key), 0);

  return (
    <BasicTooltip
      id={
        <Flex direction="column" alignItems="start">
          {keys.map((key, index) => {
            const color = BarGraphColors[index % BarGraphColors.length];
            return (
              <HStack key={key} gap={0}>
                <Box w={4} h={4} bg={color} border="1px solid" borderColor="gray.300" flexShrink={0} mr={2} />
                <>
                  {key}: <strong>{row[key] ?? 0}</strong>
                </>
                <br />
              </HStack>
            );
          })}
          {keys.length > 1 && (
            <div>
              Total: <strong>{total}</strong>
            </div>
          )}
        </Flex>
      }
      color={bar.color}
    />
  );
};

export const BarGraph = (props: IBarGraphProps): ReactElement => {
  const {
    data,
    indexBy,
    keys,
    ticks,
    showLegend = false,
    showGroupOptions = true,
    height = '500px',
    ...barAttributes
  } = props;
  const [groupType, setGroupType] = useState('stacked');
  const { colorMode } = useColorMode();
  const darkTheme = useNivoDarkTheme();

  return (
    <Box width="100%" mt={5}>
      {showGroupOptions && (
        <RadioGroup defaultChecked onChange={setGroupType} value={groupType} aria-label="bar chart display">
          <Stack direction="row">
            <Radio value="stacked">Stacked</Radio>
            <Radio value="grouped">Grouped</Radio>
          </Stack>
        </RadioGroup>
      )}
      <div style={{ height: height, marginTop: '20px' }}>
        <ResponsiveBar
          theme={colorMode === 'dark' ? darkTheme : null}
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
          {...barAttributes}
        />
      </div>
    </Box>
  );
};
