import { Injectable } from '@nestjs/common';
import { AWSError, DynamoDB } from 'aws-sdk';
import {
  AttributeMap,
  GetItemInput,
  QueryInput,
  ScanInput,
} from 'aws-sdk/clients/dynamodb';
import { PromiseResult } from 'aws-sdk/lib/request';
import _ from 'lodash';
import { AwsService } from './aws.service';
import { DynamodbRequestError, EntityNotFoundError } from '../../config/errors';

@Injectable()
export class DynamoDBService {
  public readonly sdk: DynamoDB;
  constructor(private readonly awsService: AwsService) {
    this.sdk = awsService.dynamodb as DynamoDB;
  }

  public async scanAll(
    scanInput: Omit<DynamoDB.ScanInput, 'ExclusiveStartKey' | 'Limit'>,
  ): Promise<DynamoDB.ItemList> {
    const records: DynamoDB.AttributeMap[] = [];
    let lastEvaluatedKey: DynamoDB.Key | undefined;
    do {
      const { Items, LastEvaluatedKey } = await this.awsService.dynamodb
        .scan({ ...scanInput, ExclusiveStartKey: lastEvaluatedKey })
        .promise();

      if (Items?.length) {
        records.push(...Items);
      }

      lastEvaluatedKey = LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return records;
  }

  /**
   * Wrapper around dynamodb.batchGetItem to simplify getting multiple items from a single table
   * - handles 100 items limit
   * - handles 16MB limit
   * @see https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html
   * @param tableName
   * @param keys
   * @returns
   */
  public async batchGetItem<T>(
    tableName: string,
    keys: Record<string, unknown>[],
  ): Promise<T[]> {
    const batchSize = 100;
    const result: T[] = [];

    // get in batches of 100
    for (const batchKeys of _.chunk(keys, batchSize)) {
      let requestKeys = batchKeys.map((key) =>
        DynamoDB.Converter.marshall(key),
      );

      // while there are more keys to get (16M limit or throttling)
      while (requestKeys.length) {
        // process until there is no more keys to process
        const batchResult = await this.awsService.dynamodb
          .batchGetItem({
            RequestItems: {
              [tableName]: {
                Keys: requestKeys,
              },
            },
          })
          .promise();

        if (!batchResult.Responses || !batchResult.UnprocessedKeys) {
          throw new Error('Unexpected batchGetItem result');
        }

        const items = batchResult.Responses[tableName] ?? [];
        result.push(
          ...items.map(
            (item: AttributeMap) => DynamoDB.Converter.unmarshall(item) as T,
          ),
        );

        // use `UnprocessedKeys` as next batch
        requestKeys = batchResult.UnprocessedKeys[tableName]?.Keys ?? [];
        // TODO: in case of throttling, it is not smart to execute next request right away
      }
    }

    return result;
  }

  public async batchWriteItem<T extends { [key: string]: any }>(
    tableName: string,
    items: T[],
  ): Promise<PromiseResult<DynamoDB.BatchWriteItemOutput, AWSError>[]> {
    const batchSize = 25;
    const result: PromiseResult<DynamoDB.BatchWriteItemOutput, AWSError>[] = [];

    for (const batchItems of _.chunk(items, batchSize)) {
      const batchResult = await this.awsService.dynamodb
        .batchWriteItem({
          RequestItems: {
            [tableName]: batchItems.map((item) => ({
              PutRequest: {
                Item: DynamoDB.Converter.marshall(item),
              },
            })),
          },
        })
        .promise();

      result.push(batchResult);
    }

    return result;
  }

  public async getOne<T>(input: GetItemInput): Promise<T | undefined> {
    const { Item } = await this.awsService.dynamodb.getItem(input).promise();
    if (!Item) {
      return undefined;
    }
    return DynamoDB.Converter.unmarshall(Item) as T;
  }

  public async getOneOrFail<T>(input: GetItemInput): Promise<T> {
    const data = await this.getOne<T>(input);
    if (!data) {
      throw new EntityNotFoundError({
        table: input.TableName,
        key: JSON.stringify(input.Key),
      });
    }
    return data;
  }

  public async queryAndCount<T>(
    input: QueryInput,
  ): Promise<{ count: number; items: T[] | null }> {
    const { Items, Count } = await this.awsService.dynamodb
      .query(input)
      .promise();
    if (Count === undefined) {
      throw new DynamodbRequestError();
    }
    if (Count === 0) {
      return { count: 0, items: null };
    }
    const items =
      Items?.map((i) => DynamoDB.Converter.unmarshall(i) as T) ?? [];
    return { count: Count, items };
  }

  /**
   *
   * @param input
   * @returns Null when no items are found, else list of items
   */
  public async query<T>(input: QueryInput): Promise<T[] | null> {
    const { count, items } = await this.queryAndCount<T>(input);
    if (count === 0) {
      return null;
    }
    return items;
  }

  public async scanAndCount<T>(
    input: ScanInput,
  ): Promise<{ count: number; items: T[] | null }> {
    const { Items, Count } = await this.awsService.dynamodb
      .scan(input)
      .promise();
    if (Count === undefined) {
      throw new DynamodbRequestError();
    }
    if (Count === 0) {
      return { count: 0, items: null };
    }
    const items =
      Items?.map((i) => DynamoDB.Converter.unmarshall(i) as T) ?? [];
    return { count: Count, items };
  }

  /**
   *
   * @param input
   * @returns Null when no items are found, else list of items
   */
  public async scan<T>(input: ScanInput): Promise<T[] | null> {
    const { count, items } = await this.scanAndCount<T>(input);
    if (count === 0) {
      return null;
    }
    return items;
  }

  /**
   * Add `listValues` elements into existing `tableName.listName` list attribute.
   * If missing, both `key` item and `listName` attribute are created
   * @param tableName
   * @param key
   * @param listName name of the list attribute
   * @param listValues items to add to list attribute
   * @returns
   */
  public async appendListAttribute<T>(
    tableName: string,
    key: Record<string, unknown>,
    listName: string,
    listValues: T[],
  ): Promise<DynamoDB.UpdateItemOutput> {
    const updateInput = {
      TableName: tableName,
      Key: DynamoDB.Converter.marshall(key),
      UpdateExpression: `SET #l = list_append(if_not_exists(#l, :emptyList), :listValue)`,
      ExpressionAttributeNames: { '#l': listName },
      ExpressionAttributeValues: DynamoDB.Converter.marshall({
        ':listValue': listValues,
        ':emptyList': [],
      }),
      ReturnValues: 'UPDATED_NEW',
    } as AWS.DynamoDB.UpdateItemInput;

    const result = await this.awsService.dynamodb
      .updateItem(updateInput)
      .promise();

    return result;
  }
}
