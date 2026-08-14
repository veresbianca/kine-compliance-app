export { createClient as createBrowserClient } from "./client";
export { createClient as createServerClient } from "./server";
export { createAdminClient } from "./admin";
export {
  buildPatientMagicLink,
  extractYouTubeEmbedUrl,
  getComplianceStatus,
  getComplianceLabel,
  getCurrentProfile,
  getDashboardPatients,
  getExerciseLibrary,
  getPrescriptionByToken,
  logCompletionByToken,
} from "./queries";
