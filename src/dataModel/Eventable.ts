export type EventMap = Record<string, (...args: any[]) => void>;

export class Eventable<T extends EventMap> {
  private listeners: { [K in keyof T]?: Array<T[K]> } = {};

  on<K extends keyof T>(
    event: K,
    fn: (this: this, ...args: Parameters<T[K]>) => void
  ) {
    (this.listeners[event] || (this.listeners[event] = [])).push(fn as any);
  }

  emit<K extends keyof T>(event: K, ...data: Parameters<T[K]>) {
    (this.listeners[event] || []).forEach((fn) => fn.call(this, ...data));
  }

  pipeEvent<SourceEventMap extends EventMap, TargetEventMap extends T = T>(
    source: Eventable<SourceEventMap>,
    sourceName: keyof { [K in keyof SourceEventMap]: SourceEventMap[K] },
    eventName: TargetEventMap extends T
      ? keyof { [K in keyof TargetEventMap]: TargetEventMap[K] }
      : never,
    addArgs?: (
      ...args: Parameters<SourceEventMap[typeof sourceName]>
    ) => Parameters<TargetEventMap[typeof eventName]>
  ) {
    source.on(
      sourceName,
      (...args: Parameters<SourceEventMap[typeof sourceName]>) => {
        this.emit(
          eventName,
          ...((addArgs ? addArgs(...args) : args) as Parameters<
            TargetEventMap[typeof eventName]
          >)
        );
      }
    );
  }
}

export class SiblingsCustomEvent<T extends object> {
  private _isPropagation: boolean = true;
  private _onStopPropagation: () => void;
  private _name: string;
  private _details: T;

  constructor({
    name,
    onStopPropagation,
    isPropagation,
    details,
  }: {
    name: string;
    onStopPropagation: () => void;
    isPropagation?: boolean;
    details: T;
  }) {
    this._name = name;
    this._onStopPropagation = onStopPropagation;
    this._isPropagation = !!isPropagation;
    this._details = Object.freeze(details);
  }

  get name() {
    return this._name;
  }

  get isPropagation() {
    return this._isPropagation;
  }

  get details() {
    return this._details;
  }

  stopPropagation() {
    return this._onStopPropagation();
  }
}
