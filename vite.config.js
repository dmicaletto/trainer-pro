import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Se la tua repo si chiama "mio-workout", 
  // cambia la riga sotto in base: '/mio-workout/'
  // Se usi un dominio personalizzato, usa base: '/'
  base: './', 
  build: {
    outDir: 'dist',
  }
})
