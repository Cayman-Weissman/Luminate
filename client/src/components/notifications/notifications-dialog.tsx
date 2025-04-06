import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/components/ui/use-toast";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsDialog({ open, onOpenChange }: NotificationsDialogProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('GET', '/api/notifications'),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PUT', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Notification marked as read",
      });
    },
  });

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'course_update':
        setLocation(`/topics/${notification.courseId}`);
        break;
      case 'comment':
        setLocation(`/community/post/${notification.postId}`);
        break;
      case 'achievement':
        setLocation('/profile');
        break;
      default:
        break;
    }
    onOpenChange(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'course_update':
        return 'ri-book-line';
      case 'comment':
        return 'ri-chat-1-line';
      case 'achievement':
        return 'ri-medal-line';
      default:
        return 'ri-notification-3-line';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <Button variant="ghost" size="sm">
            Mark all as read
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {notifications?.length > 0 ? (
              notifications.map((notification: any) => (
                <Button
                  key={notification.id}
                  variant="ghost"
                  className={`w-full justify-start ${!notification.read ? 'bg-zinc-800/50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${!notification.read ? 'bg-primary/20' : 'bg-zinc-800'}`}>
                      <i className={`ri-${getNotificationIcon(notification.type)} text-lg`}></i>
                    </div>
                    <div className="text-left">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center text-zinc-400 py-8">
                No notifications
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 