const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function request(path:string, options:any={}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  return res.json();
}
