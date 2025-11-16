import { ApolloServerErrorCode } from '@apollo/server/errors';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { GraphQLError } from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import { Response } from 'node-fetch';
import { Static } from 'runtypes';

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

export class UserInputError extends ApolloError {
  constructor(message: string, properties?: Record<string, any>) {
    super(message, ApolloServerErrorCode.BAD_USER_INPUT, properties);
  }
}

export class ForbiddenError extends ApolloError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, 'FORBIDDEN', extensions);
  }
}

export class AuthenticationError extends ApolloError {
  constructor(message: string, extensions?: Record<string, any>) {
    super(message, 'UNAUTHENTICATED', extensions);
  }
}

export class QueryComplexityError extends ApolloError {
  constructor(data: { [key: string]: string | number }) {
    super(
      `Query is too complex: ${data.actual}. Maximum allowed complexity: ${data.max}`,
      GraphQLErrorType.QUERY_ERROR,
      data,
    );
  }
}
export class GenericBadRequestError extends ApolloError {
  constructor(message: string) {
    super(message, GraphQLErrorType.BAD_REQUEST);
  }
}

export class DatabaseError extends ApolloError {
  constructor(error: Error | string) {
    super(
      `Database Error: ${error instanceof Error ? error.message : error}`,
      GraphQLErrorType.DATABASE_ERROR,
      undefined,
      typeof error === 'string' ? new Error(error) : error,
    );
  }
}

export class GenericServerError extends ApolloError {
  constructor(message?: string) {
    super(
      message ?? `Unknown server error`,
      GraphQLErrorType.GENERIC_SERVER_ERROR,
    );
  }
}

export class PromoInvalidError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      `promo code has expired or is invalid server error`,
      GraphQLErrorType.GENERIC_SERVER_ERROR,
      data,
    );
  }
}

export class GraphqlRateLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(`Too many requests`, GraphQLErrorType.RATE_LIMIT_ERROR, data);
  }
}

export class PaginationError extends UserInputError {}

export class EntityExistsError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Entity already exists',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class InvalidInputError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('This operation is not allowed', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class InvalidTransactionError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('This transaction is invalid', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class InsufficientNftsError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Insufficient number of nfts to create collectibles',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class EntityOutOfStockError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Entity is out of stock',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class UsernameExistsError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Username is already in use', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class ProfaneTextError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Text provided is profane', GraphQLErrorType.BAD_USER_INPUT, data);
  }
}

export class FieldUndefinedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Requested Field is empty', GraphQLErrorType.BAD_USER_INPUT, data);
  }
}

export class EntityUpdateError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Entity not found', GraphQLErrorType.BAD_USER_INPUT, data);
  }
}

export class EntityNotDroppedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Entity has not dropped yet',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class WaitListHasNotOpenedForReservation extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'WaitList has not opened for reservation yet',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class WaitlistIsInReservationMode extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Waitlist is in reservation mode',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class RedisKeyNotFoundError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Redis key not found', GraphQLErrorType.INTERNAL_SERVER_ERROR, data);
  }
}

export class AuthorizationError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'You are not authorized to perform the following action with this user',
      GraphQLErrorType.FORBIDDEN,
      {
        status: HttpStatus.FORBIDDEN,
        response: {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Forbidden',
        },
        ...data,
      },
    );
  }
}

