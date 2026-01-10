import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('MONGODB_URI:', process.env.MONGODB_URI);

import mongoose from 'mongoose';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

async function seedData() {
  try {
    await dbConnect();

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        employeeId: 'ADMIN001',
      });
      await admin.save();
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Create sample employees
    const employees = [
      { name: 'John Doe', email: 'john@example.com', employeeId: 'EMP001' },
      { name: 'Jane Smith', email: 'jane@example.com', employeeId: 'EMP002' },
      { name: 'Bob Johnson', email: 'bob@example.com', employeeId: 'EMP003' },
      { name: 'Alice Brown', email: 'alice@example.com', employeeId: 'EMP004' },
    ];

    for (const emp of employees) {
      const exists = await User.findOne({ $or: [{ email: emp.email }, { employeeId: emp.employeeId }] });
      if (!exists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const employee = new User({
          name: emp.name,
          email: emp.email,
          password: hashedPassword,
          role: 'employee',
          employeeId: emp.employeeId,
        });
        await employee.save();
        console.log(`Employee ${emp.name} created`);
      } else {
        console.log(`Employee ${emp.name} already exists`);
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedData();