/*
 * Adapted from Potree:
 * https://github.com/potree/potree/blob/develop/src/loader/ept/BinaryLoader.js
 * License in LICENSE.potree
 */

import * as THREE from 'three';

import { WorkerPool } from '../utils/WorkerPool';
import { ModelDataProvider } from '@reveal/modeldata-api';
import { PointCloudEptGeometryNode } from '../geometry/PointCloudEptGeometryNode';
import EptDecoderWorker from '../workers/eptBinaryDecoder.worker';
import { ParsedEptData } from '../workers/eptBinaryDecoder.worker';
import { PointCloudEptMetadata } from '../geometry/PointCloudEptMetadata';

export type LoadResult = {
  tightBoundingBox: THREE.Box3;
  bufferGeometry: THREE.BufferGeometry;
  numPoints: number
};

export class EptBinaryLoader {
  private readonly _dataLoader: ModelDataProvider;

  static readonly WORKER_POOL = new WorkerPool(32, EptDecoderWorker);

  extension(): string {
    return '.bin';
  }

  constructor(dataLoader: ModelDataProvider) {
    this._dataLoader = dataLoader;
  }

  // async load(node: PointCloudEptGeometryNode): Promise<void> {
  async load(baseUrl: string,
             nodeName: string,
             eptMetadata: PointCloudEptMetadata,
             nodeBoundingBox: THREE.Box3): Promise<LoadResult> {

    const fullFileName = nodeName + this.extension();

    return this._dataLoader.getBinaryFile(baseUrl, fullFileName).then(data => this.parse(data, eptMetadata, nodeBoundingBox));
  }

  async parse(buffer: ArrayBuffer, eptMetadata: PointCloudEptMetadata, nodeBoundingBox: THREE.Box3): Promise<LoadResult> {
    return EptBinaryLoader.WORKER_POOL.getWorker().then(
      autoTerminatingWorker =>
        new Promise<LoadResult>(res => {
          autoTerminatingWorker.worker.onmessage = function (e: { data: ParsedEptData }) {
            const g = new THREE.BufferGeometry();

            const position = new Float32Array(e.data.position);
            g.setAttribute('position', new THREE.BufferAttribute(position, 3));

            const indices = new Uint8Array(e.data.indices);
            g.setAttribute('indices', new THREE.BufferAttribute(indices, 4));

            if (e.data.color) {
              const color = new Uint8Array(e.data.color);
              g.setAttribute('color', new THREE.BufferAttribute(color, 4, true));
            }
            if (e.data.intensity) {
              const intensity = new Float32Array(e.data.intensity);
              g.setAttribute('intensity', new THREE.BufferAttribute(intensity, 1));
            }
            if (e.data.classification) {
              const classification = new Uint8Array(e.data.classification);
              g.setAttribute('classification', new THREE.BufferAttribute(classification, 1));
            }
            if (e.data.returnNumber) {
              const returnNumber = new Uint8Array(e.data.returnNumber);
              g.setAttribute('return number', new THREE.BufferAttribute(returnNumber, 1));
            }
            if (e.data.numberOfReturns) {
              const numberOfReturns = new Uint8Array(e.data.numberOfReturns);
              g.setAttribute('number of returns', new THREE.BufferAttribute(numberOfReturns, 1));
            }
            if (e.data.pointSourceId) {
              const pointSourceId = new Uint16Array(e.data.pointSourceId);
              g.setAttribute('source id', new THREE.BufferAttribute(pointSourceId, 1));
            }

            g.attributes.indices.normalized = true;

            // node.doneLoading(g, tightBoundingBox, numPoints, new THREE.Vector3(...e.data.mean));

            EptBinaryLoader.WORKER_POOL.releaseWorker(autoTerminatingWorker);


            const tightBoundingBox = new THREE.Box3(
              new THREE.Vector3().fromArray(e.data.tightBoundingBox.min),
              new THREE.Vector3().fromArray(e.data.tightBoundingBox.max)
            );
            res({ tightBoundingBox, bufferGeometry: g, numPoints: e.data.numPoints });
          };

          const toArray = (v: THREE.Vector3) => [v.x, v.y, v.z];
          const message = {
            buffer: buffer,
            schema: eptMetadata.schema,
            scale: eptMetadata.eptScale,
            offset: eptMetadata.eptOffset,
            mins: toArray(nodeBoundingBox.min)
          };

          autoTerminatingWorker.worker.postMessage(message, [message.buffer]);
        })
    );
  }
<<<<<<< Updated upstream
=======