export class RouteRequires2faError extends ApolloError {
  constructor(data?: { message: string }) {
    super(
      '2FA needed to complete this action',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class RouteRequiresKycError extends ApolloError {
  constructor(data?: { message: string }) {
    super(
      'KYC needed to complete this action',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class FetchOmiRateError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Failed to fetch OMI conversion rate',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class UserCountryError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Failed to fetch user country',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class UserUnderAgeLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'User age is under the allowed age limit',
      GraphQLErrorType.BAD_USER_INPUT,
      data,
    );
  }
}

export class UserPurchaseLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'entity Type store purchase limit reached',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class NoPurchaseReservationError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Missing purchase reservation for this element',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ExpiredPurchaseReservationError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Invalid purchase reservation for this element',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class StorePurchaseReservationsNotAvailableError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'There are no available store purchase reservations for this element',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketPurchaseReservationsNotAvailableError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'There are no available market purchase reservations',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketPurchaseReservationLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Only allow one reservation at a time',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketListingHasBeenReservedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'The market listing has already been reserved',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class UnnecessaryPurchaseReservationError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'No need to place reservation of this element',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ElementNotVisibleInStoreError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Element must be visible in store to place reservation',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ElementNotPublicError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Element must be public to place reservation',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class NotAvailableInUserCountry extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Action is not allowed in user country',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class IncompatibleActionError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Action is not compatible with this entity type',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ForbiddenSubscriptionError extends ForbiddenError {
  constructor() {
    super('Forbidden subscription operation');
  }
}

export class S3MetadataError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'File metadata not found in S3 file',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class InsufficientFundsError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Insufficient funds', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class InvalidDestinationAmount extends ApolloError {
  constructor(amount: string | number) {
    super('Invalid destination amount', GraphQLErrorType.BAD_REQUEST, {
      amount,
    });
  }
}

export class UserNotRegisteredWithImmutableError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'User is not registered with Immutable X',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class ConversionLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Maximum daily conversion limit reached',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ConversionWeeklyLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Maximum weekly conversion limit reached',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class WeeklyGemPurchaseLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Account is temporarily limited to a maximum purchase of 500 gems per week.',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class TransferLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Maximum daily transfer limit reached',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class StoreElementNotAvailableError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Store element is not available', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class StoreElementHasSoldOut extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Store element has sold out', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class EntityTypeHasNotDropped extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Entity type has not dropped yet',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ReservationNotApplicableError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Reservation is not applicable', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class IncorrectPurchaseMethod extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Entity type cannot be purchased by this method',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class CollectibleEntityOwnershipError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Must own the collectible entity',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ComicEntityOwnershipError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Must own the comic entity', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class ShowroomEntityOwnershipError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Must own the showroom entity', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class InvalidShowroomOrderError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid showroom order', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class ShowroomBackgroundOwnershipError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Requesting user must own the showroom background entity',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class InvalidCustomizationCategoryTypeError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid showroom category type', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class PurchaseAuctionNotCompleteError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Auction must be finished before purchasing',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class AuctionHighBidError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Bid price must not be greater than 100 percentage of current highest bid price',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class AuctionBidderTooNewError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Buyers must have held their account for at least three days before bidding on an auction.',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class AuctionBidderOutbidsHimselfError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Buyers must not outbid themselves',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class AuctionLowBidError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Bid price must be greater than current highest bid price',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class BidOnOwnAuctionError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Sellers are not allowed to bid on their own auctions',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class IncompatibleMarketListingError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Incompatible market listing type',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class InvalidMarketListingElementError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid market listing element', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class AuctionBidderPurchaseError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Must be winning bidder to purchase an auction',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketListingClosedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Market listing must be open to perform this action',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketListingDisabledError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Market listing updates are currently disabled',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketListingEntityOwnershipError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Must own the sellable entity to list it on the market',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketNotSupportedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Requested market is not supported',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ElementTypeNotSupportedByMarket extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Element type cannot be sold in the requested market',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ListingTypeNotSupportedByMarket extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Requested listing type is not supported by the market',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class CurrencyNotSupportedByMarket extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Requested currency is not supported by the market',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketPurchaseEntityOwnershipError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Market listing seller is no more the owner of this entity',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketListingOwnershipError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Must be the seller to modify an existing market listing',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ElementAlreadyListedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'An element can only have one open market listing',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketListingCooldownError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      `Can only be listed after cooldown`,
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ExternalMarketListingRemoveError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      `There was an error removing the element.`,
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class MarketListingTransactionNotFoundError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      `No market listing has been found for related transactionId.`,
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class UpdateTransactionWithConversionRateError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      `The transaction doesn't meet the requirements to be updated with a conversion rate.`,
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class ElementLockedForTransfers extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'A listing can not be created if the element is locked for transfers',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class AuctionHasBidsError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'An auction can not be modified once it has bids',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class PurchaseNoBidsError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'An auction must have bids to be purchased',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class PurchaseOwnListingError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'A user can not purchase their own market listing',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class SearchTimeoutError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Search timedout while trying to connect',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class MasterCollectorServiceTimeoutError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Master Collector Service timedout while trying to connect',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class UnknownSearchError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Search failed for an unknown reason',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class InvalidFeeError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Fees are invalid', GraphQLErrorType.INTERNAL_SERVER_ERROR, data);
  }
}

