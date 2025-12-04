export async function GET(request) {
  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    const User = (await import('@/models/User')).default;
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('../auth/[...nextauth]/route');

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const employees = await User.find({ role: 'employee' }).select('-password');

    return Response.json({ employees });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return Response.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    const User = (await import('@/models/User')).default;
    const bcrypt = (await import('bcryptjs')).default;
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('../auth/[...nextauth]/route');

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { name, email, password, employeeId } = await request.json();

    if (!name || !email || !password || !employeeId) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return Response.json({ error: 'User with this email or employee ID already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = new User({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      employeeId,
    });

    await newEmployee.save();

    return Response.json({
      message: 'Employee created successfully',
      employee: {
        id: newEmployee._id,
        name: newEmployee.name,
        email: newEmployee.email,
        employeeId: newEmployee.employeeId,
        role: newEmployee.role,
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return Response.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    const User = (await import('@/models/User')).default;
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('../auth/[...nextauth]/route');

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return Response.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const deletedEmployee = await User.findByIdAndDelete(employeeId);

    if (!deletedEmployee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    return Response.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return Response.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}