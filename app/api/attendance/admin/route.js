export async function GET(request) {
  try {
    // Lazy load everything so nothing runs at build time
    const dbConnect = (await import("@/lib/mongodb")).default;
    const Attendance = (await import("@/models/Attendance")).default;
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");

    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect DB
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    const attendances = await Attendance.find(query)
  .populate("employeeId", "name employeeId") // populate name + employeeId
  .sort({ date: -1 });

// Convert structured output (IMPORTANT)
const formatted = attendances.map(att => ({
  _id: att._id,
  employeeId: att.employeeId.employeeId,
  employeeName: att.employeeId.name,
  date: att.date,
  checkIn: att.checkIn,
  checkOut: att.checkOut,
  totalHours: att.totalHours,
}));

    return Response.json({ attendances: formatted });
  } catch (error) {
    console.error("Admin attendance API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
