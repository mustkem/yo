type Primitive = bigint | boolean | null | number | string | symbol | undefined

export interface PlainFlatObject {
  [key: string]: Primitive
}

export interface PlainObject {
  [key: string]: Primitive | PlainFlatObject | Record<string, unknown>
}
