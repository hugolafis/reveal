/*!
 * Copyright 2022 Cognite AS
 */

import { IPointCloudOmniNode } from './geometry/IPointCloudOmniNode';
import { IPointCloudOmniTree } from './geometry/IPointCloudOmniTree';

function hideNodeTree(node: IPointCloudOmniNode): void {
  node.sceneNode.visible = false;
  for (const child of node.children) {
    hideNodeTree(child);
  }
}

export class LoadScheduler {
  static scheduleLoadsAndUnloads(pointClouds: IPointCloudOmniTree[]) {
    for (const pointCloud of pointClouds) {
      hideNodeTree(pointCloud.root);
    }
  }
};
