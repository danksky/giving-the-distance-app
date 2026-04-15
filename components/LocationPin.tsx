type LocationPinProps = {
  className?: string;
};

export default function LocationPin({
  className = "w-5 h-5",
}: LocationPinProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 -960 960 960"
    >
      <path d="M480-99q-75-68-132-125.5t-95-107Q215-381 197.5-423T180-500q0-125 87.5-212.5T480-800q125 0 212.5 87.5T780-500q0 35-17.5 77T707-331.5q-38 49.5-95 107T480-99Zm0-281q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z" />
    </svg>
  );
}
