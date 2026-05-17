// Language configuration types
export interface LanguageConfig {
  name: string;
  extensions: string[];
  classTypes: string[];
  functionTypes: string[];
  importTypes: string[];
  callTypes: string[];
}

// Language configurations
export const LANGUAGES: Record<string, LanguageConfig> = {
  javascript: {
    name: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs', '.ejs'],
    classTypes: ['class_declaration'],
    functionTypes: ['function_declaration', 'method_definition', 'arrow_function'],
    importTypes: ['import_statement', 'call_expression'],
    callTypes: ['call_expression', 'new_expression']
  },
  typescript: {
    name: 'TypeScript',
    extensions: ['.ts', '.tsx'],
    classTypes: ['class_declaration', 'interface_declaration', 'enum_declaration'],
    functionTypes: ['function_declaration', 'method_definition', 'arrow_function'],
    importTypes: ['import_statement'],
    callTypes: ['call_expression', 'new_expression']
  },
  python: {
    name: 'Python',
    extensions: ['.py', '.pyw'],
    classTypes: ['class_definition'],
    functionTypes: ['function_definition'],
    importTypes: ['import_statement', 'import_from_statement'],
    callTypes: ['call']
  },
  java: {
    name: 'Java',
    extensions: ['.java'],
    classTypes: ['class_declaration', 'interface_declaration'],
    functionTypes: ['method_declaration', 'constructor_declaration'],
    importTypes: ['import_declaration'],
    callTypes: ['method_invocation']
  },
  c: {
    name: 'C',
    extensions: ['.c', '.h'],
    classTypes: [],
    functionTypes: ['function_definition'],
    importTypes: ['preproc_include'],
    callTypes: ['call_expression']
  },
  cpp: {
    name: 'C++',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx'],
    classTypes: ['class_specifier'],
    functionTypes: ['function_definition'],
    importTypes: ['preproc_include'],
    callTypes: ['call_expression']
  },
  go: {
    name: 'Go',
    extensions: ['.go'],
    classTypes: [],
    functionTypes: ['function_declaration', 'method_declaration'],
    importTypes: ['import_declaration'],
    callTypes: ['call_expression']
  },
  rust: {
    name: 'Rust',
    extensions: ['.rs'],
    classTypes: ['struct_item', 'impl_item'],
    functionTypes: ['function_item'],
    importTypes: ['use_declaration'],
    callTypes: ['call_expression']
  },
  ruby: {
    name: 'Ruby',
    extensions: ['.rb'],
    classTypes: ['class'],
    functionTypes: ['method', 'singleton_method'],
    importTypes: [],
    callTypes: ['call']
  },
  swift: {
    name: 'Swift',
    extensions: ['.swift'],
    classTypes: ['class_declaration', 'protocol_declaration'],
    functionTypes: ['function_declaration', 'init_declaration'],
    importTypes: ['import_declaration'],
    callTypes: ['call_expression']
  },
  php: {
    name: 'PHP',
    extensions: ['.php'],
    classTypes: ['class_declaration'],
    functionTypes: ['function_definition', 'method_declaration'],
    importTypes: ['namespace_use_clause'],
    callTypes: ['function_call_expression', 'method_call_expression']
  }
};

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(ext: string): string | null {
  for (const [lang, config] of Object.entries(LANGUAGES)) {
    if (config.extensions.includes(ext)) {
      return lang;
    }
  }
  return null;
}

/**
 * Get language config
 */
export function getLanguageConfig(language: string): LanguageConfig | null {
  return LANGUAGES[language] || null;
}

export default {
  LANGUAGES,
  getLanguageFromExtension,
  getLanguageConfig
};