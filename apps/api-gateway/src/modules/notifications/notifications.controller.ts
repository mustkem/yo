import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  NotificationResponseDto,
  NotificationsListResponseDto,
  GetNotificationsQueryDto,
  MarkAllReadResponseDto,
} from './dto/notification.dto';

/**
 * Notifications Controller
 *
 * REST API endpoints for managing user notifications
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Get notifications for the authenticated user
   */
  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated notifications',
    type: NotificationsListResponseDto,
  })
  async getNotifications(
    @Request() req: any,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<NotificationsListResponseDto> {
    const userId = req.user.id; // From authentication guard

    const result = await this.notificationsService.getUserNotifications(userId, {
      limit: query.limit,
      cursor: query.cursor,
      unreadOnly: query.unreadOnly,
    });

    return {
      notifications: result.notifications,
      nextCursor: result.nextCursor,
      unreadCount: result.unreadCount,
    };
  }

  /**
   * GET /notifications/unread-count
   * Get unread notification count
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Returns unread notification count',
    schema: {
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async getUnreadCount(@Request() req: any): Promise<{ count: number }> {
    const userId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * POST /notifications/:id/read
   * Mark a notification as read
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Request() req: any,
    @Param('id') notificationId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.notificationsService.markAsRead(userId, notificationId);
  }

  /**
   * POST /notifications/read-all
   * Mark all notifications as read
   */
  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    type: MarkAllReadResponseDto,
  })
  async markAllAsRead(@Request() req: any): Promise<MarkAllReadResponseDto> {
    const userId = req.user.id;
    const count = await this.notificationsService.markAllAsRead(userId);
    return { count };
  }

  /**
   * DELETE /notifications/:id
   * Delete a notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @Request() req: any,
    @Param('id') notificationId: string,
  ): Promise<void> {
    const userId = req.user.id;
    await this.notificationsService.deleteNotification(userId, notificationId);
  }
}
