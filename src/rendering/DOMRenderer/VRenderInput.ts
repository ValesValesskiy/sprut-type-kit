import { RenderInput } from './RenderInput';

import { Siblings } from '../../dataModel';

export class VRenderInput<T extends object> {
  focus?: () => void;
  blur?: () => void;

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

  throughOffset: boolean = false;
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
    return prev.startIndex + (this.throughOffset ? 0 : this.offset);
  }

  get length(): number {
    // return (
    //   this.startIndex + this.offset - (this.siblings.previous?.startIndex ?? 0)
    // );

    return (
      (this.siblings.next?.throughOffset
        ? (this.siblings.next?.length ?? 0)
        : this.siblings.next?.offset) ??
      this.siblings.parent!.dataNode!.content.length - this.startIndex
    );
  }

  get content() {
    const start = this.startIndex;

    return this.siblings.parent?.dataNode?.content.substring(
      start,
      this.siblings.next
        ? start +
            (this.siblings.next.throughOffset
              ? (this.siblings.next.length ?? 0)
              : this.siblings.next?.offset)
        : undefined
    );
  }

  renderViewNode?: () => T;
}
