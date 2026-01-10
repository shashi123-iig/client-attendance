import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('MONGODB_URI:', process.env.MONGODB_URI);

import mongoose from 'mongoose';
import User from './models/User.js';

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

async function viewUsers() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' });
    console.log('Admins:');
    admins.forEach(admin => console.log(`- ${admin.name} (${admin.email}) - ${admin.employeeId}`));

    const employees = await User.find({ role: 'employee' });
    console.log('\nEmployees:');
    employees.forEach(employee => console.log(`- ${employee.name} (${employee.email}) - ${employee.employeeId}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

viewUsers();