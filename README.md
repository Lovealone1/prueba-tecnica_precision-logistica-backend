# Precisión Logística - Backend API

<div align="center">
  <img src="https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest">
  <img src="https://img.shields.io/badge/-Swagger-%2385EA2D?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger">
</div>
<br/>

Esta es la implementación técnica del Backend para la prueba de Precisión Logística. Desarrollada en **NestJS** y **PostgreSQL** (mediante Supabase y Prisma ORM), la API no solo cumple rigurosamente con los requerimientos originales del enunciado, sino que fue expandida para garantizar integridad comercial, tolerancia a fallos logísticos y escalabilidad demostrable para retornos de producción.

Para facilitar la revisión de la prueba técnica, el backend ha sido desplegado en Railway y se puede acceder a través del enlace fijado en este repositorio.

La aplicación se encuentra dockerizada para garantizar la consistencia del entorno. El flujo de despliegue utiliza una imagen base de node:22-slim y gestiona automáticamente las migraciones de la base de datos (Prisma) antes del inicio del servidor. 
---

## Valor Agregado y Decisiones Arquitectónicas 

El enunciado original solicitaba un modelo de *Rutás* gestionado únicamente por una placa, el nombre del conductor y una fecha. Para llevar esta prueba a un estándar robusto real, tomé las siguientes decisiones técnicas extra sobre la lógica de negocio:

### 1. Integridad Relacional (Módulo `Drivers`)
Depender puramente de un campo de texto "Nombre" para trazar un conductor es propenso a colisiones fatales (Ej: Dos operarios llamados *"Carlos Pérez"*). 
- Se construyó un módulo anexo e independiente `Drivers` con su propio modelo en base de datos, garantizando unicidad mediante la `Cédula` como índice primario de negocio.
- **Experiencia de Usuario:** Al crear una ruta (método POST), el integrador sigue enviando el simple "Nombre" del conductor. Internamente, el Backend realiza una resolución de texto tolerante a mayúsculas/minúsculas para inferir el UUID y atar relacionalmente ambos registros sin ensuciar la petición.

### 2. Zonas de Destino Reales
Se sustituyó un único punto de entrega por los conceptos `originAddress` y `destinationZone`. En la industria real, una "Ruta" de camión abarca el recorrido por una sección completa geográfica de la ciudad para múltiples repartos, no un único hogar de destino.

### 3. Control Contra Doble Asignación (Colisiones)
Si algún área de logística comete el error humano de despachar un vehículo duplicado, el backend aborta la solicitud y devuelve de respuesta específica un `409 Conflict`. Está estrictamente programado que:
- **Vehículos:** La placa `ABC123` no puede tener dos rutas distintas en exactamente el mismo día.
- **Conductores:** Un mismo conductor tiene terminantemente prohibido asumir doble responsabilidad operacional en un mismo día cronológico, ya sea compartiendo vehículo o migrando a otro. 

### 4. Gestión de Estados Estricta (`PATCH`)
Las transiciones de estado (`PENDING` ➔ `IN_PROGRESS` ➔ `DELIVERED`) están fortificadas a nivel de backend:
- Si se intenta saltar jerarquías y finalizar de golpe una ruta "Pendiente", la API rechaza el cambio: `Cannot complete a route that has never been started.`
- Se contempló el **Reverso por Daños Contemplados**: Permite devolver a `PENDING` si la ruta estaba `IN_PROGRESS` simulando eventualidades de la vida real como daños mecánicos de la flota a media entrega.

---

## Criterios de Evaluación Cubiertos

- **Arquitectura y SRP:** Construído bajo el estándar de `Feature-Modules`. Controladores limpios delegando delegando por completo a Servicios con inyección de dependencias. Endpoints `GET` indexados en Prisma a nivel de motor SQL `@@index([vehiclePlate])`.
- **Validaciones Extremas:** Haciendo uso de `class-validator`, toda vulnerabilidad de estructura muere al borde del framework (Validación exigiendo el estricto formato de placas colombiano por expresiones regulares Regex).
- **Control Universal del Tiempo (Timezones):** Para eludir a los RDBMS de Linux obligando todo a UTC, se usó un `$extends` global sobre el servicio de Prisma que re-intercepta de raíz las inserciones y muta la estampa de tiempo forzando a la zona de Colombia nativamente antes de tocar el modelo.
- **Monitoreo Global (Middlewares):** Implantación clásica de un interceptor general para crear telemetría simulada (Método, URL, Tiempo en Milisegundos de resolución interna, User-Agents y Status Codes).
- **Pruebas Unitarias Integradas:** Pruebas limpias haciendo "Mock" total de memoria de los repositorios de Postgres para verificar la máquina lógica del negocio sin tocar ambientes.
- **OpenAPI Integrado:** Documentación viva y dinámica de los DTOs usando decoradores Swagger nativos.

---

## Pasos para Ejecución Local

1. **Clonar e instalar dependencias:**
```bash
git clone https://github.com/Lovealone1/prueba-tecnica_precision-logistica-backend.git
cd precision-logistica-backend
pnpm install    
```

2. **Variables de Entorno:**
Crea un archivo local `.env` fijando la cadena de conexión de Supabase / Postgres local:
```env
DATABASE_URL="postgresql://"
DIRECT_URL="postgresql://"
PORT="3000"
```

3. **Sincronización del ORM de Prisma:**
```bash
npx prisma db push
npx prisma generate
```

4. **Arrancar Servidor API:**
```bash
pnpm start:dev
```
Servidor desplegado de base escuchará sobre `http://localhost:3000/api`. Podrás acceder al panel entero testeable abriendo `http://localhost:3000/api/docs`.

---

## Pruebas Unitarias (Jest)

El proyecto contiene el cubrimiento de lógica de negocio basica y validación de expresiones regulares aislado:
```bash
pnpm test
```
