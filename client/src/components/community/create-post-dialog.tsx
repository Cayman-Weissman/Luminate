import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CreatePostDialogProps {
  onPostCreated: () => void;
  trigger?: React.ReactNode;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ onPostCreated, trigger }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the post with category
      await apiRequest('POST', '/api/community/posts', { 
        content,
        category 
      });
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      // Reset and close
      setContent('');
      setCategory('general');
      setOpen(false);
      // Refresh posts
      onPostCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="items-center bg-primary hover:bg-primary/90 text-zinc-900 font-medium"
          >
            <i className="ri-add-line mr-1"></i>
            New Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="my-4">
          <Textarea
            className="bg-zinc-900 border-zinc-700 resize-none text-white placeholder:text-zinc-400"
            placeholder="Share your thoughts, questions, or achievements..."
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <Label htmlFor="category" className="block text-zinc-300 text-sm mb-2">
            Category
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="question">Question</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="achievement">Achievement</SelectItem>
              <SelectItem value="resource">Learning Resource</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
          <Button 
            variant="ghost" 
            className="text-zinc-400 hover:text-white hover:bg-zinc-700"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-zinc-900 font-medium"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;