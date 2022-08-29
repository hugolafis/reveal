/*!
 * Copyright 2022 Cognite AS
 */

import { StylableObject } from '../../styling/StylableObject';
import { assignPoints } from '../../../wasm';
import { Cylinder } from '../../styling/shapes/Cylinder';
import { Box } from '../../styling/shapes/Box';
import { AABB, Vec3 } from '../../styling/shapes/linalg';

function getWasmShape(obj: StylableObject): any {
  if (obj.shape instanceof Cylinder) {
    const cylinder = obj.shape as Cylinder;
    return {
      object_id: obj.objectId,
      cylinder: {
        center_a: cylinder.centerA,
        center_b: cylinder.centerB,
        radius: cylinder.radius
      }
    };
  } else if (obj.shape instanceof Box) {
    const box = obj.shape as Box;
    return {
      object_id: obj.objectId,
      oriented_box: {
        inv_instance_matrix: box.invMatrix
      }
    };
  } else {
    throw Error('Unrecognized shape type');
  }
}

export async function assignPointsWithWasm(
  points: Float32Array,
  objects: StylableObject[],
  pointOffset: Vec3,
  sectorBoundingBox: AABB
): Promise<Uint16Array> {
  const wasmShapes = objects.map(obj => getWasmShape(obj));

  const res = assignPoints(
    wasmShapes,
    points,
    sectorBoundingBox,
    pointOffset
  );

  return res;
}
