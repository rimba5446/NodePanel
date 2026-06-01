import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dns from 'dns';

// Memaksa Node.js menggunakan Google DNS agar bypass blokir provider lokal
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Temporary schema import so we don't depend on app running
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

const setupAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('❌ Admin sudah disetup sebelumnya.');
            process.exit(1);
        }

        const admin = new User({
            username: 'admin',
            password: 'password123'
        });

        await admin.save();
        console.log('🎉 Sukses! Akun admin berhasil dibuat.');
        console.log('-----------------------------------');
        console.log('Username: admin');
        console.log('Password: password123');
        console.log('-----------------------------------');
        console.log('Silakan ganti password segera setelah login.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

setupAdmin();
