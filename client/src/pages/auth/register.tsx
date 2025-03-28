import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username cannot exceed 20 characters' })
    .regex(/^[a-z0-9_]+$/, { message: 'Username can only contain lowercase letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await register(data.username, data.email, data.password);
      toast({
        title: "Registration successful",
        description: "Welcome to Luminate! You can now log in.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "This username or email may already be in use",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <Card className="max-w-md w-full bg-zinc-800 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Create an Account</CardTitle>
          <CardDescription>Join Luminate and start your learning journey</CardDescription>
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
                        placeholder="Choose a username" 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="your.email@example.com" 
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
                        placeholder="Create a strong password" 
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your password" 
                        className="bg-zinc-900 border-zinc-700" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="text-xs text-zinc-400">
                By creating an account, you agree to our{' '}
                <span className="text-primary hover:text-primary/80 cursor-pointer">Terms of Service</span>{' '}
                and{' '}
                <span className="text-primary hover:text-primary/80 cursor-pointer">Privacy Policy</span>.
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-zinc-900">
                Create Account
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
              <span className="bg-zinc-800 px-2 text-zinc-400">Or sign up with</span>
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
            Already have an account?{' '}
            <Link href="/login">
              <span className="font-medium text-primary hover:text-primary/80 cursor-pointer">
                Sign in
              </span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
