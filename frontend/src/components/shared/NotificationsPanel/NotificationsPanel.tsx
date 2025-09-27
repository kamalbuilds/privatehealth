import React, { useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Notifications,
  NotificationsNone,
  Circle,
  CheckCircle,
  Warning,
  Error,
  Info,
  Delete,
  MarkEmailRead,
  ClearAll,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '@/store/slices/notificationSlice';
import { showSnackbar } from '@/store/slices/uiSlice';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 400;

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading, error } = useAppSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    if (open && notifications.length === 0) {
      dispatch(fetchNotifications());
    }
  }, [open, dispatch, notifications.length]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await dispatch(markAsRead(id)).unwrap();
    } catch (error: any) {
      dispatch(showSnackbar({
        message: 'Failed to mark notification as read',
        severity: 'error',
      }));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      dispatch(showSnackbar({
        message: 'All notifications marked as read',
        severity: 'success',
      }));
    } catch (error: any) {
      dispatch(showSnackbar({
        message: 'Failed to mark all notifications as read',
        severity: 'error',
      }));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await dispatch(deleteNotification(id)).unwrap();
      dispatch(showSnackbar({
        message: 'Notification deleted',
        severity: 'success',
      }));
    } catch (error: any) {
      dispatch(showSnackbar({
        message: 'Failed to delete notification',
        severity: 'error',
      }));
    }
  };

  const handleClearAll = async () => {
    try {
      await dispatch(clearAllNotifications()).unwrap();
      dispatch(showSnackbar({
        message: 'All notifications cleared',
        severity: 'success',
      }));
    } catch (error: any) {
      dispatch(showSnackbar({
        message: 'Failed to clear notifications',
        severity: 'error',
      }));
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <Error color="error" />;
      case 'info':
      default:
        return <Info color="info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          maxWidth: '100vw',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
            <Typography variant="h6">
              Notifications
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkEmailRead />}
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                >
                  Mark All Read
                </Button>
              )}
              <Button
                size="small"
                startIcon={<ClearAll />}
                onClick={handleClearAll}
                color="error"
                variant="outlined"
                disabled={isLoading}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading && notifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                textAlign: 'center',
                p: 2,
              }}
            >
              <NotificationsNone
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up! New notifications will appear here.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.read
                        ? 'transparent'
                        : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                      cursor: notification.actionUrl ? 'pointer' : 'default',
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              flex: 1,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={notification.type}
                              size="small"
                              color={getNotificationColor(notification.type) as any}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {!notification.read && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <MarkEmailRead fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Button
              variant="text"
              size="small"
              onClick={() => {
                // Navigate to notifications page
                window.location.href = '/notifications';
                onClose();
              }}
            >
              View All Notifications
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};