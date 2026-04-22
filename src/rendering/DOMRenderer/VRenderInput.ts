import { RenderInput } from './RenderInput';

import { Siblings } from '../../dataModel';

export class VRenderInput<T extends object> {
  constructor({
    offset,
    renderViewNode,
  }: {
    offset: number;
    renderViewNode?: VRenderInput<T>['renderViewNode'];
  }) {
    this.offset = offset;
    this.renderViewNode = renderViewNode;
  }

  offset: number;

  element?: T;
  // siblings: Siblings<VRenderInput<T>, RenderInput<T> | VRenderInput<T>, VRenderInput<T>> =
  siblings: Siblings<VRenderInput<T>, RenderInput<T>, any> = new Siblings({
    node: this,
  });

  get startIndex(): number {
    const prev = this.siblings.previous;

    if (!prev) {
      return 0;
    }
    console.log(prev);
    return prev.startIndex + this.offset;
  }

  get length() {
    // return (
    //   this.startIndex + this.offset - (this.siblings.previous?.startIndex ?? 0)
    // );

    return (
      this.siblings.next?.offset ??
      this.siblings.parent!.dataNode!.content.length - this.startIndex
    );
  }

  get content() {
    const start = this.startIndex;

    return this.parentRenderInput?.dataNode?.content.substring(
      start,
      this.siblings.next ? start + this.siblings.next?.offset : undefined
    );
  }

  get parentRenderInput(): RenderInput<T> | null {
    const parent = this.siblings.parent;

    if (parent instanceof RenderInput) {
      return parent;
    }

    return parent?.parentRenderInput ?? null;
  }

  renderViewNode?: () => T;
}
