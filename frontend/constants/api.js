const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/";


// REGION: Auth API Endpoints
const API_AUTH_BASE = `${API_BASE_URL}/api/auth`;

const API_AUTH_LOGIN = `${API_AUTH_BASE}/login/`;
const API_AUTH_LOGOUT = `${API_AUTH_BASE}/logout/`;
const API_AUTH_LOGIN_GOOGLE = `${API_AUTH_BASE}/oauth/google/login/`;
const API_AUTH_PROFILE = `${API_AUTH_BASE}/profile/`;
const API_AUTH_REGISTER = `${API_AUTH_BASE}/registration/`;
const API_AUTH_VERIFY_EMAIL = `${API_AUTH_BASE}/registration/verify-email/`;
const API_AUTH_EMAIL_STATUS = `${API_AUTH_BASE}/registration/check-email/`;
const API_AUTH_RESEND_VERIFICATION = `${API_AUTH_BASE}/registration/resend-email/`;
const API_AUTH_PASSWORD_RESET = `${API_AUTH_BASE}/password/reset/`;
const API_AUTH_PASSWORD_RESET_CONFIRM = `${API_AUTH_BASE}/password/reset/confirm/`;

export {
  API_BASE_URL,
  API_AUTH_BASE,
  API_AUTH_LOGIN,
  API_AUTH_LOGOUT,
  API_AUTH_LOGIN_GOOGLE,
  API_AUTH_PROFILE,
  API_AUTH_REGISTER,
  API_AUTH_VERIFY_EMAIL,
  API_AUTH_EMAIL_STATUS,
  API_AUTH_RESEND_VERIFICATION,
  API_AUTH_PASSWORD_RESET,
  API_AUTH_PASSWORD_RESET_CONFIRM,
};