export class DatabaseMaxRetriesError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Exceeded the maximum number of retries',
      GraphQLErrorType.DATABASE_ERROR,
      data,
    );
  }
}

export class FilterConflictError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Incompatible filter options',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class MissingInAppProductError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Missing In App Purchase Product',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class InvalidStorePurchaseEntityError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Invalid store purchase entity',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class RpcResponseError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly extensions?: Record<string, any>,
  ) {
    super(message);
  }
}

export class PendingInAppPurchaseTransactionError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'There is pending transaction of this account',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class OmiTransferError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Omi transfer fails', GraphQLErrorType.INTERNAL_SERVER_ERROR, data);
  }
}

export class BlockedIpAddressError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Ip address has been locked', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class EntityTransferHasMarketListingError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Entities with open market listings can not be transferred',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class IotConfigNotFoundError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Iot config not found', GraphQLErrorType.INTERNAL_SERVER_ERROR, data);
  }
}

export class InvalidSubscriptionEntityError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Invalid subscription entity',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class UserPublicKeyNotFoundError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'user public key not found',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class InvalidPushNotificationEvent extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Invalid push notification event',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class InvalidCampaignConfig extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Invalid campaign event',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class InvalidDroppableType extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Invalid droppable type for campaign',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class UploadAvatarError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Uploading avatar failed with an error',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class MissingConfirmationCodeError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Missing confirmation code',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class MissingSenderIdError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Missing sender id', GraphQLErrorType.INTERNAL_SERVER_ERROR, data);
  }
}

export class MissingTransactionError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Missing transaction entity',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class MissingReceiverIdError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Missing receiver id', GraphQLErrorType.INTERNAL_SERVER_ERROR, data);
  }
}

export class InvalidVendorError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Should pass the KYC process', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class CustomerNotFoundError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Should create customer before purchasing gem',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class UserShareLimitError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Too many shares', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class KycTokenGenerationError extends ApolloError {
  constructor(message: string) {
    super(message, GraphQLErrorType.INTERNAL_SERVER_ERROR);
  }
}

export class UnhandledAppStoreNotification extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'There is no handler of AppStore IPN event',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class PaymentGatewayError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Response error from payment gateway',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class InvalidCryptoPayinCountryError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Cryptocurrency pay-in is not enabled for this country',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class InvalidCryptoPayinStatusError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Cryptocurrency pay-in is not in created status',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class InvalidPaymentTypeError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Requesting operation is not allow for the payment',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class PendingCryptoPayinRequestError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'You already have a pending transaction. Please complete it or wait for 10 minutes to create another.',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class InvalidCryptoPayinStateError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Cryptocurrency pay-in is not enabled for this state',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class InvalidCaptchaGraphqlError extends UserInputError {
  constructor() {
    super('Invalid captcha response');
  }
}

export class FeatureFlagDisabledError extends ApolloError {
  constructor(flagName: string) {
    super(
      `${flagName} is currently disabled`,
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      {
        featureFlagName: flagName,
      },
    );
  }
}

export class InvalidClientError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid client', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class AuctionNotEndedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Auction has not ended yet', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class AuctionWinnerNotDecidedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Auction winner not decided yet',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
      data,
    );
  }
}

