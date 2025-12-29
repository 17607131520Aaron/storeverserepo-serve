import 'reflect-metadata';
import type { ClassConstructor } from 'class-transformer';

export function useDto<T>(
  dto: ClassConstructor<T>,
): (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
  return function (
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): void {
    Reflect.defineMetadata('dto', dto, descriptor.value as unknown as object);
  };
}
