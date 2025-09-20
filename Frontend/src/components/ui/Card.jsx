const Card = ({
  children,
  className = "",
  padding = "p-6",
  shadow = "shadow-sm",
  hover = false,
  ...props
}) => {
  const baseClasses = "bg-white border border-gray-200 rounded-lg";
  const hoverClasses = hover
    ? "hover:shadow-md transition-shadow duration-200"
    : "";
  const classes =
    `${baseClasses} ${shadow} ${padding} ${hoverClasses} ${className}`.trim();

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => (
  <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
    {children}
  </div>
);

const CardBody = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ children, className = "" }) => (
  <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;
