import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// client/ and shared/ are sibling folders (see ../shared) so that this
// project — and only this project — is what gets deployed to Vercel.
// The alias below just lets '@shared/...' resolve to that sibling folder's
// source at both dev-server and build time; Vercel still has the full repo
// checked out even when "Root Directory" is set to client/, so the relative
// path resolves fine there too.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, '../shared/src'),
        },
    },
    server: {
        fs: {
            // Vite's dev server blocks serving files outside the project
            // root by default. shared/ lives one directory above client/,
            // so it needs to be explicitly allowed.
            allow: ['..'],
        },
    },
});
