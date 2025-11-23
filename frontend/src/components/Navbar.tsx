import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex justify-end p-4">
      <div className="relative">
        {/* Avatar Button */}
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl hover:opacity-80 transition"
        >
          👤
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-3 w-40 bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-xl">
              Profile
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
              My Dashboard
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-xl">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
