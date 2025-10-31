"use client"

import MaintenanceGame from "@/components/MaintenanceGame";

export default function MaintenancePage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-gray-100 via-indigo-50 to-white dark:from-[#0b1020] dark:via-[#0f1630] dark:to-[#0b1020] text-gray-800 dark:text-gray-100 flex flex-col">
      <div className="w-full text-center pt-6 px-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
          <span className="align-middle mr-1">🚧</span>
          <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 bg-clip-text text-transparent align-middle">My portfolio's getting a little makeover!</span>
        </h1>
        <div className="mx-auto mb-3 h-px w-28 bg-indigo-400/60 rounded-full"></div>
        <p className="text-sm sm:text-base md:text-lg mb-2 text-gray-700 dark:text-gray-300">
          While I'm working on some major updates, this page will be taking a short break.
          <br />
          In the meantime, feel free to play around with this little game I've added below! 🎮
        </p>
      </div>
      <div className="flex-1 min-h-0 w-full px-6 pb-6">
        <MaintenanceGame />
      </div>
    </div>
  );
}
