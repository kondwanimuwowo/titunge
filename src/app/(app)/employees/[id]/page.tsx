import { redirect } from "next/navigation";
import { getEmployeeById, getEmployeeAttendance } from "@/lib/data/employees";
import { getBusinessContext } from "@/lib/business-context";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();
  const employee = await getEmployeeById(businessId, id);

  if (!employee) {
    redirect("/employees");
  }

  // Get last 30 days attendance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendance = await getEmployeeAttendance(
    businessId,
    id,
    thirtyDaysAgo.toISOString().split("T")[0],
    new Date().toISOString().split("T")[0]
  );

  const totalHours = attendance.reduce((sum, a) => sum + (parseFloat(String(a.hours_worked || 0))), 0);
  const daysWorked = attendance.filter((a) => a.hours_worked).length;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={employee.name}
        description={`${employee.role} • Hire Date: ${employee.hire_date ? format(new Date(employee.hire_date), "MMM d, yyyy") : "Not set"}`}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-semibold">{employee.email || "—"}</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="text-sm font-semibold">{employee.phone}</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <p className="text-xs text-muted-foreground">Hourly Rate</p>
          <p className="text-sm font-semibold">K{(parseFloat(String(employee.hourly_rate || 0))).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-sm font-semibold">{employee.active ? "Active" : "Inactive"}</p>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-semibold mb-4">Last 30 Days (Attendance)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Days Worked</p>
            <p className="text-2xl font-bold">{daysWorked}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Est. Earnings</p>
            <p className="text-2xl font-bold">
              K{(totalHours * parseFloat(String(employee.hourly_rate || 0))).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="font-semibold mb-4">Recent Attendance</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records</p>
          ) : (
            attendance.slice(0, 10).map((record) => (
              <div key={record.id} className="flex justify-between text-sm p-2 border-b">
                <span>{format(new Date(record.date), "MMM d, yyyy")}</span>
                <span className="text-muted-foreground">
                  {record.hours_worked ? `${record.hours_worked} hrs` : "Absent"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
