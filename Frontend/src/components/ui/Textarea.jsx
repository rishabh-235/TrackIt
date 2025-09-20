import { forwardRef } from "react";

const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      disabled = false,
      className = "",
      placeholder,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaClasses = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    resize-vertical
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
        <textarea
          ref={ref}
          className={textareaClasses}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
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

Textarea.displayName = "Textarea";

export default Textarea;
