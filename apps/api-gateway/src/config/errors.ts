import { GraphQLError } from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';

enum GraphQLErrorType {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  QUERY_ERROR = 'QUERY_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  GENERIC_SERVER_ERROR = 'GENERIC_SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  BAD_USER_INPUT = 'BAD_USER_INPUT',
}

export class ApolloError extends GraphQLError {
  constructor(
    message: string,
    code?: string,
    extensions?: Record<string, any>,
    originalError?: Maybe<Error>,
  ) {
    super(message, {
      originalError,
      extensions: {
        code,
        ...extensions,
      },
    });
    // Object.defineProperty(this, 'name', { value: 'ApolloError' })
  }
}

export class EntityNotFoundError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Entity not found', GraphQLErrorType.INTERNAL_SERVER_ERROR, data);
  }
}
