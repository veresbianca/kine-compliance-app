export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ComplianceStatus = "green" | "yellow" | "red";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  clinic_name: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  therapist_id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

export interface ExerciseLibrary {
  id: string;
  title: string;
  description: string;
  video_url: string;
  default_sets: number;
  default_reps: number;
  created_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  therapist_id: string;
  magic_token: string;
  active: boolean;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  frequency_per_day: number;
  created_at: string;
}

export interface CompletionLog {
  id: string;
  prescription_id: string;
  completed_at: string;
  pain_score: number;
  patient_notes: string | null;
  created_at: string;
}

/** Insert payloads (omit generated fields) */
export type ProfileInsert = Pick<Profile, "id" | "email" | "full_name"> & {
  clinic_name?: string | null;
};

export type PatientInsert = Pick<
  Patient,
  "therapist_id" | "full_name" | "phone_number"
>;

export type ExerciseLibraryInsert = Pick<
  ExerciseLibrary,
  "title" | "description" | "video_url" | "default_sets" | "default_reps"
>;

export type PrescriptionInsert = Pick<
  Prescription,
  "patient_id" | "therapist_id"
> & {
  magic_token?: string;
  active?: boolean;
};

export type PrescriptionItemInsert = Pick<
  PrescriptionItem,
  "prescription_id" | "exercise_id" | "sets" | "reps" | "frequency_per_day"
>;

export type CompletionLogInsert = Pick<
  CompletionLog,
  "prescription_id" | "pain_score"
> & {
  patient_notes?: string | null;
  completed_at?: string;
};

/** Joined / view types used by the app */
export interface PrescriptionItemWithExercise extends PrescriptionItem {
  exercise: ExerciseLibrary;
}

export interface PatientWithPrescription extends Patient {
  prescription: Prescription | null;
  compliance_status: ComplianceStatus;
  last_completed_at: string | null;
  latest_pain_score: number | null;
  streak_days: number;
}

export interface PatientPrescriptionView {
  prescription: Pick<Prescription, "id" | "magic_token" | "active" | "created_at">;
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
}

export interface LogCompletionResult {
  log_id: string;
  streak_days: number;
}

/** Supabase Database typing for typed clients */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
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
        Row: Patient;
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
        Row: ExerciseLibrary;
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
        Row: Prescription;
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
        Row: PrescriptionItem;
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
        Row: CompletionLog;
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
}
