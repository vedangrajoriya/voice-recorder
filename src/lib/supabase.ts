import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://qcywplfvzwxcatofizdx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeXdwbGZ2end4Y2F0b2ZpemR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MTAzMzMsImV4cCI6MjA1Njk4NjMzM30.FzkYxtycv_zAB0HDTKdI_gp7hxYKIz10E_LrW7nrxKI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: "voice-recorder-auth",
    flowType: "pkce",
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "voice-recorder",
    },
  },
});

// Helper function to check database connection
export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine for connection test
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
};

// Helper to handle common Supabase errors
export const getErrorMessage = (error: any): string => {
  if (!error) return "An unknown error occurred";

  // Handle specific error codes
  const errorMessages: Record<string, string> = {
    "auth/invalid-email": "Invalid email address",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Invalid password",
    "auth/email-already-in-use": "An account with this email already exists",
    "auth/weak-password": "Password should be at least 6 characters",
    "23505": "An account with this email already exists",
    PGRST116: "No data found",
    "42P01": "Database table not found",
    "42501": "Permission denied",
    refresh_token_not_found: "Your session has expired. Please sign in again.",
  };

  const message =
    typeof error === "string"
      ? error
      : error.message ||
        error.error_description ||
        error.error ||
        "An error occurred";
  return errorMessages[error.code || message] || message;
};
