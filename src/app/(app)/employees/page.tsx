import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployees, getTodayAttendance } from "@/lib/data/employees";
import { PageHeader } from "@/components/layout/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import EmployeeList from "@/components/employees/EmployeeList";
import TimeClockMetric from "@/components/employees/TimeClockMetric";
import { Users, Clock, Check, UserX } from "lucide-react";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [employees, todayAttendance] = await Promise.all([
    getEmployees(),
    getTodayAttendance(),
  ]);

  const activeCount = employees.filter((e) => e.active).length;
  const inactiveCount = employees.length - activeCount;
  const clockedInCount = todayAttendance.filter((a) => a.clock_in && !a.clock_out).length;
  const totalHours = todayAttendance.reduce(
    (sum, a) => sum + (parseFloat(String(a.hours_worked || 0))),
    0
  );

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Team Management"
        description="Monitor employee attendance and assignments"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <TimeClockMetric />
        </div>
        <StatsCard
          title="Total Employees"
          value={employees.length.toString()}
          icon={<Users size={18} />}
          color="blue"
          delay={0.05}
        />
        <StatsCard
          title="Active"
          value={activeCount.toString()}
          icon={<Users size={18} />}
          color="green"
          delay={0.1}
        />
        <StatsCard
          title="Clocked In Today"
          value={clockedInCount.toString()}
          icon={<Clock size={18} />}
          color="purple"
          delay={0.2}
        />
        <StatsCard
          title="Hours Today"
          value={totalHours.toFixed(1)}
          icon={<Check size={18} />}
          color="blue"
          delay={0.3}
        />
      </div>

      {/* Employee List */}
      <EmployeeList initialEmployees={employees} initialAttendance={todayAttendance} />
    </div>
  );
}
