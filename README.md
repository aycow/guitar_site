# Welcome to the Guitarverse project! 
we are a free open source project aimed at revolutionizing guitar practice!

<img width="2554" height="1370" alt="image" src="https://github.com/user-attachments/assets/8683df9a-3b0a-492f-b8b3-500e29afdc07" />

# Guitar verse aims to make guitar practice more sociable! 
we included leaderboards, profiles, campaign modes and more
<img width="2559" height="1007" alt="image" src="https://github.com/user-attachments/assets/6bcd771e-044d-42cb-89b8-284555ddca83" />

# Get live feeback on your accuracy 
<img width="2526" height="1257" alt="image" src="https://github.com/user-attachments/assets/333f9d60-1c00-4d40-a6d4-33683372f54f" />

## Development Workflows

### 1) Local dev (UI + MIDI import)

Use this when working on normal UI/game features or MIDI import.

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

Notes:
- This keeps your existing workflow unchanged.
- MIDI import works without ffmpeg/ffprobe.
- If audio import is selected and ffmpeg is unavailable on the backend runtime, the app shows a server-side capability warning.

### 2) Local dev with audio import via Docker (recommended)

Use this when you need audio import. This Docker backend includes `ffmpeg` and `ffprobe` preinstalled.

```bash
docker compose up --build audio-import-backend
```

Open: `http://localhost:3001`

This container runs the backend + in-process import worker with audio tooling available.

Stop it with:

```bash
docker compose down
```

### Docker env notes

- `docker-compose.yml` reads `.env.local`.
- For Docker backend DB access, `MONGODB_URI` defaults to:
  - `mongodb://host.docker.internal:27017/guitar-game`
- You can override by setting `DOCKER_MONGODB_URI` before startup.


