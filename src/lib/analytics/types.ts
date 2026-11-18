import type { EVENT_REGISTRY } from './registry';

export type ParamPrimitiveType = 'string' | 'number' | 'boolean';
export type ParamType = ParamPrimitiveType | 'object' | 'object[]';

export interface ParamDescriptor {
  readonly type: ParamType;
  readonly required: boolean;
  readonly nullable: boolean;
  readonly params?: Readonly<Record<string, ParamDescriptor>>;
}

export type EventName = keyof typeof EVENT_REGISTRY;

type ValueOf<D> = D extends { readonly type: 'string' }
  ? string
  : D extends { readonly type: 'number' }
  ? number
  : D extends { readonly type: 'boolean' }
  ? boolean
  : D extends { readonly type: 'object'; readonly params: infer P }
  ? PayloadFromParams<P>
  : D extends { readonly type: 'object[]'; readonly params: infer P }
  ? PayloadFromParams<P>[]
  : never;

type FieldType<D> = D extends { readonly nullable: true } ? ValueOf<D> | null : ValueOf<D>;

export type PayloadFromParams<P> = {
  [K in keyof P as P[K] extends { readonly required: true } ? K : never]: FieldType<P[K]>;
} & {
  [K in keyof P as P[K] extends { readonly required: true } ? never : K]?: FieldType<P[K]>;
};

type EventParams<E extends EventName> = (typeof EVENT_REGISTRY)[E]['params'];

export type PayloadOf<E extends EventName> = PayloadFromParams<EventParams<E>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- checks for an all-optional payload
type EmptyPayload = {};

export type NoPayloadEventName = {
  [K in EventName]: EmptyPayload extends PayloadOf<K> ? K : never;
}[EventName];

type ExactDeep<P, Target> = P extends readonly (infer PItem)[]
  ? Target extends readonly (infer TItem)[]
    ? ExactDeep<PItem, TItem>[]
    : never
  : P extends object
  ? Target extends object
    ? { [K in keyof P]: K extends keyof Target ? ExactDeep<P[K], Target[K]> : never }
    : P
  : P;

export type Exact<P, Target> = P & ExactDeep<P, Target>;
