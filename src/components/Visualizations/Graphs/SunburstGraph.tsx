import { Box, Button } from '@chakra-ui/react';
import { ComputedDatum, ResponsiveSunburst } from '@nivo/sunburst';
import { ReactElement, useMemo, useState } from 'react';
import { ISunburstGraph, SunburstNode } from '../types';

export interface ISunburstGraphProps {
  graph: ISunburstGraph;
  onClick?: (node: SunburstNode) => void;
}

export const SunburstGraph = ({ graph, onClick }: ISunburstGraphProps): ReactElement => {
  // graph data can be the original graph data, or drilled downed children data
  const [graphData, setGraphData] = useState(graph.data);

  // flatten the tree data into a list for easier search
  const allNodes = useMemo(() => {
    return flatten(graph.data);
  }, [graph.data]);

  const getArcLabel = ({ data }: ComputedDatum<SunburstNode>) => (typeof data.name === 'string' ? `${data.name}` : '');

  const handleDrillDown = (clickedData: ComputedDatum<SunburstNode>) => {
    const clickedNode = allNodes.find((node) => node.name === clickedData.id);

    // clicked on a group, drill down the graph
    if (clickedNode && clickedNode.children) {
      setGraphData(clickedNode);
    }

    // callback
    if (typeof onClick === 'function') {
      onClick(clickedNode);
    }
  };

  const handleResetGraph = () => {
    setGraphData(graph.data);
  };

  return (
    <Box width="100%" mt={5}>
      <Button variant="outline" onClick={handleResetGraph}>
        Reset Graph
      </Button>
      <div style={{ height: '600px' }}>
        <ResponsiveSunburst
          data={graphData}
          margin={{ top: 50, right: 10, bottom: 50, left: 10 }}
          id={graph.idKey}
          value={graph.valueKey}
          valueFormat=" >-,"
          borderWidth={0.5}
          colors={{ scheme: 'category10' }}
          childColor={{
            from: 'color',
            modifiers: [['darker', 0.6]],
          }}
          enableArcLabels={true}
          arcLabel={getArcLabel}
          arcLabelsRadiusOffset={1.55}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 1.4]],
          }}
          onClick={handleDrillDown}
        />
      </div>
    </Box>
  );
};

// flatten the tree into a list
const flatten = (root: SunburstNode) => {
  const tmp: SunburstNode[] = [];
  dfs(root, tmp);
  return tmp;
};

const dfs = (node: SunburstNode, flatList: SunburstNode[]) => {
  flatList.push(node);

  if (node.children) {
    node.children.forEach((childNode) => dfs(childNode, flatList));
  }
};
