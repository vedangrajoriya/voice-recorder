/*
  # Create recordings table and storage

  1. New Tables
    - `recordings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `audio_url` (text)
      - `duration` (double precision)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on recordings table
    - Add policy for users to manage their own recordings
*/

DO $$ 
BEGIN
  -- Create recordings table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'recordings'
  ) THEN
    CREATE TABLE recordings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title text NOT NULL,
      audio_url text NOT NULL,
      duration double precision NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Create policy if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'recordings' 
    AND policyname = 'Users can manage own recordings'
  ) THEN
    CREATE POLICY "Users can manage own recordings"
      ON recordings
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;