export class AuctionClosedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Auction has been closed', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class InvalidAuctionTypeError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid auction type', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class InvalidUserError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid user', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class UserNotFoundError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('User does not exist', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class NotValidAddressError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'The provided address is not a valid Ethereum address',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class AccountMergeAlreadyConfirmedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      `Account merge process to the nominated account is already confirmed`,
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class AccountMergeAlreadyExistsError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      'Account merge request is already in progress for your account.',
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class AccountMergeCancellationError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(`Account merge can not cancel`, GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class AccountMergeInvalidError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super(
      `Account merge process is only for non-KYC account`,
      GraphQLErrorType.BAD_REQUEST,
      data,
    );
  }
}

export class FeedAccessBlockedError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Feed access blocked', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class AssetTransferToSelfError extends ApolloError {
  constructor() {
    super(
      'Transfers from/to same user are not allowed',
      GraphQLErrorType.INTERNAL_SERVER_ERROR,
    );
  }
}

export class CraftValidationError extends ApolloError {
  constructor(message: string) {
    super(message, GraphQLErrorType.BAD_REQUEST);
  }
}

export class RewardRuleValidationError extends ApolloError {
  constructor(message: string) {
    super(message, GraphQLErrorType.BAD_REQUEST);
  }
}

export class SeriesFullSetError extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Must have a series full set', GraphQLErrorType.BAD_REQUEST, data);
  }
}

