const Notification = require('../models/Notification');
const { emitUserNotification } = require('../config/socket');

class NotificationService {
  async createNotification({ owner, workflowId, executionId, type, title, message }) {
    const notification = await Notification.create({
      owner,
      workflowId: workflowId || null,
      executionId: executionId || null,
      type: type || 'info',
      title,
      message,
      isRead: false,
    });

    emitUserNotification(owner, notification);
    return notification;
  }

  async getUserNotifications(userId, options = { limit: 20 }) {
    return Notification.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(options.limit || 20);
  }

  async markAsRead(notificationId, userId) {
    return Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { owner: userId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = new NotificationService();
