/*!
 * Copyright 2022 Cognite AS
 */

import { Cognite3DViewer } from '@reveal/core';
import * as THREE from 'three';
import { HtmlOverlayTool } from '../HtmlOverlay/HtmlOverlayTool';

export class MeasurementLabel {
  private readonly _htmlOverlay: HtmlOverlayTool;
  private _labelElement: HTMLDivElement;

  constructor(viewer: Cognite3DViewer) {
    this._htmlOverlay = new HtmlOverlayTool(viewer);
  }

  private createLabel(label: string) {
    const element = document.createElement('div');
    element.innerText = label;
    element.style.cssText = `
      position: absolute;

      /* Anchor to the center of the element and ignore events */
      transform: translate(-50%, -50%);
      pointer-events: none;
      touch-action: none;
      user-select: none;
      borderRadius: 25%;
      -webkit-border-radius: 25%;
      -moz-border-radius: 25%;

      /* Make it look nice */
      padding: 10px;
      minHeight: 50px;
      color: #fff;
      background: #232323da;
      border: '#ffffff22 solid 2px;
      overflow: hidden;
    `;
    return element;
  }

  /**
   * Add a label
   * @param position Label position
   */
  public add(position: THREE.Vector3): void {
    this._labelElement = this.createLabel('0');
    this._htmlOverlay.add(this._labelElement, position);
  }

  /**
   * Remove the label
   */
  public removeLabel(): void {
    if (this._labelElement) {
      this._htmlOverlay.remove(this._labelElement);
    }
  }

  /**
   * Update the label position & text
   * @param label Text to update in the element
   * @param startPoint start point
   * @param endPoint end point
   */
  public update(label: string, startPoint: THREE.Vector3, endPoint: THREE.Vector3): void {
    let direction = endPoint.clone().sub(startPoint);
    const length = direction.length();
    direction = direction.normalize().multiplyScalar(length * 0.5);
    const midPoint = startPoint.clone().add(direction);

    this._htmlOverlay.elements.forEach(htmlElement => {
      if (htmlElement.element === this._labelElement) {
        htmlElement.position3D.set(midPoint.x, midPoint.y, midPoint.z);
        htmlElement.element.innerText = label;
      }
    });
  }
}