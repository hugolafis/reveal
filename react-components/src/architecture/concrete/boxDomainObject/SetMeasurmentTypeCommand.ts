/*!
 * Copyright 2024 Cognite AS
 * BaseTool: Base class for the tool are used to interact with the render target.
 */

import { RenderTargetCommand } from '../../base/commands/RenderTargetCommand';
import { type BaseCommand, type Tooltip } from '../../base/commands/BaseCommand';
import { MeasureType, getIconByMeasureType, getTooltipByMeasureType } from './MeasureType';
import { MeasurementTool } from './MeasurementTool';

export class SetMeasurmentTypeCommand extends RenderTargetCommand {
  private readonly _measureType: MeasureType;

  // ==================================================
  // CONSTRUCTOR
  // ==================================================

  public constructor(measureType: MeasureType) {
    super();
    this._measureType = measureType;
  }

  // ==================================================
  // OVERRIDES of BaseCommand
  // ==================================================

  public override get icon(): string {
    return getIconByMeasureType(this._measureType);
  }

  public override get tooltip(): Tooltip {
    return getTooltipByMeasureType(this._measureType);
  }

  public override get isEnabled(): boolean {
    return this.measurementTool !== undefined;
  }

  public override get isCheckable(): boolean {
    return true;
  }

  public override get isChecked(): boolean {
    const { measurementTool } = this;
    if (measurementTool === undefined) {
      return false;
    }
    return measurementTool.measureType === this._measureType;
  }

  protected override invokeCore(): boolean {
    const { measurementTool } = this;
    if (measurementTool === undefined) {
      return false;
    }
    measurementTool.handleEscape();
    measurementTool.clearDragging();
    if (measurementTool.measureType === this._measureType) {
      measurementTool.measureType = MeasureType.None;
    } else {
      measurementTool.measureType = this._measureType;
    }
    return true;
  }

  public override equals(other: BaseCommand): boolean {
    if (!(other instanceof SetMeasurmentTypeCommand)) {
      return false;
    }
    return this._measureType === other._measureType;
  }

  // ==================================================
  // INSTANCE METHODS
  // ==================================================

  private get measurementTool(): MeasurementTool | undefined {
    const activeTool = this.renderTarget.commandsController.activeTool;
    if (!(activeTool instanceof MeasurementTool)) {
      return undefined;
    }
    return activeTool;
  }
}