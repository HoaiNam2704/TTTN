import React, { useState } from "react";
import { useToast } from "@/components/ui/toast";

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;
type FormFieldValue = string | number | boolean | null | undefined;
type ToastableError = {
  message?: string;
  statusCode?: number;
  _toasted?: boolean;
};

export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => ValidationErrors<T>;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends object>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let checkedValue: FormFieldValue = value;
    
    if (type === "checkbox") {
      checkedValue = (e.target as HTMLInputElement).checked;
    }

    setValues((prev) => ({
      ...prev,
      [name]: checkedValue,
    }));

    // Clear validation error when user modifies field
    if (errors[name as keyof T]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    
    setSubmitError(null);
  };

  const handleCustomChange = (name: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    setSubmitError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setSubmitError(null);
    setSubmitSuccess(null);

    // Validate
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        addToast({
          type: "warning",
          message: "Please check the information you entered.",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      const submitError = err as ToastableError;
      const message = submitError.message || "Something went wrong. Please try again.";

      setSubmitError(message);
      // If the error was not already handled by onSubmit, toast it here
      if (!submitError._toasted) {
        addToast({
          type: "error",
          message,
          statusCode: submitError.statusCode,
        });
        submitError._toasted = true;
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    submitSuccess,
    setValues,
    setErrors,
    setSubmitError,
    setSubmitSuccess,
    handleChange,
    handleCustomChange,
    handleSubmit,
    resetForm,
  };
}
