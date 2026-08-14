export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ComplianceStatus = "green" | "yellow" | "red";

/** Supabase Database typing for typed clients */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          clinic_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          clinic_name?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          clinic_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          therapist_id: string;
          full_name: string;
          phone_number: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          full_name: string;
          phone_number: string;
          created_at?: string;
        };
        Update: {
          therapist_id?: string;
          full_name?: string;
          phone_number?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patients_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_library: {
        Row: {
          id: string;
          title: string;
          description: string;
          video_url: string;
          default_sets: number;
          default_reps: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          video_url: string;
          default_sets?: number;
          default_reps?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          video_url?: string;
          default_sets?: number;
          default_reps?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string;
          therapist_id: string;
          magic_token: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          therapist_id: string;
          magic_token?: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          patient_id?: string;
          therapist_id?: string;
          magic_token?: string;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey";
            columns: ["patient_id"];
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_therapist_id_fkey";
            columns: ["therapist_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      prescription_items: {
        Row: {
          id: string;
          prescription_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          frequency_per_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          prescription_id: string;
          exercise_id: string;
          sets?: number;
          reps?: number;
          frequency_per_day?: number;
          created_at?: string;
        };
        Update: {
          prescription_id?: string;
          exercise_id?: string;
          sets?: number;
          reps?: number;
          frequency_per_day?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey";
            columns: ["prescription_id"];
            referencedRelation: "prescriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescription_items_exercise_id_fkey";
            columns: ["exercise_id"];
            referencedRelation: "exercise_library";
            referencedColumns: ["id"];
          },
        ];
      };
      completion_logs: {
        Row: {
          id: string;
          prescription_id: string;
          completed_at: string;
          pain_score: number;
          patient_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          prescription_id: string;
          completed_at?: string;
          pain_score: number;
          patient_notes?: string | null;
          created_at?: string;
        };
        Update: {
          prescription_id?: string;
          completed_at?: string;
          pain_score?: number;
          patient_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "completion_logs_prescription_id_fkey";
            columns: ["prescription_id"];
            referencedRelation: "prescriptions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_prescription_by_token: {
        Args: {
          p_token: string;
        };
        Returns: PatientPrescriptionView;
      };
      log_completion_by_token: {
        Args: {
          p_token: string;
          p_pain_score: number;
          p_patient_notes?: string | null;
        };
        Returns: LogCompletionResult;
      };
    };
  };
};

/** Table row types derived from the database schema */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type ExerciseLibrary =
  Database["public"]["Tables"]["exercise_library"]["Row"];
export type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
export type PrescriptionItem =
  Database["public"]["Tables"]["prescription_items"]["Row"];
export type CompletionLog =
  Database["public"]["Tables"]["completion_logs"]["Row"];

/** Insert payloads */
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
export type ExerciseLibraryInsert =
  Database["public"]["Tables"]["exercise_library"]["Insert"];
export type PrescriptionInsert =
  Database["public"]["Tables"]["prescriptions"]["Insert"];
export type PrescriptionItemInsert =
  Database["public"]["Tables"]["prescription_items"]["Insert"];
export type CompletionLogInsert =
  Database["public"]["Tables"]["completion_logs"]["Insert"];

/** Joined / view types used by the app */
export type PrescriptionItemWithExercise = PrescriptionItem & {
  exercise: ExerciseLibrary;
};

export type PatientWithPrescription = Patient & {
  prescription: Prescription | null;
  compliance_status: ComplianceStatus;
  last_completed_at: string | null;
  latest_pain_score: number | null;
  streak_days: number;
};

export type PatientPrescriptionView = {
  prescription: Pick<
    Prescription,
    "id" | "magic_token" | "active" | "created_at"
  >;
  patient: Pick<Patient, "id" | "full_name">;
  therapist: Pick<Profile, "clinic_name" | "full_name">;
  items: Array<{
    id: string;
    sets: number;
    reps: number;
    frequency_per_day: number;
    exercise: Pick<
      ExerciseLibrary,
      | "id"
      | "title"
      | "description"
      | "video_url"
      | "default_sets"
      | "default_reps"
    >;
  }>;
  streak_days: number;
  logged_today: boolean;
};

export type LogCompletionResult = {
  log_id: string;
  streak_days: number;
};
