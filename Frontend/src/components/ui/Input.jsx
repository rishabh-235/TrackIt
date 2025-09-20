import { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      type = "text",
      label,
      error,
      helperText,
      required = false,
      disabled = false,
      className = "",
      placeholder,
      ...props
    },
    ref
  ) => {
    const inputClasses = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}
    ${className}
  `.trim();

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
