/*!
 * Copyright 2021 Cognite AS
 */

import { Cognite3DViewer } from '@reveal/core';
import { Cognite3DViewerToolBase } from '../Cognite3DViewerToolBase';
import { Toolbar } from './Toolbar';

export class ToolbarTool extends Cognite3DViewerToolBase {
  private readonly _viewer: Cognite3DViewer;
  private readonly _toolbar: Toolbar;

  constructor(viewer: Cognite3DViewer) {
    super();

    this._viewer = viewer;
    this._toolbar = new Toolbar(this._viewer);
  }

  public addToolbarItem(text: string, backgroundColor: string, backgroundImage: string) {
    this._toolbar.addToolbarItem(text, backgroundColor, backgroundImage);
  }

  public dispose(): void {
    super.dispose();
  }
}
