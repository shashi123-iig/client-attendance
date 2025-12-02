import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    date: { type: Date, required: true },
    checkIn: { type: String },
    checkOut: { type: String },
    hoursWorked: { type: Number },
  },
  { timestamps: true }
);

// Prevent model overwrite on Vercel
export default mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema);
