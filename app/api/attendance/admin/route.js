import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

export async function GET(request) {
  try {
    // Lazy import NextAuth so it doesn't execute during build
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
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

    const attendances = await Attendance.find(query).sort({ date: -1 });

    return Response.json({ attendances });
  } catch (error) {
    console.error("Admin attendance API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
