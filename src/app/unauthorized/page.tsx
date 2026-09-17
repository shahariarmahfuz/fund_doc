"use client";

import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRbac } from "@/components/providers/rbac-provider";

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleName = searchParams.get("module");
  const action = searchParams.get("action");
  const { can, permissions } = useRbac();
  const hasDashboardAccess = true;

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
      <div className="bg-red-50 text-red-500 p-5 rounded-full mb-6 shadow-sm border border-red-100">
        <ShieldAlert className="w-16 h-16" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Unauthorized Access</h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        You do not have permission to access this page.</p>

      {(moduleName || action) && (
        <div className="bg-white rounded-xl p-6 mb-10 w-full max-w-md text-center border shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">Requested Permission</p>
          <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border">
            {moduleName && <span>Module: <strong className="text-primary">{moduleName}</strong></span>}
            {moduleName && action && <span>•</span>}
            {action && <span>Action: <strong className="text-primary">{action}</strong></span>}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => router.back()}
          className="flex items-center w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back</Button>
        {hasDashboardAccess && (
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/" className="flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Back to Dashboard</Link>
          </Button>
        )}
      </div>

    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[75vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  );
}
