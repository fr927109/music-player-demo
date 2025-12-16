import React from "react";
export function Badge({ children, className = "" }) { return <span className={className} style={{padding:'0 6px',borderRadius:8}}>{children}</span>; }
