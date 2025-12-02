export async function POST() {
  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    const User = (await import('@/models/User')).default;
    const bcrypt = (await import('bcryptjs')).default;

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
    }

    // Create sample employee
    const employeeExists = await User.findOne({ email: 'employee@example.com' });
    if (!employeeExists) {
      const hashedPassword = await bcrypt.hash('employee123', 10);
      const employee = new User({
        name: 'John Doe',
        email: 'employee@example.com',
        password: hashedPassword,
        role: 'employee',
        employeeId: 'EMP001',
      });
      await employee.save();
    }

    return Response.json({ message: 'Sample users created successfully' });
  } catch (error) {
    console.error("FULL SEED ERROR:", error);  // ← add this
    return Response.json({ error: error.message }, { status: 500 });
  }
}
