"use client";

import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';
import { useUser, useAuth as useFirebaseAuthService } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { LayoutDashboard, LifeBuoy, LogOut, Settings, Users, Loader2, Wand2 } from 'lucide-react';
import { signOut } from 'firebase/auth';

function Header() {
  const { user } = useUser();
  const auth = useFirebaseAuthService();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold">Skill Issue</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/skills"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              My Skills
            </Link>
            <Link
              href="/bookings"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Bookings
            </Link>
            <Link
              href="/ai-chat"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              AI Chat
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => router.push('/settings')} title="Settings">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Settings</span>
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={()=> router.push('/')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Home</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={()=> router.push('/skills')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>My Skills</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={()=> router.push('/bookings')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Bookings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={()=> router.push('/ai-chat')}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    <span>AI Chat</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={()=> router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                 <DropdownMenuItem disabled>
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                <p className="text-muted-foreground">Loading your session...</p>
            </div>
        </div>
    );
  }
  
  if (!user) {
    return null; // The useUser hook handles redirection
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
