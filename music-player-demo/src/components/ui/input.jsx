import React from "react";
export function Input(props) {
  return <input {...props} className={props.className || "rounded px-2 py-1"} />;
}
