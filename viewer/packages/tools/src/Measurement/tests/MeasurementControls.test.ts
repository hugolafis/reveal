/*!
 * Copyright 2022 Cognite AS
 */
import { CogniteClient } from '@cognite/sdk';
import { Cognite3DViewer } from '@reveal/core';
import * as THREE from 'three';
import { createGlContext, mockClientAuthentication } from '../../../../../test-utilities';
import { MeasurementControls } from '../MeasurementControls';
import { MeasurementDistance } from '../MeasurementDistance';

describe(MeasurementControls.name, () => {
  let viewer: Cognite3DViewer;
  let canvasContainer: HTMLElement;
  let domSize: { height: number; width: number };

  let measurementControls: MeasurementControls;

  beforeEach(() => {
    const sdk = new CogniteClient({
      appId: 'cognite.reveal.unittest',
      project: 'dummy',
      getToken: async () => 'dummy'
    });
    mockClientAuthentication(sdk);
    const context = createGlContext(64, 64, { preserveDrawingBuffer: true });
    const renderer = new THREE.WebGLRenderer({ context });
    renderer.render = jest.fn();

    domSize = { height: 480, width: 640 };
    canvasContainer = document.createElement('div');
    canvasContainer.style.width = `${domSize.width}px`;
    canvasContainer.style.height = `${domSize.height}px`;
    viewer = new Cognite3DViewer({ domElement: canvasContainer, sdk, renderer });

    measurementControls = new MeasurementControls(viewer);
  });

  test('Add a distance measurement type to the controls', () => {
    const addMock = jest.spyOn(measurementControls, 'add');
    measurementControls.add(new MeasurementDistance(viewer));

    expect(addMock).toBeCalled();
  });

  test('Remove distance measurement', () => {
    const removeMock = jest.spyOn(measurementControls, 'remove');
    measurementControls.remove();

    expect(removeMock).toBeCalledTimes(1);
  });

  test('Check multiple removal of measurement type', () => {
    const removeMock = jest.spyOn(measurementControls, 'remove');
    measurementControls.add(new MeasurementDistance(viewer));

    expect((measurementControls as any)._measurement).toBeDefined();
    measurementControls.remove();

    expect((measurementControls as any)._measurement).toBeNull();
    measurementControls.remove();

    expect(removeMock).toBeCalledTimes(2);
  });
});