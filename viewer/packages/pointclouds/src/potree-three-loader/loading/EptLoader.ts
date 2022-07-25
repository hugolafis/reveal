import { ModelDataProvider } from '@reveal/modeldata-api';
import { PointCloudEptMetadata } from '../geometry/PointCloudEptMetadata';
import { PointCloudEptGeometryNode } from '../geometry/PointCloudEptGeometryNode';

export class EptLoader {
  static async load(
    baseUrl: string,
    fileName: string,
    modelDataProvider: ModelDataProvider
  ): Promise<PointCloudEptMetadata> {
    return modelDataProvider.getJsonFile(baseUrl, fileName).then(async (json: any) => {
      const url = baseUrl;
      const metadata = new PointCloudEptMetadata(url, json, modelDataProvider);
      const root = new PointCloudEptGeometryNode(metadata, modelDataProvider);

      metadata.root = root;
      await metadata.root.load();
      return metadata;
    });
  }
}
