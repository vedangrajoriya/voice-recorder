import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, AlertCircle, Loader2, Info } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register, dbConnected } = useAuth();

  // Form validation
  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (!isLogin && !username.trim()) {
      setError('Username is required');
      return false;
    }

    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dbConnected) {
      setError('Unable to connect to the database. Please try again later.');
      return;
    }

    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setUsername('');
    setEmail('');
    setPassword('');
  };
  
  return (
    <div className="w-full max-w-md p-8 bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-white/70 mt-2">
          {isLogin 
            ? 'Sign in to access your recordings' 
            : 'Sign up to start saving your recordings'}
        </p>
      </div>
      
      {!dbConnected && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-white/90">
            Unable to connect to the database. Please check your connection and try again.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/40 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-white/90">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div>
            <label htmlFor="username" className="block text-white/80 mb-2 font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              placeholder="Enter your username"
              disabled={isLoading}
              minLength={2}
              maxLength={50}
              autoComplete="username"
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-white/80 mb-2 font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            placeholder="Enter your email"
            disabled={isLoading}
            required
            autoComplete="email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-white/80 mb-2 font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            placeholder="Enter your password"
            disabled={isLoading}
            required
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !dbConnected}
          className={`w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
            (isLoading || !dbConnected) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
            </>
          ) : (
            <>
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            </>
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button
          onClick={toggleMode}
          disabled={isLoading}
          className={`text-cyan-400 hover:text-cyan-300 transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

export default LoginForm