import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendingTopic } from '@/lib/types';
import { AuthContext } from '@/context/auth-context';
import { toast } from '@/hooks/use-toast';
import TopicTrendChart from '@/components/ui/topic-trend-chart';
import { BookOpen, Star, Award, ArrowLeft, PlayCircle, ArrowUpRight, HelpCircle, BookText, FileQuestion } from 'lucide-react';

interface TopicDetailProps {
  topic: TrendingTopic;
  onBack: () => void;
}

interface TopicContent {
  topicId: number;
  title: string;
  content: string;
}

interface TopicLearningPath {
  topicId: number;
  title: string;
  learningPath: string;
}

interface TopicQuiz {
  topicId: number;
  title: string;
  quiz: string;
}

const TopicDetail: React.FC<TopicDetailProps> = ({ topic, onBack }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { isAuthenticated } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Query to check if the topic is already in user's interests
  const { data: isInterested, isLoading: checkingInterest, refetch: refetchInterest } = useQuery<{isInterested: boolean}>({
    queryKey: [`/api/user/interests/check/${topic.id}`],
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Mutation for adding a topic to interests
  const addInterestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/user/interests/${topic.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to interests');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic added to your interests",
        variant: "default"
      });
      refetchInterest();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for removing a topic from interests
  const removeInterestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/user/interests/${topic.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove from interests');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic removed from your interests",
        variant: "default"
      });
      refetchInterest();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleToggleInterest = () => {
    if (isInterested?.isInterested) {
      removeInterestMutation.mutate();
    } else {
      addInterestMutation.mutate();
    }
  };

  const { data: contentData, isLoading: contentLoading } = useQuery<TopicContent>({
    queryKey: [`/api/topics/${topic.id}/content`],
    enabled: activeTab === 'overview' || activeTab === 'all',
  });

  const { data: learningPathData, isLoading: pathLoading } = useQuery<TopicLearningPath>({
    queryKey: [`/api/topics/${topic.id}/learning-path`],
    enabled: activeTab === 'learning-path' || activeTab === 'all',
  });

  const { data: quizData, isLoading: quizLoading } = useQuery<TopicQuiz>({
    queryKey: [`/api/topics/${topic.id}/quiz`],
    enabled: activeTab === 'quiz' || activeTab === 'all',
  });

  // Function to format markdown content with proper line breaks
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="mt-4">
      <Button 
        variant="outline" 
        onClick={onBack}
        className="mb-4"
      >
        <i className="ri-arrow-left-line mr-2"></i> Back to Topics
      </Button>

      <Card className="bg-zinc-800/90 border-zinc-700 overflow-hidden backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary mr-4`}>
              <i className={topic.icon && topic.icon.startsWith('ri-') ? topic.icon : 'ri-lightbulb-line'}></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{topic.title}</h2>
              <div className="flex items-center text-sm mt-1">
                <span className="text-zinc-400 mr-4">{topic.learnerCount.toLocaleString()} learners</span>
                <span className="text-emerald-400">+{topic.growthPercentage}% growth</span>
              </div>
            </div>
          </div>

          <p className="text-zinc-300 mb-6">{topic.description}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {topic.tags?.map((tag, index) => (
              <span key={index} className="bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
          
          {/* Topic trend chart */}
          <div className="mb-6">
            <TopicTrendChart 
              topicId={topic.id} 
              topicName={topic.title} 
            />
          </div>

          {/* Interactive Learning button - available to all users */}
          <div className="mb-6 flex gap-3">
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
              onClick={() => setLocation(`/topics/${topic.id}`)}
            >
              <PlayCircle size={16} />
              Start Interactive Learning
            </Button>
            
            {isAuthenticated && (
              <Button
                variant={isInterested?.isInterested ? "outline" : "default"}
                size="sm"
                className="gap-2"
                onClick={handleToggleInterest}
                disabled={addInterestMutation.isPending || removeInterestMutation.isPending}
              >
                {isInterested?.isInterested ? (
                  <>
                    <Star size={16} className="fill-current" />
                    Interested
                  </>
                ) : (
                  <>
                    <Star size={16} />
                    Add to Interests
                  </>
                )}
              </Button>
            )}
          </div>

          <Separator className="my-6 bg-zinc-700" />

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-700/50 p-1 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <BookOpen size={16} />
                Overview
              </TabsTrigger>
              <TabsTrigger value="learning-path" className="flex items-center gap-1">
                <BookText size={16} />
                Learning Path
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center gap-1">
                <FileQuestion size={16} />
                Quiz
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="text-zinc-300">
              {contentLoading ? (
                <div className="p-4 text-center">Loading content...</div>
              ) : contentData ? (
                <div className="prose prose-invert max-w-none">
                  {formatContent(contentData.content)}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p>Failed to load content. Please try again later.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="learning-path" className="text-zinc-300">
              {pathLoading ? (
                <div className="p-4 text-center">Loading learning path...</div>
              ) : learningPathData ? (
                <div className="prose prose-invert max-w-none">
                  {formatContent(learningPathData.learningPath)}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p>Failed to load learning path. Please try again later.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="quiz" className="text-zinc-300">
              {quizLoading ? (
                <div className="p-4 text-center">Loading quiz...</div>
              ) : quizData ? (
                <div className="prose prose-invert max-w-none">
                  {formatContent(quizData.quiz)}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p>Failed to load quiz. Please try again later.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicDetail;