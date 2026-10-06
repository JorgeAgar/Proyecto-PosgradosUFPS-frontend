import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "../assets/icons";

interface InputFieldProps {
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function InputField({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  disabled = false,
  onKeyDown,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative w-full">
      <input
        id={id}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`ufps-input p-3 ${isPassword ? "pr-12" : "pr-3"} w-full outline-none bg-transparent`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          tabIndex={-1}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? (
            <EyeIcon className="w-[18px] h-[18px]" strokeWidth="1.8" />
          ) : (
            <EyeSlashIcon className="w-[18px] h-[18px]" strokeWidth="1.8" />
          )}
        </button>
      )}
    </div>
  );
}
