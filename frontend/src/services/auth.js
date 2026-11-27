import {
  loginUser as apiLoginUser,
  logoutUser as apiLogoutUser,
  checkSession as apiCheckSession,
  registerUser as apiRegisterUser,
  kirimKodeReset as apiKirimKodeReset,
  resetPasswordDenganKode as apiResetPasswordDenganKode,
  getBaseUrl,
} from "./api";

export const API_URL = `${getBaseUrl()}/api/auth`;

export async function loginUser(identitas, password, deviceId, force = false) {
  return await apiLoginUser(identitas, password, deviceId, force);
}

export async function logoutUser(userId, deviceId) {
  return await apiLogoutUser(userId, deviceId);
}

export async function checkSession(userId, deviceId) {
  return await apiCheckSession(userId, deviceId);
}

export async function registerUser(nama, nim, email, password, semester) {
  return await apiRegisterUser(nama, nim, email, password, semester);
}

export async function kirimKodeReset(email) {
  return await apiKirimKodeReset(email);
}

export async function resetPasswordDenganKode(email, kode, passwordBaru) {
  return await apiResetPasswordDenganKode(email, kode, passwordBaru);
}