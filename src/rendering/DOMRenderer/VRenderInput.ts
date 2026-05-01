import { RenderInput } from './RenderInput';

import { Eventable, Siblings } from '../../dataModel';

export type VInputEvents = {};

export class VRenderInput<T extends object> extends Eventable<VInputEvents> {
  focus?: () => void;
  blur?: () => void;

  constructor({
    offset,
    renderViewNode,
  }: {
    offset: number;
    renderViewNode?: VRenderInput<T>['renderViewNode'];
  }) {
    super();

    this.offset = offset;
    this.renderViewNode = renderViewNode;
  }

  throughOffset: boolean = false;
  textInputDisabled: boolean = false;
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

  get nextInput(): VRenderInput<T> | null {
    if (this.siblings.next) {
      return this.siblings.next;
    } else if (this.siblings.parent?.nextInput) {
      return this.siblings.parent?.nextInput.siblings.firstChild;
    }

    return null;
  }

  get previousInput(): VRenderInput<T> | null {
    if (this.siblings.previous) {
      return this.siblings.previous;
    } else if (this.siblings.parent?.previousInput) {
      return this.siblings.parent?.previousInput.siblings.lastChild;
    }

    return null;
  }

  renderViewNode?: () => T;
}
