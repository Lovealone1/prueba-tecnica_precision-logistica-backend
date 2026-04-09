import { validate } from 'class-validator';
import { CreateRouteDto } from './create-route.dto';

describe('CreateRouteDto (Business Rules)', () => {
  let dto: CreateRouteDto;

  beforeEach(() => {
    dto = new CreateRouteDto();
    // Proveemos los campos válidos por defecto para aislar la prueba de la placa
    dto.driverName = 'Carlos Pérez';
    dto.originAddress = 'Bodega Bogotá';
    dto.destinationZone = 'Zona Norte';
    dto.scheduledDate = '10/10/2026';
  });

  describe('Formato de placa colombiana', () => {
    it('debería aceptar un formato estricto de 3 letras seguidas de 3 números (Ej: ABC123)', async () => {
      dto.vehiclePlate = 'ABC123';
      const errors = await validate(dto);
      expect(errors.length).toBe(0); // Cero errores significa que pasó la validación limpiamente
    });

    it('debería aceptar placas en minúsculas delegando al transformador (ej: xyz987)', async () => {
      dto.vehiclePlate = 'xyz987';
      const errors = await validate(dto);
      expect(errors.length).toBe(0); // Cero errores significa que pasó la validación limpiamente
    });

    it('debería lanzar error de validación si inicia con números (ej: 123ABC)', async () => {
      dto.vehiclePlate = '123ABC';
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('vehiclePlate');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('debería lanzar error de validación si tiene 4 letras (ej: ABCD12)', async () => {
      dto.vehiclePlate = 'ABCD12';
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('debería lanzar error de validación si tiene menos caracteres geométricos (ej: AB12)', async () => {
      dto.vehiclePlate = 'AB12';
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
