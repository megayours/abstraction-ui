import { Button } from '@/components/ui/button';
import { useWeb3Auth } from '@/providers/web3auth-provider';
import { toast } from 'sonner';

export function SignInButton() {
  const { login, isLoading } = useWeb3Auth();

  const handleSignIn = async () => {
    try {
      await login();
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
} 