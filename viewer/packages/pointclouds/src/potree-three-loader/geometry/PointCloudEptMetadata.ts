/*
 * Adapted from Potree:
 * https://github.com/potree/potree/blob/develop/src/PointCloudEptGeometry.js
 * License in LICENSE.potree
 */

import * as THREE from 'three';

import { EptBinaryLoader } from '../loading/EptBinaryLoader';

import { PointCloudEptGeometryNode } from './PointCloudEptGeometryNode';
import { IPointCloudTreeGeometry } from './IPointCloudTreeGeometry';

import proj4 from 'proj4';
import { ModelDataProvider } from '@reveal/modeldata-api';
import { toVector3, toBox3 } from './translationUtils';
import { EptHierarchy, loadEptHierarchyJson } from './eptUtil';
import { PointCloudEptOmniNode } from './PointCloudEptOmniNode';
import { PointCloudMaterial } from '../rendering';

type SchemaEntry = {
  name: string;
  scale: number;
  offset: number;
};

function findDim(schema: SchemaEntry[], name: string): SchemaEntry {
  const dim = schema.find(dim => dim.name == name);
  if (!dim) throw new Error('Failed to find ' + name + ' in schema');
  return dim;
}

export class PointCloudEptMetadata implements IPointCloudTreeGeometry {
  private readonly _eptScale: THREE.Vector3;
  private readonly _eptOffset: THREE.Vector3;

  private readonly _baseUrl: string;

  private readonly _boundingBox: THREE.Box3;
  private readonly _tightBoundingBox: THREE.Box3;

  private readonly _offset: THREE.Vector3;

  private readonly _span: number;
  private readonly _spacing: number;

  private readonly _loader: EptBinaryLoader;

  private readonly _schema: SchemaEntry[];

  // private _root: PointCloudEptGeometryNode | undefined;

  private readonly _projection: string | null;

  private _eptHierarchy: Promise<EptHierarchy>;

  private readonly _material: PointCloudMaterial;

  getRootKey(): EptKey {
    return new EptKey(this._boundingBox, 0);
  }

  /* get root(): PointCloudEptGeometryNode | undefined {
    return this._root;
  }

  set root(r: PointCloudEptGeometryNode | undefined) {
    this._root = r;
    } */

  get material(): PointCloudMaterial {
    return this._material;
  }

  get boundingBox(): THREE.Box3 {
    return this._boundingBox;
  }

  get tightBoundingBox(): THREE.Box3 {
    return this._tightBoundingBox;
  }

  get offset(): THREE.Vector3 {
    return this._offset;
  }

  get spacing(): number {
    return this._spacing;
  }

  get baseUrl(): string {
    return this._baseUrl;
  }

  get schema(): SchemaEntry[] {
    return this._schema;
  }

  get eptScale(): THREE.Vector3 {
    return this._eptScale;
  }

  get eptOffset(): THREE.Vector3 {
    return this._eptOffset;
  }

  get loader(): EptBinaryLoader {
    return this._loader;
  }

  get eptHierarchy(): Promise<EptHierarchy> {
    return this._eptHierarchy;
  };

  constructor(baseUrl: string, info: any, dataLoader: ModelDataProvider) {
    const schema = info.schema;
    const bounds = info.bounds;
    const boundsConforming = info.boundsConforming;

    const xyz = [findDim(schema, 'X'), findDim(schema, 'Y'), findDim(schema, 'Z')];
    const scale = xyz.map(d => d.scale || 1);
    const offset = xyz.map(d => d.offset || 0);
    this._eptScale = toVector3(scale);
    this._eptOffset = toVector3(offset);

    this._baseUrl = baseUrl;

    this._schema = schema;
    this._span = info.span || info.ticks;
    this._boundingBox = toBox3(bounds);
    this._tightBoundingBox = toBox3(boundsConforming);
    this._offset = toVector3([0, 0, 0]);

    this._material = material;

    this._projection = null;

    if (info.srs && info.srs.horizontal) {
      this._projection = info.srs.authority + ':' + info.srs.horizontal;
    }

    if (info.srs.wkt) {
      if (!this._projection) this._projection = info.srs.wkt;
    }

    if (this._projection) {
      // TODO [mschuetz]: named projections that proj4 can't handle seem to cause problems.
      // remove them for now

      try {
        proj4(this._projection);
      } catch (e) {
        this._projection = null;
      }
    }


    this._spacing = (this._boundingBox.max.x - this._boundingBox.min.x) / this._span;

    if (info.dataType !== 'binary') {
      throw new Error('Could not read data type: ' + info.dataType);
    }

    this._loader = new EptBinaryLoader(dataLoader);

    const rootKey: EptKey = this.getRootKey();
    this._eptHierarchy = loadEptHierarchyJson(this.baseUrl, rootKey, dataLoader);
  }

  dispose(): void {}
}

export class EptKey {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly boundingBox: THREE.Box3;
  readonly d: number;

  constructor(b: THREE.Box3, d: number, x?: number, y?: number, z?: number) {
    this.boundingBox = b;
    this.d = d;
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  }

  name(): string {
    return this.d + '-' + this.x + '-' + this.y + '-' + this.z;
  }

  step(a: number, b: number, c: number): EptKey {
    const min = this.boundingBox.min.clone();
    const max = this.boundingBox.max.clone();
    const dst = new THREE.Vector3().subVectors(max, min);

    if (a) min.x += dst.x / 2;
    else max.x -= dst.x / 2;

    if (b) min.y += dst.y / 2;
    else max.y -= dst.y / 2;

    if (c) min.z += dst.z / 2;
    else max.z -= dst.z / 2;

    return new EptKey(new THREE.Box3(min, max), this.d + 1, this.x * 2 + a, this.y * 2 + b, this.z * 2 + c);
  }

  children(): EptKey[] {
    let result: EptKey[] = [];
    for (let a = 0; a < 2; ++a) {
      for (let b = 0; b < 2; ++b) {
        for (let c = 0; c < 2; ++c) {
          const add = this.step(a, b, c);
          result.push(add);
        }
      }
    }
    return result;
  }

  indexInParent(): number {
    return 4 * (this.x & 1) + 2 * (this.y & 1) + (this.z & 1);
  }
}
