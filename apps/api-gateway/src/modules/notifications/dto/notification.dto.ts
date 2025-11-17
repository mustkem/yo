import { IsEnum, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../notification.types';

/**
 * Response DTO for a single notification
 */
export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  @IsString()
  id: string;

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'User who triggered the notification' })
  actor: {
    id: string;
    username: string;
    avatar?: string;
  };

  @ApiProperty({ description: 'Related post (if applicable)', required: false })
  @IsOptional()
  post?: {
    id: string;
    text: string;
  };

  @ApiProperty({ description: 'Whether notification has been read' })
  @IsBoolean()
  read: boolean;

  @ApiProperty({ description: 'Timestamp when marked as read', required: false })
  @IsOptional()
  @IsNumber()
  readAt?: number;

  @ApiProperty({ description: 'Timestamp when notification was created' })
  @IsNumber()
  createdAt: number;
}

/**
 * Response DTO for paginated notifications
 */
export class NotificationsListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  notifications: NotificationResponseDto[];

  @ApiProperty({ description: 'Cursor for next page', required: false })
  @IsOptional()
  nextCursor?: string;

  @ApiProperty({ description: 'Total unread count' })
  @IsNumber()
  unreadCount: number;
}

/**
 * Query DTO for listing notifications
 */
export class GetNotificationsQueryDto {
  @ApiProperty({ description: 'Number of notifications to return', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ description: 'Filter for unread notifications only', required: false })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean = false;
}

/**
 * Response DTO for mark all as read
 */
export class MarkAllReadResponseDto {
  @ApiProperty({ description: 'Number of notifications marked as read' })
  @IsNumber()
  count: number;
}
