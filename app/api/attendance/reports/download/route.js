export async function GET(request) {
  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    const Attendance = (await import('@/models/Attendance')).default;
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('../auth/[...nextauth]/route');

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendances = await Attendance.find(query).sort({ date: -1 });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = 'Employee ID,Employee Name,Date,Check In,Check Out,Total Hours\n';
      const csvRows = attendances.map(att => {
        const checkIn = att.checkIn ? `"${new Date(att.checkIn).toLocaleString()}"` : '';
        const checkOut = att.checkOut ? `"${new Date(att.checkOut).toLocaleString()}"` : '';
        const totalHours = att.totalHours ? att.totalHours.toFixed(2) : '';
        const date = `"${new Date(att.date).toLocaleDateString()}"`;
        return `${att.employeeId},"${att.employeeName}",${date},${checkIn},${checkOut},${totalHours}`;
      }).join('\n');

      const csvContent = csvHeaders + csvRows;

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="attendance_report.csv"'
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Download report error:', error);
    return Response.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}