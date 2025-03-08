/*
  # Initial Schema Setup for Voice Recorder App

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User's unique identifier
      - `username` (text) - User's display name
      - `email` (text) - User's email address
      - `created_at` (timestamptz) - When the user was created
    
    - `recordings`
      - `id` (uuid, primary key) - Recording's unique identifier
      - `user_id` (uuid) - Reference to the user who created the recording
      - `title` (text) - Recording title
      - `audio_url` (text) - URL to the stored audio file
      - `duration` (float) - Duration of the recording in seconds
      - `created_at` (timestamptz) - When the recording was created

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Add policies for recordings to be accessed only by their owners
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  audio_url text NOT NULL,
  duration float NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for recordings
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own recordings
CREATE POLICY "Users can manage own recordings"
  ON recordings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);