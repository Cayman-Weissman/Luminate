import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Course {
  id: string;
  title: string;
  progress: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface UserStats {
  progress: number;
  hoursLearned: number;
  streak: number;
  pointsEarned: number;
}

export default function Profile() {
  const { user } = useAuth();

  const { data: userStats = { progress: 0, hoursLearned: 0, streak: 0, pointsEarned: 0 } } = useQuery<UserStats>({
    queryKey: ['userStats', user?.id],
    queryFn: () => apiRequest('GET', `/api/users/${user?.id}/stats`),
    enabled: !!user?.id
  });

  const { data: userCoursesData } = useQuery<Course[]>({
    queryKey: ['userCourses', user?.id],
    queryFn: () => apiRequest('GET', `/api/users/${user?.id}/courses`),
    enabled: !!user?.id
  });

  // Ensure userCourses is always an array
  const userCourses = Array.isArray(userCoursesData) ? userCoursesData : [];

  const { data: userBadgesData } = useQuery<Badge[]>({
    queryKey: ['userBadges', user?.id],
    queryFn: () => apiRequest('GET', `/api/users/${user?.id}/badges`),
    enabled: !!user?.id
  });

  // Ensure userBadges is always an array
  const userBadges = Array.isArray(userBadgesData) ? userBadgesData : [];

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                {user.profileImage ? (
                  <AvatarImage src={user.profileImage} alt={user.username} />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{user.displayName || user.username}</h2>
                <p className="text-zinc-400">@{user.username}</p>
              </div>
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Member since</h3>
                <p className="text-zinc-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Points</h3>
                <p className="text-zinc-400">{userStats.pointsEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <Tabs defaultValue="progress" className="w-full">
            <TabsList>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Overall Progress</span>
                        <span>{userStats.progress}%</span>
                      </div>
                      <Progress value={userStats.progress} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold">Hours Learned</h4>
                        <p className="text-zinc-400">{userStats.hoursLearned}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Streak</h4>
                        <p className="text-zinc-400">{userStats.streak} days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userCourses.length === 0 ? (
                      <p className="text-zinc-400">No courses in progress</p>
                    ) : (
                      userCourses.map((course) => (
                        <div key={course.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span>{course.title}</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userBadges.length === 0 ? (
                      <p className="text-zinc-400">No badges earned yet</p>
                    ) : (
                      userBadges.map((badge) => (
                        <div key={badge.id} className="text-center space-y-2">
                          <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center">
                            <i className={`ri-${badge.icon} text-2xl`}></i>
                          </div>
                          <h4 className="font-semibold">{badge.name}</h4>
                          <p className="text-sm text-zinc-400">{badge.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Activity items would go here */}
                    <p className="text-zinc-400">No recent activity to show</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 