"use client"

import MaintenanceGame from "@/components/MaintenanceGame";

export default function MaintenancePage() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-gray-100 via-indigo-50 to-white dark:from-[#0b1020] dark:via-[#0f1630] dark:to-[#0b1020] text-gray-800 dark:text-gray-100 flex flex-col">
      <div className="w-full text-center pt-1 px-4">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-1">
          <span className="align-middle mr-1">🚧</span>
          <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 bg-clip-text text-transparent align-middle">Temporarily offline for updates.</span>
        </h1>
      </div>
      <div className="flex-1 min-h-0 w-full px-4 sm:px-6 pb-2">
        <MaintenanceGame />
      </div>
    </div>
  );
}
