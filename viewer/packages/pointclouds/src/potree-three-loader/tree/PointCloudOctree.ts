import { Box3, Camera, Object3D, Points, Ray, Sphere, Vector3, WebGLRenderer } from 'three';
import { DEFAULT_MIN_NODE_PIXEL_SIZE } from '../rendering/constants';
import { PointCloudMaterial, PotreePointSizeType } from '../rendering';
import { IPointCloudTreeGeometry } from '../geometry/IPointCloudTreeGeometry';
import { IPointCloudTreeGeometryNode } from '../geometry/IPointCloudTreeGeometryNode';
import { PointCloudOctreeNode } from './PointCloudOctreeNode';
import { PickParams, PointCloudOctreePicker } from './PointCloudOctreePicker';
import { PointCloudTree } from './PointCloudTree';
import { PickPoint } from '../types/types';
import { IPotree } from '../types/IPotree';
import { IPointCloudTreeNodeBase } from './IPointCloudTreeNodeBase';
import { IPointCloudTreeNode } from './IPointCloudTreeNode';
import { computeTransformedBoundingBox } from '../utils/bounds';

export class PointCloudOctree extends PointCloudTree {
  potree: IPotree;
  disposed: boolean = false;
  pcoGeometry: IPointCloudTreeGeometry;
  boundingBox: Box3;
  boundingSphere: Sphere;
  material: PointCloudMaterial;
  level: number = 0;
  maxLevel: number = Infinity;
  /**
   * The minimum radius of a node's bounding sphere on the screen in order to be displayed.
   */
  minNodePixelSize: number = DEFAULT_MIN_NODE_PIXEL_SIZE;
  root: IPointCloudTreeNodeBase | undefined = undefined;
  boundingBoxNodes: Object3D[] = [];
  visibleNodes: IPointCloudTreeNode[] = [];
  visibleGeometry: IPointCloudTreeGeometryNode[] = [];
  numVisiblePoints: number = 0;
  private picker: PointCloudOctreePicker | undefined;

  constructor(potree: IPotree, pcoGeometry: IPointCloudTreeGeometry, material?: PointCloudMaterial) {
    super();

    this.name = '';
    this.potree = potree;
    this.root = pcoGeometry.root;
    this.pcoGeometry = pcoGeometry;
    this.boundingBox = pcoGeometry.boundingBox;
    this.boundingSphere = this.boundingBox.getBoundingSphere(new Sphere());

    this.position.copy(pcoGeometry.offset);

    this.material = material || new PointCloudMaterial();
    this.updateMaterial();
  }

  private updateMaterial(): void {
    this.material.heightMin = this.pcoGeometry.tightBoundingBox.min.clone().applyMatrix4(this.matrix).y;
    this.material.heightMax = this.pcoGeometry.tightBoundingBox.max.clone().applyMatrix4(this.matrix).y;
  }

  dispose(): void {
    if (this.root) {
      this.root.dispose();
    }

    this.pcoGeometry.root?.traverse(n => this.potree.lru.remove(n));
    this.pcoGeometry.dispose();
    this.material.dispose();

    this.visibleNodes = [];
    this.visibleGeometry = [];

    if (this.picker) {
      this.picker.dispose();
      this.picker = undefined;
    }

    this.disposed = true;
  }

  get pointSizeType(): PotreePointSizeType {
    return this.material.pointSizeType;
  }

  set pointSizeType(value: PotreePointSizeType) {
    this.material.pointSizeType = value;
  }

  toTreeNode(geometryNode: IPointCloudTreeGeometryNode, parent?: IPointCloudTreeNode | null): IPointCloudTreeNode {
    const points = new Points(geometryNode.geometry, this.material);
    const node = new PointCloudOctreeNode(geometryNode, points);
    points.name = geometryNode.name;
    points.position.copy(geometryNode.boundingBox.min);
    points.frustumCulled = false;
    points.onBeforeRender = PointCloudMaterial.makeOnBeforeRender(this, node);

    console.log('Making node', geometryNode.name, 'into a tree node');

    if (parent) {
      parent.sceneNode.add(points);
      parent.children[geometryNode.index] = node;

      geometryNode.oneTimeDisposeHandlers.push(() => {
        console.log("Disposing of node ", node.name);
        node.disposeSceneNode();

        parent.sceneNode.remove(node.sceneNode);
        // Replace the tree node (rendered and in the GPU) with the geometry node.
        parent.children[geometryNode.index] = geometryNode;
      });
    } else {
      this.root = node;
      this.add(points);
    }

    return node;
  }

  updateMatrixWorld(force: boolean): void {
    if (this.matrixAutoUpdate === true) {
      this.updateMatrix();
    }

    if (this.matrixWorldNeedsUpdate === true || force === true) {
      if (!this.parent) {
        this.matrixWorld.copy(this.matrix);
      } else {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      }

      this.updateMaterial();

      this.matrixWorldNeedsUpdate = false;
    }
  }

  hideDescendants(object: Object3D): void {
    const toHide: Object3D[] = [];
    addVisibleChildren(object);

    while (toHide.length > 0) {
      const objToHide = toHide.shift()!;
      objToHide.visible = false;
      addVisibleChildren(objToHide);
    }

    function addVisibleChildren(obj: Object3D) {
      for (const child of obj.children) {
        if (child.visible) {
          toHide.push(child);
        }
      }
    }
  }

  pick(renderer: WebGLRenderer, camera: Camera, ray: Ray, params: Partial<PickParams> = {}): PickPoint | null {
    this.picker = this.picker || new PointCloudOctreePicker();
    return this.picker.pick(renderer, camera, ray, [this], params);
  }
}
