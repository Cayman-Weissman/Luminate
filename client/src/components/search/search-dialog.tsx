import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => apiRequest('GET', `/api/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: debouncedQuery.length > 0,
  });

  const handleResultClick = (type: string, id: string) => {
    switch (type) {
      case 'course':
        setLocation(`/topics/${id}`);
        break;
      case 'user':
        setLocation(`/profile/${id}`);
        break;
      case 'post':
        setLocation(`/community/post/${id}`);
        break;
      default:
        break;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="relative">
          <Input
            placeholder="Search courses, users, or posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
          <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"></i>
        </div>

        {query && (
          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-4">
              {searchResults?.courses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2">Courses</h3>
                  <div className="space-y-2">
                    {searchResults.courses.map((course: any) => (
                      <Button
                        key={course.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleResultClick('course', course.id)}
                      >
                        <i className="ri-book-line mr-2"></i>
                        {course.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults?.users?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2">Users</h3>
                  <div className="space-y-2">
                    {searchResults.users.map((user: any) => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleResultClick('user', user.id)}
                      >
                        <i className="ri-user-line mr-2"></i>
                        {user.displayName || user.username}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults?.posts?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2">Posts</h3>
                  <div className="space-y-2">
                    {searchResults.posts.map((post: any) => (
                      <Button
                        key={post.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleResultClick('post', post.id)}
                      >
                        <i className="ri-chat-1-line mr-2"></i>
                        {post.content.substring(0, 50)}...
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {query && (!searchResults?.courses?.length && !searchResults?.users?.length && !searchResults?.posts?.length) && (
                <div className="text-center text-zinc-400 py-8">
                  No results found for "{query}"
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
} 