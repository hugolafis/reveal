/*!
 * Copyright 2022 Cognite AS
 */

import * as THREE from 'three';

export interface IPointCloudOmniNode {
  readonly loaded: boolean;
  load(): Promise<void>;
  unload(): void;
  sceneNode: THREE.Object3D;
  children: IPointCloudOmniNode[];
};
