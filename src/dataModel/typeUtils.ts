export type EqualKeys<T, S, F extends keyof T | void = void> = F extends void
  ? { [K in keyof T]: EqualKeys<T, S, K> } extends { [x: string]: true }
    ? true
    : false
  : F extends keyof S
    ? true
    : false;

export type EqualFieldTypes<
  T,
  S,
  F extends keyof T | void = void,
> = F extends void
  ? { [K in keyof T]: EqualFieldTypes<T, S, K> } extends { [x: string]: true }
    ? true
    : false
  : F extends keyof S
    ? F extends keyof T
      ? S[F] extends T[F]
        ? true
        : false
      : false
    : false;
