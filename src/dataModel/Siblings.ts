/*

export interface TreeNode<
    TNode extends TreeNode<TNode, TParent, TChild>,
    TParent extends TreeNode<any, any, any> | null = any,
    TChild extends TreeNode<any, any, any> | null = any
> {
    siblings: Siblings<TNode, TParent, TChild>;
}

export class Siblings<
    TNode extends TreeNode<TNode, TParent, TChild>, 
    TParent extends TreeNode<any, any, any>, 
    TChild extends TreeNode<any, any, any>
>

*/
import { Eventable } from './Eventable';

export interface TreeNode {
  siblings: Siblings<any, any, any>;
}

export type TSelector = (treeData: {
  level: number;
  item: TreeNode;
}) => boolean;

export type TSelectorSettings = {
  from?: TreeNode | TreeNode[];
  to?: TreeNode;
  arrow?: -1 | 1;
  maxLevel?: number;
  minLevel?: number;
  currentLevel?: number;
};

type GetT<
  TChild extends TreeNode,
  Acc = TChild,
  Checked = never,
> = 0 extends 1 & TChild // Проверка на any
  ? never
  : TChild extends Checked
    ? Acc
    : TChild['siblings']['children'][number] extends infer Next
      ? Next extends TreeNode
        ? GetT<Next, Acc | Next, Checked | TChild>
        : Acc
      : Acc;

export type TSiblingEvents<TChild extends TreeNode> = {
  [x: string]: (...args: any[]) => void;
  mounted: (...child: GetT<TChild>[]) => void;
  unmounted: (child: GetT<TChild>) => void;
};

export class Siblings<
  TNode extends TreeNode,
  TParent extends TreeNode,
  TChild extends TreeNode,
