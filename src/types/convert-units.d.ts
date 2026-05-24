/**
 * @fileoverview Type declarations for convert-units v2.x.
 * @module types/convert-units
 */

declare module 'convert-units' {
  interface Converter {
    from(unit: string): Converter;
    measures(): string[];
    possibilities(measure?: string): string[];
    to(unit: string): number;
  }

  function convert(value?: number): Converter;

  export default convert;
}
