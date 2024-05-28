import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'integerOnly'
})
export class IntegerOnlyPipe implements PipeTransform {

  transform(value: number): number | null {
    if (value === null || value === undefined || !isFinite(value)) {
      return value;
    }
    return Math.trunc(value);
  }

}
