import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEmployeeById } from "@/lib/data/employees";
import { getBusinessContext } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import EmployeeForm from "@/components/employees/EmployeeForm";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { businessId } = await getBusinessContext();
  const employee = await getEmployeeById(businessId, id);
  if (!employee) notFound();

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          {/* @ts-ignore */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Employee</h1>
          <p className="text-sm text-muted-foreground">{employee.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <EmployeeForm employee={employee} />
      </div>
    </div>
  );
}
