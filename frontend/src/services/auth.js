import {
  loginUser as apiLoginUser,
  registerUser as apiRegisterUser,
  kirimKodeReset as apiKirimKodeReset,
  resetPasswordDenganKode as apiResetPasswordDenganKode,
  getBaseUrl,
} from "./api";

// Tetap sediakan konstanta API_URL agar kompatibel dengan kode sebelumnya
export const API_URL = `${getBaseUrl()}/api/auth`;

export async function loginUser(identitas, password) {
  return await apiLoginUser(identitas, password);
}

export async function registerUser(nama, nim, email, password) {
  return await apiRegisterUser(nama, nim, email, password);
}

export async function kirimKodeReset(email) {
  return await apiKirimKodeReset(email);
}

export async function resetPasswordDenganKode(email, kode, passwordBaru) {
  return await apiResetPasswordDenganKode(email, kode, passwordBaru);
}