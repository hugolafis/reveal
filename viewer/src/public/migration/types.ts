/*!
 * Copyright 2020 Cognite AS
 */

import { CogniteClient } from '@cognite/sdk';

import { SectorCuller } from '@/datamodels/cad/sector/culling/SectorCuller';
import { Cognite3DModel } from './Cognite3DModel';

/**
 * @module @cognite/reveal
 */
export type Color = {
  r: number;
  g: number;
  b: number;
};
/**
 * Callback to monitor downloaded requests and progress.
 * Use OnLoadingCallback instead of onProgress/onComplete.
 * @module @cognite/reveal
 */
export type OnLoadingCallback = (itemsDownloaded: number, itemsRequested: number) => void;

/**
 * @module @cognite/reveal
 */
export interface Cognite3DViewerOptions {
  sdk: CogniteClient;

  /** An existing DOM element that we will render canvas into. */
  domElement?: HTMLElement;

  /** Send anonymous usage statistics. */
  logMetrics?: boolean;

  /** @deprecated And ignored. */
  highlightColor?: THREE.Color;

  /** @deprecated And ignored. */
  noBackground?: boolean;

  /** @deprecated And not supported. */
  viewCube?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

  /** @deprecated And not supported. */
  enableCache?: boolean;

  /** Renderer used to visualize model (optional). */
  renderer?: THREE.WebGLRenderer;

  /** Callback to download stream progress. */
  onLoading?: OnLoadingCallback;

  /**
   * Utility used to determine what parts of the model will be visible on screen and loaded.
   * This is only meant for unit testing.
   * @internal
   */
  _sectorCuller?: SectorCuller;
}

/**
 * @module @cognite/reveal
 */
export interface GeometryFilter {
  boundingBox?: THREE.Box3;
}

/**
 * @module @cognite/reveal
 */
export interface AddModelOptions {
  modelId: number;
  revisionId: number;
  // if you need to access local files, this is where you would specify it
  localPath?: string;
  geometryFilter?: GeometryFilter;
  orthographicCamera?: boolean;
  onComplete?: () => void;
}

/**
 * Represents the result from {@link Cognite3DViewer.getIntersectionFromPixel}.
 * @module @cognite/reveal
 */
export interface Intersection {
  model: Cognite3DModel;
  treeIndex: number;
  point: THREE.Vector3;
}

/**
 * @module @cognite/reveal
 */
export { CameraConfiguration } from '@/utilities';

/**
 * Delegate for pointer events.
 * @module @cognite/reveal
 * @see {@link Cognite3DViewer.on}
 */
export type PointerEventDelegate = (event: { offsetX: number; offsetY: number }) => void;

/**
 * Delegate for camera update events.
 * @module @cognite/reveal
 * @see {@link Cognite3DViewer.on}
 */
export type CameraChangeDelegate = (position: THREE.Vector3, target: THREE.Vector3) => void;