  async parse(node: PointCloudEptGeometryNode, data: ArrayBuffer): Promise<ParsedEptData> {
    const autoTerminatingWorker = await EptBinaryLoader.WORKER_POOL.getWorker();

    return new Promise<ParsedEptData>(res => {
      autoTerminatingWorker.worker.onmessage = (e: { data: ParsedEptData }) => {
        EptBinaryLoader.WORKER_POOL.releaseWorker(autoTerminatingWorker);
        res(e.data);
      };

      const relevantStylableObjects = this._stylableObjectsWithBoundingBox
        .filter(p => p.box.intersectsBox(node.getBoundingBox()))
        .map(p => p.object);

      postStylableObjectInfo(autoTerminatingWorker, node, relevantStylableObjects);

      const eptData: EptInputData = {
        buffer: data,
        schema: node.ept.schema,
        scale: node.ept.eptScale,
        offset: node.ept.eptOffset,
        mins: fromThreeVector3(node.key.b.min)
      };
      console.log(`Posting parse command for node ${node.name}`);
      postParseCommand(autoTerminatingWorker, eptData);
    });
  }
}

function createTightBoundingBox(data: ParsedEptData): THREE.Box3 {
  return new THREE.Box3(
    new THREE.Vector3().fromArray(data.tightBoundingBox.min),
    new THREE.Vector3().fromArray(data.tightBoundingBox.max)
  );
}

function postParseCommand(autoTerminatingWorker: AutoTerminatingWorker, data: EptInputData) {
  const parseMessage: ParseCommand = {
    type: 'parse',
    data
  };

  autoTerminatingWorker.worker.postMessage(parseMessage, [parseMessage.data.buffer]);
}

function postStylableObjectInfo(
  autoTerminatingWorker: AutoTerminatingWorker,
  node: PointCloudEptGeometryNode,
  stylableObjects: RawStylableObject[]
): void {
  const offsetVec = node.boundingBox.min;

  const objectMessage: ObjectsCommand = {
    type: 'objects',
    objects: stylableObjects,
    pointOffset: [offsetVec.x, offsetVec.y, offsetVec.z] as [number, number, number]
  };

  autoTerminatingWorker.worker.postMessage(objectMessage);
}

function createGeometryFromEptData(data: ParsedEptData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  function addAttributeIfPresent<TypedArray extends ArrayLike<number>>(
    typedArrayConstructor: { new (data: ArrayBuffer): TypedArray },
    name: string,
    componentCount: number,
    data?: ArrayBuffer | undefined,
    normalized: boolean = false
  ): void {
    if (data) {
      const typedArray = new typedArrayConstructor(data);
      geometry.setAttribute(name, new THREE.BufferAttribute(typedArray, componentCount, normalized));
    }
  }

  addAttributeIfPresent<Float32Array>(Float32Array, 'position', 3, data.position);
  addAttributeIfPresent<Uint32Array>(Uint32Array, 'indices', 1, data.indices);
  addAttributeIfPresent<Uint8Array>(Uint8Array, 'color', 4, data.color, true);
  addAttributeIfPresent<Float32Array>(Float32Array, 'intensity', 1, data.intensity);
  addAttributeIfPresent<Uint8Array>(Uint8Array, 'classification', 1, data.classification);
  addAttributeIfPresent<Uint8Array>(Uint8Array, 'return number', 1, data.returnNumber);
  addAttributeIfPresent<Uint8Array>(Uint8Array, 'number of returns', 1, data.numberOfReturns);
  addAttributeIfPresent<Uint16Array>(Uint16Array, 'source id', 1, data.pointSourceId);
  addAttributeIfPresent<Uint16Array>(Uint16Array, 'objectId', 1, data.objectId);

  geometry.attributes.indices.normalized = true;

  return geometry;
>>>>>>> Stashed changes
}
