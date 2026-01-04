const DEFAULT_GATEWAY = (import.meta as any).env.VITE_GATEWAY_URL || "http://localhost:8000/ai_notekeeper";

export async function uploadAudio(file: File, baseUrl = DEFAULT_GATEWAY) {
  const url = `${baseUrl.replace(/\/$/, "")}/run_notekeeper`;
  const fd = new FormData();
  fd.append("file", file, file.name);

  const resp = await fetch(url, {
    method: "POST",
    body: fd,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Upload failed: ${resp.status} ${resp.statusText} ${text}`);
  }

  return resp.json();
}

export default DEFAULT_GATEWAY;
