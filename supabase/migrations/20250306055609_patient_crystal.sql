/*
  # Fix RLS policies and user registration

  1. Changes
    - Add INSERT policy for users table to allow registration
    - Update RLS policies to be more permissive during registration
    - Add storage bucket for recordings
    
  2. Security
    - Maintain RLS security while allowing necessary operations
    - Ensure proper access control for recordings storage
*/

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create storage bucket for recordings if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name)
  VALUES ('recordings', 'recordings')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Set up storage policy for recordings bucket
CREATE POLICY "Users can manage own recordings"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);