import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BulkEmailRequest,
  BulkEmailResponse,
  BulkEmailResult,
  BulkRecipient,
} from './types';
import { AwsService } from '@apps/api-gateway/src/modules/aws/aws.service';

@Injectable()
export class EmailService {
  private readonly sesChunkSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsService: AwsService,
  ) {
    const emailConfig = this.configService.get('email');

    this.sesChunkSize = emailConfig.marketing.sesChunkSize;
  }

  /**
   * Send bulk templated emails using AWS SES SendBulkTemplatedEmail
   * Automatically chunks recipients into groups of 50 (AWS SES limit)
   */
  async sendBulkTemplatedEmail(
    request: BulkEmailRequest,
  ): Promise<BulkEmailResponse> {
    const response: BulkEmailResponse = {
      successful: [],
      failed: [],
    };

    // Chunk recipients into groups of sesChunkSize (max 50 for AWS SES)
    const chunks = this.chunkArray(request.recipients, this.sesChunkSize);

    for (const [chunkIndex, chunk] of chunks.entries()) {
      try {
        const chunkResult = await this.sendBulkChunk(request, chunk);
        response.successful.push(...chunkResult.successful);
        response.failed.push(...chunkResult.failed);
      } catch (error) {
        // Mark all recipients in failed chunk as failed
        const failedResults: BulkEmailResult[] = chunk.map((recipient) => ({
          email: recipient.email,
          error: {
            code: 'CHUNK_SEND_FAILED',
            message: (error as Error).message,
          },
        }));

        response.failed.push(...failedResults);
      }
    }

    return response;
  }

  /**
   * Send a single chunk of recipients (up to 50) using AWS SES SendBulkTemplatedEmail
   */
  private async sendBulkChunk(
    request: BulkEmailRequest,
    recipients: BulkRecipient[],
  ): Promise<BulkEmailResponse> {
    const destinations = recipients.map((recipient) => ({
      Destination: {
        ToAddresses: [recipient.email],
      },
      ReplacementTemplateData: JSON.stringify(recipient.templateData),
    }));

    const params = {
      Source: request.fromEmail,
      Template: request.templateId,
      DefaultTemplateData: JSON.stringify(request.defaultTemplateData),
      Destinations: destinations,
    };

    try {
      const result =
        await this.awsService.SES.sendBulkTemplatedEmail(params).promise();

      const response: BulkEmailResponse = {
        successful: [],
        failed: [],
      };

      // Process individual statuses
      result.Status?.forEach((status, index) => {
        const recipient = recipients[index];
        if (!recipient) return;

        if (status.Status === 'Success' && status.MessageId) {
          response.successful.push({
            email: recipient.email,
            messageId: status.MessageId,
          });
        } else {
          response.failed.push({
            email: recipient.email,
            error: {
              code: status.Status || 'UNKNOWN_ERROR',
              message: status.Error || 'Unknown error occurred',
            },
          });
        }
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a single templated email using AWS SES SendTemplatedEmail
   */
  async sendTemplatedEmail({
    fromEmail,
    toEmail,
    templateId,
    templateData,
  }: {
    fromEmail: string;
    toEmail: string;
    templateId: string;
    templateData: Record<string, any>;
  }): Promise<{ messageId?: string }> {
    const params = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [toEmail],
      },
      Template: templateId,
      TemplateData: JSON.stringify(templateData),
    };

    const result = await this.awsService.SES.sendTemplatedEmail(params).promise();
    return { messageId: result.MessageId };
  }

  /**
   * Split array into chunks of specified size
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
