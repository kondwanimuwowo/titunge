import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmployeeForm from "@/components/employees/EmployeeForm";

export default async function NewEmployeePage() {
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
          <h1 className="text-2xl font-bold">Add Employee</h1>
          <p className="text-sm text-muted-foreground">Hire a new team member</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <EmployeeForm />
      </div>
    </div>
  );
}
