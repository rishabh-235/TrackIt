import { forwardRef } from "react";

const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      disabled = false,
      className = "",
      placeholder = "Select an option",
      options = [],
      ...props
    },
    ref
  ) => {
    const selectClasses = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500
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
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
