/*!
 * Copyright 2022 Cognite AS
 */

import { decrementGlobalNumNodesLoading, globalMaxNumNodesLoading, globalNumNodesLoading, incrementGlobalNumNodesLoading } from '../loading/globalLoadingCounter';
import { PointCloudMaterial } from '../rendering';
import { EptHierarchy } from './eptUtil';
import { IPointCloudOmniNode } from './IPointCloudOmniNode';
import { EptKey, PointCloudEptMetadata } from './PointCloudEptMetadata';

import * as THREE from 'three';

export class PointCloudEptOmniNode implements IPointCloudOmniNode {

  private _loading: boolean = false;
  private _loaded: boolean = false;

  private _children: Array<PointCloudEptOmniNode> = new Array<PointCloudEptOmniNode>(8);

  private _eptMetadata: PointCloudEptMetadata;
  private _eptKey: EptKey;
  private _numPoints: number;
  private _geometry: THREE.BufferGeometry;
  private _points: THREE.Points;

  private readonly  _material: PointCloudMaterial;

  constructor(metadata: PointCloudEptMetadata,
              eptHierarchy: EptHierarchy,
              eptKey: EptKey,
              material: PointCloudMaterial) {
    this._eptMetadata = metadata;
    this._eptKey = eptKey;
    this._numPoints = eptHierarchy[eptKey.name()];
    this._material = material;

    for (const childKey of this._eptKey.children()) {
      if (childKey.name() in eptHierarchy) {
        this._children[childKey.indexInParent()] = new PointCloudEptOmniNode(metadata,
                                                                             eptHierarchy,
                                                                             childKey,
                                                                             material);
      }
    }
  }

  async load(): Promise<void> {
    if (this._loading || this._loaded) return;
    if (globalNumNodesLoading >= globalMaxNumNodesLoading) return;

    this._loading = true;
    incrementGlobalNumNodesLoading();

    const loadResult = await this._eptMetadata.loader.load(this._eptMetadata.baseUrl,
                                                           this._eptKey.name(),
                                                           this._eptMetadata,
                                                           this._eptKey.boundingBox);

    // Loading may have been cancelled by the unload() function
    if (!this._loading) {
      return;
    }

    this._geometry = loadResult.bufferGeometry;
    this._geometry.boundingBox = this._eptKey.boundingBox;
    this._loaded = true;
    this._loading = false;

    decrementGlobalNumNodesLoading();

    this._points = new THREE.Points(this._geometry, this._material);
  }

  get children(): PointCloudEptOmniNode[] {
    return this._children.filter(c => c);
  }

  unload(): void {

    // Cancel loading if in progress
    this._loading = false;

    this._geometry.dispose();
    this._loaded = false;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  get sceneNode(): THREE.Object3D {
    return this._points;
  }
};
