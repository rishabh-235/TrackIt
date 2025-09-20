const LoadingSpinner = ({
  size = "md",
  color = "blue",
  className = "",
  ...props
}) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const colors = {
    blue: "text-blue-600",
    gray: "text-gray-600",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
    pink: "text-pink-600",
    white: "text-white",
  };

  const classes = `animate-spin ${sizes[size]} ${colors[color]} ${className}`;

  return (
    <svg className={classes} fill="none" viewBox="0 0 24 24" {...props}>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const LoadingOverlay = ({ show, children, message = "Loading..." }) => {
  if (!show) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

LoadingSpinner.Overlay = LoadingOverlay;

export default LoadingSpinner;
