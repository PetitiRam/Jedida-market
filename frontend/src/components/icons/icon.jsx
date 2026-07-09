import React from "react";

const PATHS = {
  heart: "M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4c2-.3 3.7.7 4.5 2.2C10.8 4.7 12.5 3.7 14.5 4 18 4.5 19.5 8 22 11.7 19.5 16.4 12 21 12 21z",

  heartFilled:
    "M12 21s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4c2-.3 3.7.7 4.5 2.2C10.8 4.7 12.5 3.7 14.5 4 18 4.5 19.5 8 22 11.7 19.5 16.4 12 21 12 21z",

  message:
    "M21 11.5a8.5 8.5 0 1 1-3.2-6.6A8.5 8.5 0 0 1 21 11.5ZM8 11h8M8 15h5",

  factory:
    "M2 20h20V10l-5 4V10l-5 4V10l-5 4v-4l-3 3v7zM4 8V4h2v2h2V4h2v4",

  checkShield:
    "M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zM9 12l2 2 4-4",

  mapPin:
    "M12 21s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",

  truck:
    "M3 7h11v8H3zM14 10h4l3 3v2h-7zM6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",

  shield:
    "M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z",

  star:
    "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z",

  starFilled:
    "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z",

  share:
    "M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13",

  document:
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6",

  box:
    "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
};

export default function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className = "",
  fill = "none",
}) {
  const path = PATHS[name];

  if (!path) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}
