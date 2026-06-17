import type { HierarchyRectangularNode } from 'd3';
import type { IADSApiAuthorNetworkNode } from '@/api/vis/types';

export interface NetworkHierarchyNode<Datum> extends HierarchyRectangularNode<Datum> {
  color: string; // cache color data
}

export interface ILink {
  source: NetworkHierarchyNode<IADSApiAuthorNetworkNode>;
  target: NetworkHierarchyNode<IADSApiAuthorNetworkNode>;
  weight: number;
}
