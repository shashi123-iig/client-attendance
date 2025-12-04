import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    totalHours: { type: Number },
  },
  { timestamps: true }
);

// Prevent model overwrite on Vercel
export default mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);
