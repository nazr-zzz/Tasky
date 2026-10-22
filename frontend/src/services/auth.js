const API_URL = "http://192.168.18.72:3000/api/auth";


export async function loginUser(identitas, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identitas,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.pesan || "Login gagal.");
  }

  return data;
}
