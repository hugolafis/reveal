/*!
 * Copyright 2024 Cognite AS
 * BaseTool: Base class for the tool are used to interact with the render target.
 */

import { BaseTool } from './BaseTool';
import { type IFlexibleCameraManager } from '@cognite/reveal';
import { type TranslateKey } from '../utilities/TranslateKey';

/**
 * Represents a tool navigation tool used for camera manipulation.
 * Inherit from this class if you like to have some camera manipulation in your tool.
 */
export class NavigationTool extends BaseTool {
  // ==================================================
  // INSTANVE PROPERTIES
  // ==================================================

  private get cameraManager(): IFlexibleCameraManager {
    return this.renderTarget.flexibleCameraManager;
  }

  // ==================================================
  // OVERRIDES
  // ==================================================

  public override get shortCutKey(): string | undefined {
    return 'N';
  }

  public override get icon(): string {
    return 'Grab';
  }

  public override get tooltip(): TranslateKey {
    return { key: 'NAVIGATION', fallback: 'Navigation' };
  }

  public override async onClick(event: PointerEvent): Promise<void> {
    await this.cameraManager.onClick(event);
  }

  public override async onDoubleClick(event: PointerEvent): Promise<void> {
    await this.cameraManager.onDoubleClick(event);
  }

  public override async onPointerDown(event: PointerEvent, leftButton: boolean): Promise<void> {
    await this.cameraManager.onPointerDown(event, leftButton);
  }

  public override async onPointerDrag(event: PointerEvent, leftButton: boolean): Promise<void> {
    await this.cameraManager.onPointerDrag(event, leftButton);
  }

  public override async onPointerUp(event: PointerEvent, leftButton: boolean): Promise<void> {
    await this.cameraManager.onPointerUp(event, leftButton);
  }

  public override async onWheel(event: WheelEvent): Promise<void> {
    await this.cameraManager.onWheel(event);
  }

  public override onKey(event: KeyboardEvent, down: boolean): void {
    this.cameraManager.onKey(event, down);
  }

  public override onFocusChanged(haveFocus: boolean): void {
    this.cameraManager.onFocusChanged(haveFocus);
  }
}
