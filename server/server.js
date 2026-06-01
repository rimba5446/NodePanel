import 'dotenv/config'; // Memuat .env sebelum import lainnya
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';

// Memaksa Node.js menggunakan Google DNS agar bypass blokir provider lokal
dns.setServers(['8.8.8.8', '8.8.4.4']);

import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import fileRoutes from './routes/files.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/files', fileRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Terjadi kesalahan internal server' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
