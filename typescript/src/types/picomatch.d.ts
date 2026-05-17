declare module 'picomatch' {
  export function picomatch(pattern: string, options?: object): (str: string) => boolean;
  export function globToRegex(pattern: string, options?: object): RegExp;
}