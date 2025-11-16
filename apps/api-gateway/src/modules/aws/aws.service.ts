import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { env } from '../../config/env';
import { aws } from '../../config/aws';

@Injectable()
export class AwsService {
  public CognitoIdentity: AWS.CognitoIdentity;
  public dynamodb: AWS.DynamoDB;
  public Lambda: AWS.Lambda;
  public Pinpoint: AWS.Pinpoint;
  public S3: AWS.S3;
  public SecretsManager: AWS.SecretsManager;
  public SES: AWS.SES;
  public StepFunctions: AWS.StepFunctions;
  public SQS: AWS.SQS;

  constructor() {
    // Global region configuration
    AWS.config.update({ region: aws.region });

    // ---- DynamoDB ----
    if (env.isLocal && aws.dynamodb?.endpoint) {
      this.dynamodb = new AWS.DynamoDB({
        region: aws.region,
        endpoint: aws.dynamodb.endpoint,
      });
    } else {
      this.dynamodb = new AWS.DynamoDB({ region: aws.region });
    }

    // ---- S3 ----
    if (env.isLocal && aws.s3?.endpoint) {
      this.S3 = new AWS.S3({
        region: aws.region,
        endpoint: aws.s3.endpoint,
        s3ForcePathStyle: true,
        credentials:
          aws.s3.accessKeyId && aws.s3.secretAccessKey
            ? {
                accessKeyId: aws.s3.accessKeyId,
                secretAccessKey: aws.s3.secretAccessKey,
              }
            : undefined,
      });
    } else {
      this.S3 = new AWS.S3({ region: aws.region });
    }

    // ---- Other AWS services ----
    this.CognitoIdentity = new AWS.CognitoIdentity();
    this.Lambda = new AWS.Lambda();
    this.Pinpoint = new AWS.Pinpoint();
    this.SES = new AWS.SES({ region: aws.region });
    this.SecretsManager = new AWS.SecretsManager({ region: aws.region });
    this.StepFunctions = new AWS.StepFunctions();
    this.SQS = new AWS.SQS({ apiVersion: '2024-12-25', region: aws.region });
  }

  public async getSecret(secretId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.SecretsManager.getSecretValue(
        { SecretId: secretId },
        (error, data) => {
          if (error) {
            reject(`Error while fetching private key ${error}`);
          } else if (!data?.SecretString) {
            reject('No secret string');
          } else {
            resolve(data.SecretString);
          }
        },
      );
    });
  }
}
