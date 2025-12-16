import React from "react";
export function Button({ children, className = "", variant, size, ...props }) {
  return (
    <button {...props} className={`inline-flex items-center gap-2 px-3 py-1 rounded ${className}`}> 
      {children}
    </button>
  );
}
