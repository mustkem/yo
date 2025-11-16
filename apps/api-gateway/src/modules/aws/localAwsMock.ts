import { PromiseResult } from 'aws-sdk/lib/request'

// Based on https://github.com/golevelup/nestjs/blob/master/packages/testing/src/mocks.ts
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>
}

/**
 * @name mockAwsMethod
 * @param mockOutput The default mocked return value. This value must be provided if any code relies on the return value.
 * @summary This mock only works with AWS methods which return a AWS.Request which has a promise method.
 */
export const mockAwsMethod =
  <Input, Output, Error>(
    mockOutput: DeepPartial<PromiseResult<Output, Error>> = {}
  ) =>
  (input: Input) => ({
    promise: () => Promise.resolve(mockOutput as PromiseResult<Output, Error>),
  })

/**
 * @name mockAwsMethodWithState
 * @param mockOutput The default mocked return value. This value must be provided if any code relies on the return value.
 * @summary This mock only works with AWS methods which require string param return a AWS.Request which has a promise method.
 */
export const mockAwsMethodWithState =
  <StringInput, Input, Output, Error>(
    mockOutput: DeepPartial<PromiseResult<Output, Error>> = {}
  ) =>
  (state: StringInput, input: Input) => ({
    promise: () => Promise.resolve(mockOutput as PromiseResult<Output, Error>),
  })
