import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // default 5173 is used by monolith ui; run both dev servers side by side
  server: { port: 5174 },
})
