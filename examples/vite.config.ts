import { defineConfig } from 'vite';
import devSink from 'devsink/vite';

export default defineConfig({
  plugins: [devSink({ captureBodies: true })],
});
