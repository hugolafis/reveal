/*!
 * Copyright 2022 Cognite AS
 */
import * as THREE from 'three';

import { ConsumedSector, V9SectorMetadata, WantedSector, filterGeometryOutsideClipBox } from '@reveal/cad-parsers';
import { BinaryFileProvider } from '@reveal/modeldata-api';
import { CadMaterialManager } from '@reveal/rendering';
import { GltfSectorParser, ParsedGeometry, RevealGeometryCollectionType } from '@reveal/sector-parser';
import { MetricsLogger } from '@reveal/metrics';
import { AutoDisposeGroup, assertNever, incrementOrInsertIndex } from '@reveal/utilities';

import assert from 'assert';
import { ok, err, Result, ResultAsync } from 'neverthrow';

export class GltfSectorLoader {
  private readonly _gltfSectorParser: GltfSectorParser;
  private readonly _sectorFileProvider: BinaryFileProvider;
  private readonly _materialManager: CadMaterialManager;

  constructor(sectorFileProvider: BinaryFileProvider, materialManager: CadMaterialManager) {
    this._gltfSectorParser = new GltfSectorParser();
    this._sectorFileProvider = sectorFileProvider;
    this._materialManager = materialManager;
  }

  async loadSector(sector: WantedSector): Promise<Result<ConsumedSector, Error>> {
    const metadata = sector.metadata as V9SectorMetadata;
    const sectorByteBufferResult = ResultAsync.fromPromise(
      this._sectorFileProvider.getBinaryFile(sector.modelBaseUrl, metadata.sectorFileName!),
      () => {}
    );
    const sectorByteBuffer = await sectorByteBufferResult;
    if (sectorByteBuffer.isErr()) {
      MetricsLogger.trackError(new Error('Reading sector byte buffer from binary file resulted in error'), {
        moduleName: 'GltfSectorLoader',
        methodName: 'loadSector'
      });
      return err(new Error('Reading sector byte buffer from binary file resulted in error'));
    } else {
      const group = new AutoDisposeGroup();

      const parsedSectorGeometryResult = this._gltfSectorParser.parseSector(sectorByteBuffer.value);

      const parsedSectorGeometry = await parsedSectorGeometryResult;
      if (parsedSectorGeometry.isErr()) {
        return err(parsedSectorGeometry.error);
      }

      const materials = this._materialManager.getModelMaterials(sector.modelIdentifier);

      const geometryBatchingQueue: ParsedGeometry[] = [];

      parsedSectorGeometry.value.forEach(parsedGeometry => {
        const type = parsedGeometry.type as RevealGeometryCollectionType;

        const filteredGeometryBuffer = filterGeometryOutsideClipBox(
          parsedGeometry.geometryBuffer,
          type,
          sector.geometryClipBox ?? undefined
        );

        if (!filteredGeometryBuffer) return new Error('No Filtered Geometry Buffer');

        switch (type) {
          case RevealGeometryCollectionType.BoxCollection:
          case RevealGeometryCollectionType.CircleCollection:
          case RevealGeometryCollectionType.ConeCollection:
          case RevealGeometryCollectionType.EccentricConeCollection:
          case RevealGeometryCollectionType.EllipsoidSegmentCollection:
          case RevealGeometryCollectionType.GeneralCylinderCollection:
          case RevealGeometryCollectionType.GeneralRingCollection:
          case RevealGeometryCollectionType.QuadCollection:
          case RevealGeometryCollectionType.TorusSegmentCollection:
          case RevealGeometryCollectionType.TrapeziumCollection:
          case RevealGeometryCollectionType.NutCollection:
            geometryBatchingQueue.push({
              type,
              geometryBuffer: filteredGeometryBuffer,
              instanceId: RevealGeometryCollectionType[type].toString()
            });
            break;
          case RevealGeometryCollectionType.InstanceMesh:
            geometryBatchingQueue.push({
              type,
              geometryBuffer: filteredGeometryBuffer,
              instanceId: parsedGeometry.instanceId!
            });
            break;
          case RevealGeometryCollectionType.TriangleMesh:
            this.createMesh(group, parsedGeometry.geometryBuffer, materials.triangleMesh);
            break;
          default:
            assertNever(type);
        }
      });

      return ok({
        levelOfDetail: sector.levelOfDetail,
        group: group,
        instancedMeshes: [],
        metadata: metadata,
        modelIdentifier: sector.modelIdentifier,
        geometryBatchingQueue: geometryBatchingQueue
      });
    }
  }

  private createTreeIndexSet(geometry: THREE.BufferGeometry): Map<number, number> {
    const treeIndexAttribute = geometry.attributes['treeIndex'];
    assert(treeIndexAttribute !== undefined);

    const treeIndexSet = new Map<number, number>();

    for (let i = 0; i < treeIndexAttribute.count; i++) {
      incrementOrInsertIndex(treeIndexSet, treeIndexAttribute.getX(i));
    }

    return treeIndexSet;
  }

  private createMesh(group: AutoDisposeGroup, geometry: THREE.BufferGeometry, material: THREE.RawShaderMaterial) {
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    mesh.frustumCulled = false;

    mesh.userData.treeIndices = this.createTreeIndexSet(geometry);

    if (material.uniforms.inverseModelMatrix === undefined) return;

    mesh.onBeforeRender = () => {
      const inverseModelMatrix: THREE.Matrix4 = material.uniforms.inverseModelMatrix.value;
      inverseModelMatrix.copy(mesh.matrixWorld).invert();
    };
  }
}
