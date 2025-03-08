import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, checkDatabaseConnection, getErrorMessage } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define user type
export interface User {
  id: string;
  username: string;
  email: string;
}

// Define recording type
export interface Recording {
  id: string;
  userId: string;
  title: string;
  date: string;
  audioUrl: string;
  duration: number;
}

// Define context type
interface AuthContextType {
  user: User | null | undefined;
  recordings: Recording[];
  isLoading: boolean;
  dbConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  saveRecording: (title: string, audioBlob: Blob, duration: number) => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  // Check database connection and load initial data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check database connection
        const isConnected = await checkDatabaseConnection();
        setDbConnected(isConnected);

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRecordings([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load user data from database
  const loadUserData = async (authUser: SupabaseUser) => {
    try {
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          // User profile doesn't exist, create it
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
              id: authUser.id,
              username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
              email: authUser.email
            }])
            .select()
            .single();

          if (insertError) throw insertError;

          if (newUser) {
            setUser({
              id: newUser.id,
              username: newUser.username,
              email: newUser.email
            });
          }
        } else {
          throw userError;
        }
      } else if (userData) {
        setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email
        });

        // Load recordings
        const { data: recordingsData, error: recordingsError } = await supabase
          .from('recordings')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (recordingsError) throw recordingsError;

        setRecordings(recordingsData?.map(rec => ({
          id: rec.id,
          userId: rec.user_id,
          title: rec.title,
          date: rec.created_at,
          audioUrl: rec.audio_url,
          duration: rec.duration
        })) || []);
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
      await supabase.auth.signOut();
      setUser(null);
      setRecordings([]);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

    } catch (error) {
      console.error('Login error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { username: username.trim() }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Registration failed');

    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all auth state
      setUser(null);
      setRecordings([]);
      
      // Clear any stored session
      localStorage.removeItem('voice-recorder-auth');
      
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Save recording function
  const saveRecording = async (title: string, audioBlob: Blob, duration: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Upload audio file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.wav`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      // Save recording metadata to database
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([{
          user_id: user.id,
          title,
          audio_url: publicUrl,
          duration
        }]);

      if (dbError) throw dbError;

      // Reload recordings
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (recordingsError) throw recordingsError;

      setRecordings(recordingsData?.map(rec => ({
        id: rec.id,
        userId: rec.user_id,
        title: rec.title,
        date: rec.created_at,
        audioUrl: rec.audio_url,
        duration: rec.duration
      })) || []);

    } catch (error) {
      console.error('Error saving recording:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  // Delete recording function
  const deleteRecording = async (id: string) => {
    if (!user) return;

    try {
      // Get recording details first
      const { data: recording, error: fetchError } = await supabase
        .from('recordings')
        .select('audio_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const fileName = recording.audio_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('recordings')
          .remove([`${user.id}/${fileName}`]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Update state
      setRecordings(prev => prev.filter(rec => rec.id !== id));
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw new Error(getErrorMessage(error));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      recordings,
      isLoading,
      dbConnected,
      login,
      register,
      logout,
      saveRecording,
      deleteRecording
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};