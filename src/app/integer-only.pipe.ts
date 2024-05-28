import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'integerOnly'
})
export class IntegerOnlyPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
