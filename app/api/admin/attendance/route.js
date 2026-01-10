export async function POST(request) {
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
    const dbConnect = (await import('@/lib/mongodb')).default;
    const Attendance = (await import('@/models/Attendance')).default;
    const User = (await import('@/models/User')).default;

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { employeeId, type } = await request.json();

    if (!employeeId || !type) {
      return Response.json({ error: 'Employee ID and type are required' }, { status: 400 });
    }

    // Check if employee exists
    const employee = await User.findOne({ employeeId });
    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'checkin') {
      // Check if already checked in today
      const existingAttendance = await Attendance.findOne({
        employeeId,
        date: today,
      });

      if (existingAttendance) {
        return Response.json({ error: 'Employee already checked in today' }, { status: 400 });
      }

      const attendance = new Attendance({
        employeeId,
        employeeName: employee.name,
        checkIn: new Date(),
        date: today,
      });

      await attendance.save();

      return Response.json({ message: 'Checked in successfully', attendance });
    } else if (type === 'checkout') {
      const attendance = await Attendance.findOne({
        employeeId,
        date: today,
        checkOut: null,
      });

      if (!attendance) {
        return Response.json({ error: 'No active check-in found for today' }, { status: 400 });
      }

      attendance.checkOut = new Date();
      attendance.totalHours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60); // hours

      await attendance.save();

      return Response.json({ message: 'Checked out successfully', attendance });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Admin attendance API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}