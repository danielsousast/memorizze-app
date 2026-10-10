// expo-router 57 registers these matchers at runtime (`expo-router/testing-library`)
// but does not ship their types.
declare namespace jest {
  interface Matchers<R> {
    toHavePathname(pathname: string): R;
    toHavePathnameWithParams(pathname: string): R;
    toHaveSegments(segments: string[]): R;
    toHaveSearchParams(params: Record<string, string | string[]>): R;
  }
}
