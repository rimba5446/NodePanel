import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

// Base direktori yang diizinkan, diset di .env atau default ke folder 'services' berdampingan dengan panel
const BASE_DIR = process.env.SERVICES_DIR ? path.resolve(process.env.SERVICES_DIR) : path.resolve(process.cwd(), '../services');

// Fungsi pembantu untuk mencegah Directory Traversal (Akses folder di luar batas)
const getSafePath = (targetPath) => {
    if (!targetPath) return BASE_DIR;
    
    const resolvedPath = path.resolve(targetPath);
    
    // Gunakan path.relative yang lebih aman dan mendukung format Windows (case-insensitive drive letter)
    const relative = path.relative(BASE_DIR, resolvedPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('Akses ditolak: Directory traversal terdeteksi.');
    }
    return resolvedPath;
};

router.get('/list', async (req, res) => {
    try {
        const targetPath = getSafePath(req.query.path || BASE_DIR);
        const items = await fs.readdir(targetPath, { withFileTypes: true });
        
        const files = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(targetPath, item.name).replace(/\\/g, '/') // Normalisasi path ke forward slash
        }));
        
        // Sort: Directory first, then files
        files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
        
        res.json({ 
            currentPath: targetPath.replace(/\\/g, '/'), 
            parentPath: targetPath === BASE_DIR ? targetPath.replace(/\\/g, '/') : path.dirname(targetPath).replace(/\\/g, '/'),
            baseDir: BASE_DIR.replace(/\\/g, '/'),
            files 
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal membaca direktori: ' + err.message });
    }
});

router.get('/read', async (req, res) => {
    try {
        if (!req.query.path) return res.status(400).json({ error: 'Path diperlukan' });
        const targetPath = getSafePath(req.query.path);
        
        const content = await fs.readFile(targetPath, 'utf8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: 'Gagal membaca file: ' + err.message });
    }
});

router.post('/write', async (req, res) => {
    try {
        const { path: reqPath, content } = req.body;
        if (!reqPath || content === undefined) {
            return res.status(400).json({ error: 'Path dan content diperlukan' });
        }
        
        const targetPath = getSafePath(reqPath);
        await fs.writeFile(targetPath, content, 'utf8');
        res.json({ message: 'File berhasil disimpan' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menyimpan file: ' + err.message });
    }
});

export default router;
