import express from 'express';
import pm2 from 'pm2';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

const pm2Connect = () => {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                console.error('Error connecting to PM2:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

router.get('/', async (req, res) => {
    try {
        await pm2Connect();
        pm2.list((err, list) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const services = list.map(process => ({
                id: process.pm_id,
                name: process.name,
                status: process.pm2_env.status,
                memory: process.monit ? process.monit.memory : 0,
                cpu: process.monit ? process.monit.cpu : 0,
                uptime: process.pm2_env.pm_uptime,
                restarts: process.pm2_env.restart_time
            }));
            
            pm2.disconnect();
            res.json(services);
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal terhubung ke PM2' });
    }
});

router.post('/action', async (req, res) => {
    const { action, processId } = req.body;
    
    if (!['start', 'stop', 'restart', 'delete'].includes(action)) {
        return res.status(400).json({ error: 'Aksi tidak valid' });
    }

    try {
        await pm2Connect();
        pm2[action](processId, (err, proc) => {
            if (err) {
                pm2.disconnect();
                return res.status(500).json({ error: err.message });
            }
            pm2.disconnect();
            res.json({ message: `Aksi ${action} berhasil pada proses ${processId}` });
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengeksekusi aksi PM2' });
    }
});

import fs from 'fs';

router.get('/logs/:processId', async (req, res) => {
    const { processId } = req.params;
    try {
        await pm2Connect();
        pm2.describe(processId, (err, desc) => {
            if (err || !desc || desc.length === 0) {
                pm2.disconnect();
                return res.status(404).json({ error: 'Process not found' });
            }
            
            const processData = desc[0];
            const outPath = processData.pm2_env.pm_out_log_path;
            const errPath = processData.pm2_env.pm_err_log_path;
            
            pm2.disconnect();
            
            const readLogs = (logPath) => {
                try {
                    if (!logPath || !fs.existsSync(logPath)) return '';
                    const stats = fs.statSync(logPath);
                    const size = Math.min(stats.size, 50 * 1024); // max 50KB
                    const buffer = Buffer.alloc(size);
                    const fd = fs.openSync(logPath, 'r');
                    fs.readSync(fd, buffer, 0, size, stats.size - size);
                    fs.closeSync(fd);
                    return buffer.toString('utf8');
                } catch (e) {
                    return `Error reading log: ${e.message}`;
                }
            };

            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.json({
                out: readLogs(outPath),
                err: readLogs(errPath)
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil log PM2' });
    }
});

export default router;
