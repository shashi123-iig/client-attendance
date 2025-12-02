export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = { employeeId: session.user.employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendances = await Attendance.find(query).sort({ date: -1 });

    return Response.json({ attendances });
  } catch (error) {
    console.error('Reports API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}