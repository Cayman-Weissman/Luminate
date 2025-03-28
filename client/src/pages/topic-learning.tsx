import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  Award,
  PlayCircle,
  BookMarked,
  CheckCircle,
  Edit3,
  HelpCircle,
  FileText,
  Zap,
  Lock
} from 'lucide-react';

// Types for the interactive learning experience
interface Step {
  id: number;
  type: 'intro' | 'content' | 'quiz' | 'practice' | 'challenge' | 'summary';
  title: string;
  content: string;
  options?: string[];
  correctOption?: number;
  explanation?: string;
  completed: boolean;
}

interface Module {
  id: number;
  title: string;
  description: string;
  progress: number;
  steps: Step[];
  unlocked: boolean;
}

interface TopicLearning {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalModules: number;
  completedModules: number;
  currentModule: number;
  streak: number;
  lastActivity: string;
  modules: Module[];
}

// Format time since last activity
const formatTimeSince = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
};

// Step type icon mapping
const getStepIcon = (type: Step['type']) => {
  switch (type) {
    case 'intro':
      return <BookOpen size={20} />;
    case 'content':
      return <FileText size={20} />;
    case 'quiz':
      return <HelpCircle size={20} />;
    case 'practice':
      return <Edit3 size={20} />;
    case 'challenge':
      return <Zap size={20} />;
    case 'summary':
      return <CheckCircle size={20} />;
    default:
      return <BookOpen size={20} />;
  }
};