> extends Eventable<TSiblingEvents<TChild>> {
  private _node: TNode;

  private _next: TNode | null = null;
  private _previous: TNode | null = null;
  private _parent: TParent | null = null;

  private _firstChild: TChild | null = null;
  private _lastChild: TChild | null = null;

  constructor({ node }: { node: TNode }) {
    super();
    this._node = node;
  }

  get next() {
    return this._next;
  }

  get previous() {
    return this._previous;
  }

  get node() {
    return this._node;
  }

  get parent() {
    return this._parent;
  }

  get firstChild() {
    return this._firstChild;
  }

  get lastChild() {
    return this._lastChild;
  }

  get children(): TChild[] {
    let current = this._firstChild;
    let result: TChild[] = [];

    while (current) {
      result.push(current);

      current = current.siblings.next;
    }

    return result;
  }

  has(node: TreeNode): boolean {
    return node.siblings.parent === this._node;
  }

  *orderedChildrenEntries(): Generator<[number, TChild]> {
    let current = this._firstChild;
    let index = 0;

    while (current) {
      yield [index, current];

      current = current.siblings.next;
      index++;
    }
  }

  /*

    select(selector: TSelector, settings: TSelectorSettings = {}) {
        const { from, maxLevel, minLevel, arrow = 1, currentLevel = 0 } = settings;
        const result = [];

        if (maxLevel ? currentLevel + 1 > maxLevel : false) {
            return result;
        }

        const inMinRange = minLevel ? currentLevel + 1 >= minLevel : true;

        for(let [i, child] of this.orderedChildrenEntries()) {
            if (inMinRange && selector({level: currentLevel + 1, item: child})) {
                result.push(child);
            }

            const inner = child.siblings.select(selector, { currentLevel: currentLevel + 1, arrow, maxLevel, minLevel });

            result.push(...inner);
        }

        return result;
    }

    */

  select(selector: TSelector, settings: TSelectorSettings = {}) {
    return [...this._select(selector, settings)];
  }

  private *_select(
    selector: TSelector,
    settings: TSelectorSettings = {}
  ): Generator<TChild | TNode> {
    const { from, maxLevel, minLevel, currentLevel = 0 } = settings;
    let nextLevel = currentLevel + 1;

    if (from && !(from instanceof Array)) {
      const chain = [...getParentChain(from, this.node)].reverse();
      console.log('deb', chain);
      if (chain.length < 2) {
        return;
      }

      yield* chain[1].siblings._select(selector, {
        ...settings,
        from: chain.slice(1),
        currentLevel: nextLevel,
      });

      return;
    }
    console.log('deb', from);

    let current: TChild | TNode;

    if (from instanceof Array) {
      if (from.length > 1) {
        yield* from[1].siblings._select(selector, {
          ...settings,
          from: from.slice(1),
          currentLevel: nextLevel,
        });

        current =
          settings.arrow === -1
            ? from[1].siblings.previous
            : from[1].siblings.next;
      } else if (from.length === 1 && from[0] === this.node) {
        current = from[0] as TNode;
        nextLevel--;
      }
    } else {
      if (!this._firstChild) {
        return;
      }

      current = settings.arrow === -1 ? this._lastChild! : this._firstChild;
    }

    // 1. Проверка на выход за границы уровня
    if (maxLevel !== undefined && nextLevel > maxLevel) {
      return; // Просто выходим, ничего не возвращая
    }

    const inMinRange = minLevel === undefined || nextLevel >= minLevel;
    while (current!) {
      // Проверяем текущего ребенка
      if (inMinRange && selector({ level: nextLevel, item: current })) {
        yield current;
      }

      if (current === settings.to) {
        return;
      }

      // Рекурсивно идем вглубь через yield*
      yield* current.siblings._select(selector, {
        ...settings,
        from: undefined,
        currentLevel: nextLevel,
      });

      current =
        settings.arrow === -1
          ? current.siblings.previous
          : (current.siblings.next as TChild);
    }
  }

  remove() {
    const node = this._node;

    if (this._parent) {
      const parent = this._parent;

      if (parent.siblings.has(node)) {
        if (parent.siblings._firstChild === node) {
          parent.siblings._firstChild = node.siblings._next;
        }
        if (parent.siblings._lastChild === node) {
          parent.siblings._lastChild = node.siblings._previous;
        }
      }
    }

    if (node.siblings._next) {
      node.siblings._next.siblings._previous = node.siblings._previous;
    }
    if (node.siblings._previous) {
      node.siblings._previous.siblings._next = node.siblings._next;
    }

    const parent = this._parent;

    this._next = null;
    this._previous = null;
    this._parent = null;

    // TODO: дургие события без всплытия на сам инстанс и без аргумента
    parent?.siblings.emit('unmounted', this._node);
    this.emit('unmounted', this._node);
  }

  private _appendChild(node: TChild) {
    node.siblings.remove();

    if (this._lastChild) {
      this._lastChild.siblings._next = node;
      node.siblings._previous = this._lastChild;
    }

    node.siblings._parent = this._node;
    this._lastChild = node;

    if (!this._firstChild) {
      this._firstChild = node;
    }
  }

  appendChilds(...nodes: TChild[]) {
    for (let n of nodes) {
      this._appendChild(n);
    }

    this.emit('mounted', ...nodes);
  }

  appendChild(node: TChild) {
    this._appendChild(node);

    // TODO: дургие события без всплытия на сам инстанс и без аргумента
    this.emit('mounted', node);
  }

  private _insertBefore(node: TNode) {
    this.remove();

    const nodeSiblings = node.siblings;
    const nodePrev = nodeSiblings._previous;

    nodeSiblings._previous = this._node;
    this._next = node;
    this._previous = nodePrev;

    this._parent = nodeSiblings._parent;

    if (nodePrev) {
      nodePrev.siblings._next = this._node;
    } else if (nodeSiblings._parent) {
      nodeSiblings._parent.siblings._firstChild = this._node;
    }
  }

  insertBefore(node: TNode) {
    this._insertBefore(node);

    this._parent?.siblings.emit('mounted', this._node);
    //this.emit('mounted', this._node);
  }

  insertBeforeThis(...nodes: TNode[]) {
    for (let node of nodes) {
      node.siblings._insertBefore(this._node);
    }

    this._parent?.siblings.emit('mounted', ...nodes);
    //this.emit('mounted', this._node);
  }

  insertAfter(node: TNode) {
    if (!node.siblings._next) {
      node.siblings._parent?.siblings.appendChild(this._node);
    } else {
      this.insertBefore(node.siblings._next);
    }
  }

  indexOf() {
    let current: Siblings<TNode, TParent, TChild> | null | undefined = this;
    let index = -1;

    while (current) {
      current = current.previous?.siblings;

      index++;
    }

    return index;
  }

  emit<K extends keyof TSiblingEvents<TChild>>(
    event: K,
    ...data: Parameters<TSiblingEvents<TChild>[K]>
  ): void {
    super.emit(event, ...data);
    this._parent?.siblings.emit(event, ...data);
  }
}

function* getParentChain(
  from: TreeNode,
  parent?: TreeNode
): Generator<TreeNode> {
  try {
    yield* _getParentChain(from, parent);
  } catch (e) {
    console.error('From: ', from);
    console.error('Parent: ', parent);
    throw e;
  }
}

function* _getParentChain(
  from: TreeNode,
  parent?: TreeNode
): Generator<TreeNode> {
  if (!from) {
    if (parent) {
      throw new Error(
        'Узел parent не является родителем для для данного узла from'
      );
    }

    return;
  }
  if (from === parent) {
    yield parent;
  } else {
    yield from;
    yield* getParentChain(from.siblings.parent, parent);
  }
}
