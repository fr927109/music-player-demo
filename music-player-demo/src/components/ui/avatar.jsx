import React from "react";
export function Avatar({ children, className = "" }) {
  return <div className={className} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:8}}>{children}</div>;
}
export function AvatarFallback({ children }) { return <div>{children}</div>; }
