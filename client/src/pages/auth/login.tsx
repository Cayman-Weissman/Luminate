import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      console.log("Login form submitted with username:", data.username);
      
      // Add a console log for debugging
      console.log("Cookies before login:", document.cookie);
      
      await login(data.username, data.password);
      
      console.log("Login function completed successfully");
      console.log("Cookies after login:", document.cookie);
      
      toast({
        title: "Login successful",
        description: "Welcome back to Luminate!",
      });
      
      // Manually check auth status one more time
      try {
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-cache'
        });
        
        console.log("Final auth check status:", res.status);
        if (res.ok) {
          const userData = await res.json();
          console.log("Final auth check user data:", userData);
        }
      } catch (err) {
        console.error("Final auth check error:", err);
      }
      
      console.log("Navigating to dashboard");
      navigate('/dashboard');
    } catch (error) {
      console.error("Login submission error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="max-w-md w-full bg-zinc-800 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Luminate account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username" 
                        className="bg-zinc-900 border-zinc-700" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        className="bg-zinc-900 border-zinc-700" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="remember" className="text-sm font-medium text-zinc-400">
                    Remember me
                  </Label>
                </div>
                <span className="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">
                  Forgot password?
                </span>
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-zinc-900">
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-800 px-2 text-zinc-400">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="bg-zinc-900 hover:bg-zinc-700">
              <i className="ri-google-fill mr-2"></i> Google
            </Button>
            <Button variant="outline" className="bg-zinc-900 hover:bg-zinc-700">
              <i className="ri-github-fill mr-2"></i> GitHub
            </Button>
          </div>
          
          <div className="text-center text-sm text-zinc-400">
            Don't have an account?{' '}
            <Link href="/register">
              <span className="font-medium text-primary hover:text-primary/80 cursor-pointer">
                Sign up
              </span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
