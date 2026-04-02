const DoubleArrow = ({ size = 21, color = "black", className = "" }) => (
  <svg
    width={size}
    height={(size * 21) / 16}
    viewBox="0 0 16 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ color }}
  >
    <path
      fill="currentColor"
      d="m8.928 10.612 6.64 6.64a1.167 1.167 0 0 1 0 1.655l-1.103 1.104a1.167 1.167 0 0 1-1.655 0l-4.712-4.702-4.707 4.707a1.167 1.167 0 0 1-1.655 0L.627 18.912a1.167 1.167 0 0 1 0-1.655l6.641-6.64a1.169 1.169 0 0 1 1.66-.005Zm-1.66-9.375-6.64 6.64a1.167 1.167 0 0 0 0 1.655l1.103 1.104a1.167 1.167 0 0 0 1.655 0l4.707-4.707 4.707 4.707a1.167 1.167 0 0 0 1.656 0l1.103-1.104a1.167 1.167 0 0 0 0-1.655l-6.64-6.64a1.161 1.161 0 0 0-1.65 0Z"
    />
  </svg>
);

export default DoubleArrow;