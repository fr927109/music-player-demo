import React from "react";
export function Dialog({ children, open = true }) {
  return <div>{children}</div>;
}
export function DialogContent({ children, className = "" }) { return <div className={className}>{children}</div>; }
export function DialogHeader({ children }) { return <div>{children}</div>; }
export function DialogTitle({ children }) { return <div>{children}</div>; }
