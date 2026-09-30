export const BACKEND_URL = 'http://localhost:8000';

export async function analyzeAudio(audioFile: File | Blob) {
  const formData = new FormData();
  formData.append('file', audioFile, 'audio.wav');
  const res = await fetch(`${BACKEND_URL}/api/audio/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function recognizeSpeech(audioFile: File | Blob) {
  const formData = new FormData();
  formData.append('file', audioFile, 'speech.wav');
  const res = await fetch(`${BACKEND_URL}/api/speech/recognize`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function detectPerson(imageFile: File | Blob) {
  const formData = new FormData();
  formData.append('file', imageFile, 'frame.jpg');
  const res = await fetch(`${BACKEND_URL}/api/person/detect`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}
