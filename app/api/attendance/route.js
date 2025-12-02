export async function POST(request) {
  try {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
    const dbConnect = (await import('@/lib/mongodb')).default;
    const Attendance = (await import('@/models/Attendance')).default;

    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { type } = await request.json(); // 'checkin' or 'checkout'

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'checkin') {
      // Check if already checked in today
      const existingAttendance = await Attendance.findOne({
        employeeId: session.user.employeeId,
        date: today,
      });

      if (existingAttendance) {
        return Response.json({ error: 'Already checked in today' }, { status: 400 });
      }

      const attendance = new Attendance({
        employeeId: session.user.employeeId,
        employeeName: session.user.name,
        checkIn: new Date(),
        date: today,
      });

      await attendance.save();

      return Response.json({ message: 'Checked in successfully', attendance });
    } else if (type === 'checkout') {
      const attendance = await Attendance.findOne({
        employeeId: session.user.employeeId,
        date: today,
        checkOut: null,
      });

      if (!attendance) {
        return Response.json({ error: 'No active check-in found' }, { status: 400 });
      }

      attendance.checkOut = new Date();
      attendance.totalHours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60); // hours

      await attendance.save();

      return Response.json({ message: 'Checked out successfully', attendance });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Attendance API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}