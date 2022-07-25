/*!
 * Copyright 2022 Cognite AS
 */

import { ModelDataProvider } from '@reveal/modeldata-api';
import { PointCloudMaterial } from '../rendering';
import { IPointCloudOmniNode } from './IPointCloudOmniNode';
import { IPointCloudOmniTree } from './IPointCloudOmniTree';
import { PointCloudEptMetadata } from './PointCloudEptMetadata';
import { PointCloudEptOmniNode } from './PointCloudEptOmniNode';

import * as THREE from 'three';

const defaultEptJsonName = 'ept.json';

export class PointCloudEptOmniTree extends IPointCloudOmniTree {
  private _material: PointCloudMaterial;
  private _metadata: PointCloudEptMetadata;
  private _root: PointCloudEptOmniNode | undefined;

  private _sceneNodeRoot: THREE.Group;

  constructor(baseUrl: string, dataLoader: ModelDataProvider) {
    super();
    this._material = new PointCloudMaterial();
    dataLoader.getJsonFile(baseUrl, defaultEptJsonName).then(async (json: any) => {
      this._metadata = new PointCloudEptMetadata(baseUrl, json, dataLoader);
      const nodeHierarchy = await this._metadata.eptHierarchy;
      this._root = new PointCloudEptOmniNode(this._metadata, nodeHierarchy, this._metadata.getRootKey(), this._material);
    });

    this._sceneNodeRoot = new THREE.Group();
    this.add(this._sceneNodeRoot);
  }

  getRoot(): IPointCloudOmniNode {
    if (!this._root) {
      throw Error('Root node not yet ready');
    }
    return this._root!;
  }
}