// Http exception
export class FeatureFlagDisabledHttpError extends HttpException {
  constructor(flagName: string) {
    super(
      HttpException.createBody(
        `${flagName} is currently disabled`,
        `${flagName} is currently disabled`,
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}
export class EmptyCsrfToken extends HttpException {
  constructor(
    objectOrError?: any,
    description = 'CSRF token should not be empty',
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidCsrfToken extends HttpException {
  constructor(objectOrError?: any, description = 'Invalid CSRF token') {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class RateLimitException extends HttpException {
  constructor(objectOrError?: any, description = 'Too many request attempts') {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.TOO_MANY_REQUESTS,
      ),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class UserIsInactiveException extends HttpException {
  constructor(objectOrError?: any, description = 'User is inactive') {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.UNAUTHORIZED,
      ),
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class UserUndefinedHttpException extends HttpException {
  constructor(objectOrError?: any, description = 'User is undefined') {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.UNAUTHORIZED,
      ),
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class UserUndefinedGraphQLException extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('User is undefined', 'UNAUTHENTICATED', data);
  }
}

export class InvalidSessionHttpException extends HttpException {
  constructor(objectOrError?: any, description = 'Invalid session') {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.UNAUTHORIZED,
      ),
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidSessionGraphQLException extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid session', 'UNAUTHENTICATED', data);
  }
}

export class HttpRouteRequires2faError extends HttpException {
  constructor(
    objectOrError?: any,
    description = '2FA needed to complete this action',
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.UNAUTHORIZED,
      ),
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidTokenIdError extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'Invalid token id',
        'Invalid token id',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidAuthVersionHttpError extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'Invalid auth version',
        'Invalid or missing x-auth-version header',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidAuthVersionGraphQLException extends ApolloError {
  constructor(data?: { [key: string]: string | number }) {
    super('Invalid auth version', GraphQLErrorType.BAD_REQUEST, data);
  }
}

export class InvalidAssetTypeError extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'Invalid asset type',
        'Invalid asset type',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MissingRequiredAssetMetadataError extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'Asset is missing relevant data to assemble metadata',
        'Asset is missing relevant data to assemble metadata',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class HttpRouteRequiresKycError extends HttpException {
  constructor(
    objectOrError?: any,
    description = 'KYC needed to complete this action',
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.UNAUTHORIZED,
      ),
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ResoureNotFoundHttpError extends HttpException {
  constructor(objectOrError?: any, description = 'Resource not found') {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.NOT_FOUND,
      ),
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidPayoutStatusHttpError extends HttpException {
  constructor(
    objectOrError?: any,
    description = 'Invalid payout status for the operation',
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class HttpInvalidUserError extends HttpException {
  constructor(
    objectOrError?: any,
    description = 'Invalid user for this operation',
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.UNAUTHORIZED,
      ),
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class InvalidCaptchaHttpError extends HttpException {
  constructor() {
    super(
      HttpException.createBody(
        'Invalid captcha response',
        'Invalid captcha response',
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidCheckoutWebhookError extends HttpException {
  constructor(message: string) {
    super(
      HttpException.createBody(
        'Invalid Checkout webhook',
        message,
        HttpStatus.BAD_REQUEST,
      ),
      HttpStatus.BAD_REQUEST,
    );
  }
}

// Error
export class InvalidAppStoreSignedPayload extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BlockchainTransactionError extends Error {
  public readonly originalError?: Error;
  public readonly transactionHash?: string;
  constructor(message: string, error?: Error, transactionHash?: string) {
    super(`Blockchain Error: ${message}`);
    this.originalError = error;
    this.transactionHash = transactionHash;
  }
}

export class BlockchainRevertedByEvm extends BlockchainTransactionError {
  constructor(error: Error, transactionHash?: string) {
    super(
      `Nonretryable: ${error.message}, Hash: ${transactionHash}`,
      error,
      transactionHash,
    );
  }
}
export class MaxLoginAttemptsExceededError extends Error {
  constructor() {
    super('Maximum user login attempts exceeded');
  }
}

export class IncorrectOldPasswordHttpError extends HttpException {
  constructor(objectOrError?: any) {
    super(
      HttpException.createBody(objectOrError, `Incorrect old password`, 400),
      400,
    );
  }
}

export class IncorrectOldPasswordError extends ApolloError {
  constructor() {
    super(`Incorrect old password`, GraphQLErrorType.BAD_REQUEST);
  }
}

export class MissingOldPasswordHttpError extends HttpException {
  constructor(objectOrError?: any) {
    super(
      HttpException.createBody(
        objectOrError,
        `Old password must be provided if one has been set`,
        400,
      ),
      400,
    );
  }
}

export class MissingOldPasswordError extends ApolloError {
  constructor() {
    super(
      `Old password must be provided if one has been set`,
      GraphQLErrorType.BAD_REQUEST,
    );
  }
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Token Expired');
  }
}

export class CheckoutWebhookError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class PayoutProfileNotApprovedError extends Error {
  constructor() {
    super(`user payout profile is not approved`);
  }
}
export class PaymentProfileNotApprovedError extends Error {
  constructor() {
    super(`user payment profile is not approved`);
  }
}

export class PayoutMethodExistsError extends Error {
  constructor() {
    super(`user payout method already exists`);
  }
}

export class PayoutTransactionAlreadyConfirmed extends Error {
  constructor() {
    super(`payout transaction is already confirmed`);
  }
}

export class PayoutMethodDisabledError extends Error {
  constructor() {
    super(`This payout method is disabled`);
  }
}
export class PaymentMethodDisabledError extends Error {
  constructor() {
    super(`This payment method is disabled`);
  }
}

export class PaymentMethodInvalidError extends Error {
  constructor() {
    super(`This payment method is invalid`);
  }
}

export class LockNotAcquiredError extends Error {
  constructor() {
    super(`Lock not acquired`);
  }
}

export class PayoutAuthorizationError extends Error {
  constructor() {
    super(`Requesting user is not authorized to perform this operation`);
  }
}
export class PayinAuthorizationError extends Error {
  constructor() {
    super(`Requesting user is not authorized to perform this operation`);
  }
}
export class PaymentAuthorizationError extends Error {
  constructor() {
    super(`Requesting user is not authorized to perform this operation`);
  }
}

export class PayoutRegionUnSupportedError extends Error {
  constructor() {
    super(`Payout is disable to the user region`);
  }
}

export class CryptoPayinNotificationError extends Error {
  constructor() {
    super(`Notification data not found`);
  }
}

export class SearchRequestError extends Error {
  constructor() {
    super('Unable to fetch search results');
  }
}

export class DynamodbRequestError extends Error {
  constructor() {
    super('Unable to fetch dynamodb results');
  }
}

export class DynamodbItemNotFoundError extends Error {
  constructor() {
    super('Item does not exist');
  }
}

export class DateNotInRangeError extends Error {
  constructor(message?: string) {
    super(message || 'Incorrect date');
  }
}

export class RabbitMQMessageValidationError extends Error {
  constraints: { [type: string]: string }[];

  constructor(validationErrors: ValidationError[]) {
    super('RabbitMQ message validation error');
    this.constraints = validationErrors
      .map((e) => e.constraints)
      .filter((c): c is { [type: string]: string } => c !== undefined);
  }
}

export class AccountDeletionNotAllowedError extends Error {
  constructor() {
    super('Account deletion not allowed');
  }
}

export class CryptoPayinTransactionNotFoundError extends Error {
  constructor() {
    super('Crypto pay-in transaction not found');
  }
}

export class CryptoPayinDuplicateWebhookError extends Error {
  constructor() {
    super('Already processed crypto pay-in webhook');
  }
}

export class InvalidTransactionTypeError extends Error {
  constructor(type: string) {
    super(`Invalid transaction type for this operaion: ${type}`);
  }
}

export class IapOmiTransferProcessorError extends Error {
  public readonly originalError: Error;
  public readonly transactionId?: string;
  constructor(error: Error, transactionId?: string) {
    super(`In app purchase omi transfer from reserve error: ${error.message}`);
    this.originalError = error;
    this.transactionId = transactionId;
  }
}

export class TransactionAlreadyProcessedError extends Error {
  constructor(transactionId: string) {
    super(`This transaction has already been processed ${transactionId}`);
  }
}

export class BannedCountryHttpError extends HttpException {
  constructor(objectOrError?: any) {
    super(
      HttpException.createBody(
        objectOrError,
        `We apologize for the inconvenience, but we are unable to accept sign-ups from your country`,
        451, // unavailable for legal reasons
      ),
      451, // unavailable for legal reasons
    );
  }
}

export class BannedCountryError extends ApolloError {
  constructor() {
    super(
      `We apologize for the inconvenience, but we are unable to accept sign-ups from your country`,
      GraphQLErrorType.BAD_REQUEST,
    );
  }
}

export class BannedCountryForPublisher extends ApolloError {
  constructor() {
    super(
      `Item restricted for country by publisher`,
      GraphQLErrorType.BAD_REQUEST,
    );
  }
}
export class PromoReservationInvalidError extends ApolloError {
  constructor() {
    super(
      'Existing reservation expired, please try again',
      GraphQLErrorType.GENERIC_SERVER_ERROR,
    );
  }
}

export class PromoReservationError extends ApolloError {
  constructor(message: string) {
    super(message, GraphQLErrorType.GENERIC_SERVER_ERROR);
  }
}

export class PromoNotAvailableError extends ApolloError {
  constructor() {
    super(
      'No promo code available to be redeemed',
      GraphQLErrorType.GENERIC_SERVER_ERROR,
    );
  }
}

export class PromotionUnavailableError extends ApolloError {
  constructor(message: string) {
    super(
      'Promotion unavailable for the user',
      GraphQLErrorType.GENERIC_SERVER_ERROR,
      { message },
    );
  }
}

export class UserVisibleRpcGraphqlError extends ApolloError {
  constructor(message: string) {
    super(message, GraphQLErrorType.GENERIC_SERVER_ERROR, {
      showToUser: true,
    });
  }
}

// https://github.com/node-fetch/node-fetch#handling-client-and-server-errors
export class HTTPResponseError extends ApolloError {
  constructor(response: Response) {
    super(`Error fetching data: ${response.statusText}`, `${response.status}`);
  }
}

export class NotFoundError extends Error {
  constructor(message = 'NotFoundError') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'NotFoundError';
  }
}