// Main component
const TopicLearning = () => {
  const [, params] = useRoute<{ id: string }>('/topics/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // States
  const [topicData, setTopicData] = useState<TopicLearning | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [experience, setExperience] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  
  // Load topic data
  useEffect(() => {
    const fetchTopicData = async () => {
      setIsLoading(true);
      try {
        if (!params || !params.id) {
          throw new Error('Invalid topic ID');
        }
        
        const topicId = parseInt(params.id);
        
        // Fetch the topic data
        const response = await apiRequest('GET', `/api/topics/${topicId}`, undefined);
        
        // Fetch learning path for the topic
        const learningPath = await apiRequest('GET', `/api/topics/${topicId}/learning-path`, undefined);
        
        // Generate quiz questions
        const quizData = await apiRequest('GET', `/api/topics/${topicId}/quiz`, undefined);
        
        // Generate modules with steps from the learning path and quiz
        let generatedModules: Module[] = [];
        
        if (learningPath && learningPath.steps && Array.isArray(learningPath.steps)) {
          // Convert learning path steps to modules with content steps
          generatedModules = learningPath.steps.map((step: any, index: number) => {
            const moduleSteps: Step[] = [];
            
            // Add intro step
            moduleSteps.push({
              id: 1,
              type: 'intro',
              title: `Introduction to ${step.title}`,
              content: `Welcome to this module on ${step.title}. ${step.description}`,
              completed: false
            });
            
            // Add content step
            moduleSteps.push({
              id: 2,
              type: 'content',
              title: step.title,
              content: step.description,
              completed: false
            });
            
            // Add quiz step (if we have quiz data)
            if (quizData && quizData.quiz) {
              try {
                // Try to parse quiz data if it's a string
                const parsedQuiz = typeof quizData.quiz === 'string' 
                  ? JSON.parse(quizData.quiz) 
                  : quizData.quiz;
                
                if (parsedQuiz.questions && parsedQuiz.questions.length > index) {
                  const question = parsedQuiz.questions[index];
                  moduleSteps.push({
                    id: 3,
                    type: 'quiz',
                    title: 'Test Your Knowledge',
                    content: question.question,
                    options: question.options,
                    correctOption: question.options.indexOf(question.correctAnswer),
                    explanation: question.explanation,
                    completed: false
                  });
                }
              } catch (err) {
                console.error('Error parsing quiz data:', err);
              }
            }
            
            // Add practice step
            moduleSteps.push({
              id: 4,
              type: 'practice',
              title: 'Practice Activity',
              content: `Now it's time to practice what you've learned about ${step.title}.\n\nApply the concepts by completing the following activity:\n\n${step.resources && step.resources.length > 0 ? step.resources[0] : 'Practical exercise coming soon.'}`,
              completed: false
            });
            
            // Add summary step
            moduleSteps.push({
              id: 5,
              type: 'summary',
              title: 'Module Summary',
              content: `Congratulations on completing this module on ${step.title}!\n\nIn this module, you learned:\n• ${step.description}\n\nTime to continue your learning journey!`,
              completed: false
            });
            
            return {
              id: index + 1,
              title: step.title,
              description: step.description,
              progress: 0,
              steps: moduleSteps,
              unlocked: index === 0 // Only first module is initially unlocked
            };
          });
        }
        
        // Create the topic learning data
        const topicLearning: TopicLearning = {
          id: topicId,
          title: response.title,
          description: response.description,
          difficulty: 'beginner',
          totalModules: generatedModules.length,
          completedModules: 0,
          currentModule: 0,
          streak: 3, // Default streak value
          lastActivity: new Date().toISOString(),
          modules: generatedModules
        };
        
        setTopicData(topicLearning);
        setStreak(topicLearning.streak);
      } catch (error) {
        console.error('Error fetching topic learning data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load topic learning content. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopicData();
  }, [params?.id]);
  
  // Handle step completion
  const completeStep = () => {
    if (!topicData) return;
    
    // Make a copy of the topic data
    const updatedTopicData = { ...topicData };
    const currentModule = updatedTopicData.modules[currentModuleIndex];
    const currentStep = currentModule.steps[currentStepIndex];
    
    // Mark step as completed
    currentStep.completed = true;
    
    // Calculate module progress
    const completedSteps = currentModule.steps.filter(step => step.completed).length;
    currentModule.progress = Math.floor((completedSteps / currentModule.steps.length) * 100);
    
    // Update experience
    const newExperience = experience + 10; // +10 XP per step
    setExperience(newExperience);
    
    // Check if module is completed
    if (completedSteps === currentModule.steps.length) {
      // Check if there are more modules
      if (currentModuleIndex + 1 < updatedTopicData.modules.length) {
        // Unlock next module
        updatedTopicData.modules[currentModuleIndex + 1].unlocked = true;
        
        // Update completed modules
        updatedTopicData.completedModules += 1;
        
        // Show completion toast
        toast({
          title: 'Module Completed!',
          description: `You've earned 50 XP and unlocked the next module!`,
          variant: 'default',
        });
        
        // Add bonus experience for completing a module
        setExperience(newExperience + 50);
      } else {
        // Topic completed
        updatedTopicData.completedModules = updatedTopicData.totalModules;
        
        // Show completion toast
        toast({
          title: 'Topic Mastered!',
          description: `Congratulations! You've completed all modules for this topic!`,
          variant: 'default',
        });
        
        // Add bonus experience for completing the topic
        setExperience(newExperience + 100);
      }
    }
    
    // Update topic data
    setTopicData(updatedTopicData);
  };
  
  // Move to next step
  const goToNextStep = () => {
    if (!topicData) return;
    
    const currentModule = topicData.modules[currentModuleIndex];
    
    // Check if there are more steps in this module
    if (currentStepIndex + 1 < currentModule.steps.length) {
      setCurrentStepIndex(currentStepIndex + 1);
      setUserAnswer(null);
      setAnswerSubmitted(false);
    } else {
      // Check if there are more modules
      if (currentModuleIndex + 1 < topicData.modules.length) {
        // Move to next module if it's unlocked
        if (topicData.modules[currentModuleIndex + 1].unlocked) {
          setCurrentModuleIndex(currentModuleIndex + 1);
          setCurrentStepIndex(0);
          setUserAnswer(null);
          setAnswerSubmitted(false);
        }
      } else {
        // Go back to module selection
        setCurrentStepIndex(0);
      }
    }
  };
  
  // Go to previous step
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setUserAnswer(null);
      setAnswerSubmitted(false);
    } else if (currentModuleIndex > 0) {
      // Go to last step of previous module
      setCurrentModuleIndex(currentModuleIndex - 1);
      const prevModule = topicData?.modules[currentModuleIndex - 1];
      if (prevModule) {
        setCurrentStepIndex(prevModule.steps.length - 1);
      }
      setUserAnswer(null);
      setAnswerSubmitted(false);
    }
  };
  
  // Handle quiz answer submission
  const submitAnswer = (optionIndex: number) => {
    if (!topicData) return;
    
    const currentModule = topicData.modules[currentModuleIndex];
    const currentStep = currentModule.steps[currentStepIndex];
    
    setUserAnswer(optionIndex);
    
    if (currentStep.type === 'quiz' && currentStep.correctOption !== undefined) {
      const isAnswerCorrect = optionIndex === currentStep.correctOption;
      setIsCorrect(isAnswerCorrect);
      
      if (isAnswerCorrect) {
        // Add experience for correct answer
        setExperience(experience + 20);
        
        // Increase streak
        setStreak(streak + 1);
        
        toast({
          title: 'Correct!',
          description: 'Great job! You earned 20 XP.',
          variant: 'default',
        });
      } else {
        // Reset streak for incorrect answer
        setStreak(1);
        
        toast({
          title: 'Incorrect',
          description: 'Try again next time!',
          variant: 'destructive',
        });
      }
    }
    
    setAnswerSubmitted(true);
  };
  
  // Select module to study
  const selectModule = (moduleIndex: number) => {
    if (!topicData) return;
    
    const module = topicData.modules[moduleIndex];
    if (module.unlocked) {
      setCurrentModuleIndex(moduleIndex);
      setCurrentStepIndex(0);
      setUserAnswer(null);
      setAnswerSubmitted(false);
    } else {
      toast({
        title: 'Module Locked',
        description: 'Complete the previous modules to unlock this one.',
        variant: 'destructive',
      });
    }
  };
  
  // Go back to topics page
  const goBack = () => {
    setLocation('/topics');
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-white">Loading learning content...</div>
      </div>
    );
  }
  
  // Render if no topic data
  if (!topicData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-8 text-center">
            <div className="text-white mb-4">Topic not found or failed to load learning content.</div>
            <Button onClick={goBack}>Go Back to Topics</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentModule = topicData.modules[currentModuleIndex];
  const currentStep = currentModule.steps[currentStepIndex];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with topic info and progress */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={goBack} className="text-zinc-400 hover:text-white">
              <ArrowLeft size={16} className="mr-1" /> Topics
            </Button>
            <h1 className="text-2xl font-bold text-white">{topicData.title}</h1>
            <Badge className="bg-zinc-700 text-zinc-300">
              {topicData.difficulty}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge className="bg-primary/20 text-primary">
                <Zap size={14} className="mr-1" /> {experience} XP
              </Badge>
              <Badge className="bg-yellow-500/20 text-yellow-400">
                <Award size={14} className="mr-1" /> {streak} day streak
              </Badge>
              <div className="text-zinc-400 text-xs flex items-center">
                <Clock size={14} className="mr-1" /> Last activity: {formatTimeSince(topicData.lastActivity)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Overall progress */}
        <Card className="bg-zinc-800 border-zinc-700 mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2">
              <h2 className="text-lg font-medium text-white">Your Progress</h2>
              <div className="text-zinc-400 text-sm">
                {topicData.completedModules} of {topicData.totalModules} modules completed
              </div>
            </div>
            <Progress 
              value={(topicData.completedModules / topicData.totalModules) * 100} 
              className="h-2 bg-zinc-700"
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module selection sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-lg font-medium text-white mb-3">Learning Modules</h2>
          
          {topicData.modules.map((module, index) => (
            <Card 
              key={module.id}
              className={`
                ${currentModuleIndex === index ? 'border-primary bg-zinc-800' : 'bg-zinc-800 border-zinc-700'}
                ${!module.unlocked ? 'opacity-75' : ''}
                hover:bg-zinc-750 transition-colors cursor-pointer overflow-hidden
              `}
              onClick={() => selectModule(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {module.progress === 100 ? (
                      <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mr-2">
                        <Check size={14} />
                      </div>
                    ) : !module.unlocked ? (
                      <div className="h-6 w-6 rounded-full bg-zinc-700 text-zinc-500 flex items-center justify-center mr-2">
                        <Lock size={14} />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-2">
                        {index + 1}
                      </div>
                    )}
                    <h3 className="font-medium text-white">{module.title}</h3>
                  </div>
                  
                  {currentModuleIndex === index && (
                    <Badge className="bg-primary/20 text-primary">Current</Badge>
                  )}
                </div>
                
                <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{module.description}</p>
                
                <div className="flex items-center justify-between">
                  <Progress 
                    value={module.progress} 
                    className="h-1.5 bg-zinc-700 w-44"
                  />
                  <span className="text-zinc-400 text-xs">{module.progress}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Learning content */}
        <div className="lg:col-span-8 space-y-4">
          {/* Steps progress bar */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto no-scrollbar py-1">
            {currentModule.steps.map((step, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                <div 
                  className={`
                    h-2 w-2 rounded-full mr-1
                    ${index < currentStepIndex ? 'bg-green-500' : 
                      index === currentStepIndex ? 'bg-primary' : 'bg-zinc-700'}
                  `}
                />
                
                {index < currentModule.steps.length - 1 && (
                  <div 
                    className={`h-0.5 w-6 ${index < currentStepIndex ? 'bg-green-500' : 'bg-zinc-700'}`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Current step content */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="p-4 border-b border-zinc-700">
              <div className="flex items-center">
                <div className="mr-2 text-primary">
                  {getStepIcon(currentStep.type)}
                </div>
                <CardTitle className="text-white">{currentStep.title}</CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="p-5">
              {currentStep.type === 'quiz' ? (
                <div className="space-y-6">
                  <div className="text-white whitespace-pre-line">{currentStep.content}</div>
                  
                  <div className="space-y-3 mt-4">
                    {currentStep.options?.map((option, index) => (
                      <div 
                        key={index}
                        className={`
                          p-3 border rounded-lg cursor-pointer flex items-center gap-3
                          ${!answerSubmitted ? 'border-zinc-700 hover:border-primary' : 
                            userAnswer === index ? 
                              (index === currentStep.correctOption ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500') : 
                              index === currentStep.correctOption ? 'bg-green-500/10 border-green-500' : 'border-zinc-700'}
                        `}
                        onClick={() => !answerSubmitted && submitAnswer(index)}
                      >
                        <div 
                          className={`
                            h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium
                            ${!answerSubmitted ? 'bg-zinc-700 text-white' : 
                              userAnswer === index ? 
                                (index === currentStep.correctOption ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 
                                index === currentStep.correctOption ? 'bg-green-500 text-white' : 'bg-zinc-700 text-white'}
                          `}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-white">{option}</span>
                      </div>
                    ))}
                  </div>
                  
                  {answerSubmitted && currentStep.explanation && (
                    <Card className={`border-0 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'} p-3 mt-4`}>
                      <CardContent className="p-3">
                        <p className="text-white font-medium mb-1">
                          {isCorrect ? 'Correct!' : 'Incorrect!'}
                        </p>
                        <p className="text-zinc-300">{currentStep.explanation}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-white whitespace-pre-line">{currentStep.content}</div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between p-4 border-t border-zinc-700">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={currentModuleIndex === 0 && currentStepIndex === 0}
                className="border-zinc-700 text-zinc-300"
              >
                <ArrowLeft size={16} className="mr-1" /> Previous
              </Button>
              
              {currentStep.type === 'quiz' ? (
                <Button 
                  onClick={goToNextStep} 
                  disabled={!answerSubmitted}
                  className="bg-primary hover:bg-primary/90"
                >
                  {answerSubmitted ? 'Continue' : 'Submit Answer'} <ChevronRight size={16} className="ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    completeStep();
                    goToNextStep();
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Continue <ChevronRight size={16} className="ml-1" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TopicLearning;