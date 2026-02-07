const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/";

// REGION: Auth API Endpoints
const API_AUTH_BASE = `${API_BASE_URL}/api/auth`;

const API_AUTH_LOGIN = `${API_AUTH_BASE}/login/`;
const API_AUTH_LOGOUT = `${API_AUTH_BASE}/logout/`;
const API_AUTH_LOGIN_GOOGLE = `${API_AUTH_BASE}/oauth/google/login/`;
const API_AUTH_REGISTER = `${API_AUTH_BASE}/registration/`;
const API_AUTH_VERIFY_EMAIL = `${API_AUTH_BASE}/registration/verify-email/`;
const API_AUTH_EMAIL_STATUS = `${API_AUTH_BASE}/registration/check-email/`;
const API_AUTH_RESEND_VERIFICATION = `${API_AUTH_BASE}/registration/resend-email/`;
const API_AUTH_PASSWORD_RESET = `${API_AUTH_BASE}/password/reset/`;
const API_AUTH_PASSWORD_RESET_CONFIRM = `${API_AUTH_BASE}/password/reset/confirm/`;
const API_AUTH_PASSWORD_CHANGE = `${API_AUTH_BASE}/password/change/`;
const API_AUTH_TOKEN_REFRESH = `${API_AUTH_BASE}/token/refresh/`;
const API_AUTH_TOKEN_VERIFY = `${API_AUTH_BASE}/token/verify/`;

// REGION: User Profile API Endpoints
const API_AUTH_USER = `${API_AUTH_BASE}/user/`;
const API_AUTH_USER_PROFILE = `${API_AUTH_BASE}/user/profile/`;
const API_AUTH_USER_PROFILE_DETAIL = (id: string | number) =>
  `${API_AUTH_USER_PROFILE}${id}/`;

// REGION: Admin Profile API Endpoints
const API_AUTH_ADMIN_PROFILE = `${API_AUTH_BASE}/admin/profile/`;
const API_AUTH_ADMIN_PROFILE_DETAIL = (id: string | number) =>
  `${API_AUTH_ADMIN_PROFILE}${id}/`;
const API_AUTH_USERS = `${API_AUTH_BASE}/admin/users/`;
const API_AUTH_PIC_USERS = `${API_AUTH_BASE}/pic-users/`;

// REGION: Bookings API Endpoints
const API_BOOKINGS = `${API_BASE_URL}/api/bookings/`;
const API_BOOKING_DETAIL = (id: string | number) => `${API_BOOKINGS}${id}/`;
const API_BOOKING_APPROVE = (id: string | number) =>
  `${API_BOOKINGS}${id}/approve/`;
const API_BOOKING_REJECT = (id: string | number) =>
  `${API_BOOKINGS}${id}/reject/`;
const API_BOOKING_COMPLETE = (id: string | number) =>
  `${API_BOOKINGS}${id}/complete/`;
const API_BOOKINGS_BY_MONTH = `${API_BOOKINGS}by-month/`;

// REGION: Borrows API Endpoints
const API_BORROWS = `${API_BASE_URL}/api/borrows/`;
const API_BORROW_DETAIL = (id: string | number) => `${API_BORROWS}${id}/`;
const API_BORROW_APPROVE = (id: string | number) =>
  `${API_BORROWS}${id}/approve/`;
const API_BORROW_REJECT = (id: string | number) =>
  `${API_BORROWS}${id}/reject/`;
const API_BORROW_RETURN = (id: string | number) =>
  `${API_BORROWS}${id}/return/`;
const API_BORROWS_BY_MONTH = `${API_BORROWS}by-month/`;

// REGION: Equipments API Endpoints
const API_EQUIPMENTS = `${API_BASE_URL}/api/equipments/`;
const API_EQUIPMENT_DETAIL = (id: string | number) =>
  `${API_EQUIPMENTS}${id}/`;

// REGION: Images API Endpoints
const API_IMAGES = `${API_BASE_URL}/api/images/`;
const API_IMAGE_DETAIL = (id: string | number) => `${API_IMAGES}${id}/`;

// REGION: Rooms API Endpoints
const API_ROOMS = `${API_BASE_URL}/api/rooms/`;
const API_ROOM_DETAIL = (id: string | number) => `${API_ROOMS}${id}/`;
const API_ROOM_AVAILABILITY = (id: string | number) =>
  `${API_ROOMS}${id}/availability/`;

export {
  API_BASE_URL,
  API_AUTH_BASE,
  API_AUTH_LOGIN,
  API_AUTH_LOGOUT,
  API_AUTH_LOGIN_GOOGLE,
  API_AUTH_REGISTER,
  API_AUTH_VERIFY_EMAIL,
  API_AUTH_EMAIL_STATUS,
  API_AUTH_RESEND_VERIFICATION,
  API_AUTH_PASSWORD_RESET,
  API_AUTH_PASSWORD_RESET_CONFIRM,
  API_AUTH_PASSWORD_CHANGE,
  API_AUTH_USER,
  API_AUTH_USER_PROFILE,
  API_AUTH_USER_PROFILE_DETAIL,
  API_AUTH_ADMIN_PROFILE,
  API_AUTH_ADMIN_PROFILE_DETAIL,
  API_AUTH_USERS,
  API_AUTH_PIC_USERS,
  API_AUTH_TOKEN_REFRESH,
  API_AUTH_TOKEN_VERIFY,
  API_BOOKINGS,
  API_BOOKING_DETAIL,
  API_BOOKING_APPROVE,
  API_BOOKING_REJECT,
  API_BOOKING_COMPLETE,
  API_BOOKINGS_BY_MONTH,
  API_BORROWS,
  API_BORROW_DETAIL,
  API_BORROW_APPROVE,
  API_BORROW_REJECT,
  API_BORROW_RETURN,
  API_BORROWS_BY_MONTH,
  API_EQUIPMENTS,
  API_EQUIPMENT_DETAIL,
  API_IMAGES,
  API_IMAGE_DETAIL,
  API_ROOMS,
  API_ROOM_DETAIL,
  API_ROOM_AVAILABILITY,
};
