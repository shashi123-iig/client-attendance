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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's an active check-in (no checkOut)
    const activeAttendance = await Attendance.findOne({
      employeeId: session.user.employeeId,
      date: today,
      checkOut: null,
    });

    if (activeAttendance) {
      // Check out
      activeAttendance.checkOut = new Date();
      activeAttendance.totalHours = (activeAttendance.checkOut - activeAttendance.checkIn) / (1000 * 60 * 60); // hours

      await activeAttendance.save();

      return Response.json({ message: 'Checked out successfully', type: 'checkout', attendance: activeAttendance });
    } else {
      // Check in
      // Check if already checked in and out today
      const existingAttendance = await Attendance.findOne({
        employeeId: session.user.employeeId,
        date: today,
        checkOut: { $ne: null },
      });

      if (existingAttendance) {
        return Response.json({ error: 'Already checked in and out today' }, { status: 400 });
      }

      const attendance = new Attendance({
        employeeId: session.user.employeeId,
        employeeName: session.user.name,
        checkIn: new Date(),
        date: today,
      });

      await attendance.save();

      return Response.json({ message: 'Checked in successfully', type: 'checkin', attendance });
    }
  } catch (error) {
    console.error('Checkin API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}