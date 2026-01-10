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

    // Create sample employees
    const employees = [
      { name: 'John Doe', email: 'john@example.com', employeeId: 'EMP001' },
      { name: 'Jane Smith', email: 'jane@example.com', employeeId: 'EMP002' },
      { name: 'Bob Johnson', email: 'bob@example.com', employeeId: 'EMP003' },
      { name: 'Alice Brown', email: 'alice@example.com', employeeId: 'EMP004' },
    ];

    for (const emp of employees) {
      const exists = await User.findOne({ email: emp.email });
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
      }
    }

    return Response.json({ message: 'Sample users created successfully' });
  } catch (error) {
    console.error("FULL SEED ERROR:", error);  // ← add this
    return Response.json({ error: error.message }, { status: 500 });
  }
}
