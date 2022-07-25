/*!
 * Copyright 2022 Cognite AS
 */

import { IPointCloudOmniNode } from './IPointCloudOmniNode';

import * as THREE from 'three';

export abstract class IPointCloudOmniTree extends THREE.Object3D {
  abstract getRoot(): IPointCloudOmniNode;
};
