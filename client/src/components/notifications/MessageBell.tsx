import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InternalMessage } from "@shared/schema";

export function MessageBell() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const response = await fetch("/api/messages");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest(`/api/messages/${messageId}/read`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive",
      });
    },
  });

  const unreadCount = messages.filter((msg: InternalMessage) => !msg.read).length;

  const handleMarkAsRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No messages yet
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {messages.map((message: InternalMessage) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg border ${
                        message.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{message.subject}</h4>
                          <p className="text-xs text-gray-600 mt-1">{message.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!message.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2"
                            onClick={() => handleMarkAsRead(message.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}