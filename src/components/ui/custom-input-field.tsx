import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

type CustomInputFieldProps = Omit<React.ComponentProps<"input">, "size"> & {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  invalid?: boolean;
  wrapperClassName?: string;
  inputContainerClassName?: string;
};

const CustomInputField = React.forwardRef<HTMLInputElement, CustomInputFieldProps>(
  (
    {
      id,
      label,
      helperText,
      errorText,
      invalid,
      className,
      wrapperClassName,
      inputContainerClassName,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const showError = Boolean(invalid || errorText);

    return (
      <div className={cn("space-y-2", wrapperClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-[24px] leading-none font-medium tracking-tight text-[#47608b]"
          >
            {label}
          </label>
        ) : null}

        <div
          className={cn(
            "group relative overflow-hidden bg-[#eceff5]",
            inputContainerClassName,
          )}
        >
          <InputPrimitive
            ref={ref}
            id={inputId}
            data-slot="custom-input-field"
            aria-invalid={showError}
            className={cn(
              "h-16 w-full bg-transparent px-4 text-lg text-foreground outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-60",
              className,
            )}
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[#4b6998] transition-colors group-focus-within:bg-[#2f5792]",
              showError && "bg-destructive group-focus-within:bg-destructive",
            )}
          />
        </div>

        {showError ? (
          <p className="text-[20px] leading-tight text-destructive">{errorText}</p>
        ) : helperText ? (
          <p className="text-[20px] leading-tight text-[#565f6e]">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

CustomInputField.displayName = "CustomInputField";

export { CustomInputField };
