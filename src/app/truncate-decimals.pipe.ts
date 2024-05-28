import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateDecimals'
})
export class TruncateDecimalsPipe implements PipeTransform {

  transform(value: number, decimalPlaces: number): number {
    if (!isFinite(value)) {
      return value;
    }
    const factor = Math.pow(10, decimalPlaces);
    return Math.floor(value * factor) / factor;
  }

}
