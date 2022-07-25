/*!
 * Copyright 2022 Cognite AS
 */

import { ModelDataProvider } from "@reveal/modeldata-api";
import { EptKey } from "./PointCloudEptMetadata";

export type EptHierarchy = {
  [key:string]: number;
};

function hierarchyNodeNameTopDownCompare(nameA: string, nameB: string): number {
      const [da, xa, ya, za] = nameA.split('-').map(n => parseInt(n, 10));
  const [db, xb, yb, zb] = nameB.split('-').map(n => parseInt(n, 10));
  if (da < db) return -1;
  if (da > db) return 1;
  if (xa < xb) return -1;
  if (xa > xb) return 1;
  if (ya < yb) return -1;
  if (ya > yb) return 1;
  if (za < zb) return -1;
  if (za > zb) return 1;
  return 0;
}

export function getKeysTopDown(hier: EptHierarchy): string[] {
  return Object.keys(hier).sort(hierarchyNodeNameTopDownCompare);
}

export function getParentName(nodeName: string): string {
      const [d, x, y, z] = nodeName.split('-').map(n => parseInt(n, 10));
      return d - 1 + '-' + (x >> 1) + '-' + (y >> 1) + '-' + (z >> 1);
}

export async function loadEptHierarchyJson(url: string, key: EptKey, dataLoader: ModelDataProvider): Promise<EptHierarchy> {

  const baseUrl = `${url}/ept-hierarchy`;
  const fileName = `${key.name()}.json`;

  return await dataLoader.getJsonFile(baseUrl, fileName) as EptHierarchy;
}
