// Tipos para validação de formulários

// Resultado de validação
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Regras de validação
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
  validate?: (value: any) => boolean | string;
}

// Configuração de validação para um campo
export interface FieldValidationConfig {
  [fieldName: string]: ValidationRule;
}

// Funções de validação comuns
export const validationFunctions = {
  required: (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null;
  },
  
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },
  
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },
  
  pattern: (value: string, regex: RegExp): boolean => {
    return regex.test(value);
  },
  
  password: (value: string): boolean => {
    // Pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(value);
  }
};