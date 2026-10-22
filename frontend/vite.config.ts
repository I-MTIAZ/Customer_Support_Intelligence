import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  preview: {
    allowedHosts: [
      "customer-support-intelligence-91ph.onrender.com",
    ],
  },
});
