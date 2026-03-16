const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/+$/, "");

// REGION: Auth API Endpoints
const API_AUTH_BASE = `${API_BASE_URL}/auth`;
const API_ADMIN_BASE = `${API_BASE_URL}/admin`;

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
const API_AUTH_ADMIN_PROFILE = `${API_ADMIN_BASE}/profile/`;
const API_AUTH_ADMIN_PROFILE_DETAIL = (id: string | number) =>
  `${API_AUTH_ADMIN_PROFILE}${id}/`;
const API_AUTH_USERS = `${API_ADMIN_BASE}/users/`;
const API_AUTH_PIC_USERS = `${API_ADMIN_BASE}/pic-users/`;
const API_AUTH_PIC_USERS_DROPDOWN = `${API_AUTH_PIC_USERS}dropdown/`;
const API_AUTH_ADMIN_ACTIONS = `${API_ADMIN_BASE}/actions/`;
const API_AUTH_ADMIN_ACTIONS_RECENT = `${API_AUTH_ADMIN_ACTIONS}recent/`;
const API_AUTH_ADMIN_ACTIONS_MY = `${API_AUTH_ADMIN_ACTIONS}my/`;
const API_AUTH_ADMIN_DASHBOARD = `${API_ADMIN_BASE}/dashboard/`;
const API_AUTH_ADMIN_DASHBOARD_KPIS = `${API_AUTH_ADMIN_DASHBOARD}kpis/`;

// REGION: Bookings API Endpoints
const API_BOOKINGS = `${API_BASE_URL}/bookings/`;
const API_BOOKINGS_MY = `${API_BOOKINGS}my/`;
const API_BOOKINGS_ALL = `${API_BOOKINGS}all/`;
const API_BOOKING_DETAIL = (id: string | number) => `${API_BOOKINGS}${id}/`;
const API_BOOKING_APPROVE = (id: string | number) =>
  `${API_BOOKINGS}${id}/approve/`;
const API_BOOKING_REJECT = (id: string | number) =>
  `${API_BOOKINGS}${id}/reject/`;
const API_BOOKING_COMPLETE = (id: string | number) =>
  `${API_BOOKINGS}${id}/complete/`;
const API_BOOKINGS_BY_MONTH = `${API_BOOKINGS}by-month/`;

// REGION: Borrows API Endpoints
const API_BORROWS = `${API_BASE_URL}/borrows/`;
const API_BORROW_DETAIL = (id: string | number) => `${API_BORROWS}${id}/`;
const API_BORROW_APPROVE = (id: string | number) =>
  `${API_BORROWS}${id}/approve/`;
const API_BORROW_REJECT = (id: string | number) =>
  `${API_BORROWS}${id}/reject/`;
const API_BORROW_RETURN = (id: string | number) =>
  `${API_BORROWS}${id}/return/`;
const API_BORROWS_BY_MONTH = `${API_BORROWS}by-month/`;

// REGION: Uses API Endpoints
const API_USES = `${API_BASE_URL}/uses/`;
const API_USE_DETAIL = (id: string | number) => `${API_USES}${id}/`;
const API_USE_APPROVE = (id: string | number) => `${API_USES}${id}/approve/`;
const API_USE_REJECT = (id: string | number) => `${API_USES}${id}/reject/`;
const API_USE_COMPLETE = (id: string | number) => `${API_USES}${id}/complete/`;

// REGION: Pengujians API Endpoints
const API_PENGUJIANS = `${API_BASE_URL}/pengujians/`;
const API_PENGUJIAN_DETAIL = (id: string | number) =>
  `${API_PENGUJIANS}${id}/`;
const API_PENGUJIAN_APPROVE = (id: string | number) =>
  `${API_PENGUJIANS}${id}/approve/`;
const API_PENGUJIAN_REJECT = (id: string | number) =>
  `${API_PENGUJIANS}${id}/reject/`;
const API_PENGUJIAN_COMPLETE = (id: string | number) =>
  `${API_PENGUJIANS}${id}/complete/`;

// REGION: Equipments API Endpoints
const API_EQUIPMENTS = `${API_BASE_URL}/equipments/`;
const API_EQUIPMENTS_DROPDOWN = `${API_EQUIPMENTS}dropdown/`;
const API_EQUIPMENT_DETAIL = (id: string | number) =>
  `${API_EQUIPMENTS}${id}/`;

// REGION: Images API Endpoints
const API_IMAGES = `${API_BASE_URL}/images/`;
const API_IMAGE_DETAIL = (id: string | number) => `${API_IMAGES}${id}/`;

// REGION: Rooms API Endpoints
const API_ROOMS = `${API_BASE_URL}/rooms/`;
const API_ROOMS_DROPDOWN = `${API_ROOMS}dropdown/`;
const API_ROOM_DETAIL = (id: string | number) => `${API_ROOMS}${id}/`;
const API_ROOM_AVAILABILITY = (id: string | number) =>
  `${API_ROOMS}${id}/availability/`;
const API_ANNOUNCEMENTS = `${API_BASE_URL}/announcements/`;
const API_SCHEDULES = `${API_BASE_URL}/schedules/`;
const API_SCHEDULE_DETAIL = (id: string | number) => `${API_SCHEDULES}${id}/`;
const API_CALENDAR = `${API_BASE_URL}/calendar/`;
const API_DASHBOARD_OVERVIEW = `${API_BASE_URL}/dashboard-overview/`;
const API_FAQS = `${API_BASE_URL}/faqs/`;
const API_STRUCTURE_ORGANIZATIONS = `${API_BASE_URL}/structure-organizations/`;

export {
  API_BASE_URL,
  API_AUTH_BASE,
  API_ADMIN_BASE,
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
  API_AUTH_PIC_USERS_DROPDOWN,
  API_AUTH_ADMIN_ACTIONS,
  API_AUTH_ADMIN_ACTIONS_RECENT,
  API_AUTH_ADMIN_ACTIONS_MY,
  API_AUTH_ADMIN_DASHBOARD,
  API_AUTH_ADMIN_DASHBOARD_KPIS,
  API_AUTH_TOKEN_REFRESH,
  API_AUTH_TOKEN_VERIFY,
  API_BOOKINGS,
  API_BOOKINGS_MY,
  API_BOOKINGS_ALL,
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
  API_USES,
  API_USE_DETAIL,
  API_USE_APPROVE,
  API_USE_REJECT,
  API_USE_COMPLETE,
  API_PENGUJIANS,
  API_PENGUJIAN_DETAIL,
  API_PENGUJIAN_APPROVE,
  API_PENGUJIAN_REJECT,
  API_PENGUJIAN_COMPLETE,
  API_EQUIPMENTS,
  API_EQUIPMENTS_DROPDOWN,
  API_EQUIPMENT_DETAIL,
  API_IMAGES,
  API_IMAGE_DETAIL,
  API_ROOMS,
  API_ROOMS_DROPDOWN,
  API_ROOM_DETAIL,
  API_ROOM_AVAILABILITY,
  API_ANNOUNCEMENTS,
  API_SCHEDULES,
  API_SCHEDULE_DETAIL,
  API_CALENDAR,
  API_DASHBOARD_OVERVIEW,
  API_FAQS,
  API_STRUCTURE_ORGANIZATIONS,
};
