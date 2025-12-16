import React from "react";
export function Card({ children, className = "" }) {
  return <div className={`p-3 rounded ${className}`}>{children}</div>;
}
export const CardHeader = ({ children, className = "" }) => <div className={className}>{children}</div>;
export const CardContent = ({ children, className = "" }) => <div className={className}>{children}</div>;
export const CardTitle = ({ children, className = "" }) => <h3 className={className}>{children}</h3>;
