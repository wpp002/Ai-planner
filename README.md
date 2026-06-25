# AI Smart Travel Planner

Plan Smarter. Travel Better.

แพลตฟอร์มวางแผนทริปและจัดการงบประมาณด้วย AI แยกเป็น `backend` (NestJS + Prisma + PostgreSQL) และ `frontend` (Next.js + TypeScript + Tailwind CSS)

## Run Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run start
```

Swagger: `http://localhost:4000/api`

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000`

## Run PostgreSQL With Docker

ถ้าใช้ Docker ให้เปิด Docker Desktop ก่อน แล้วรันจาก root project:

```bash
docker compose up -d postgres
```

ค่า database เริ่มต้นตรงกับ `backend/.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_travel_planner?schema=public"
```

จากนั้น migrate และรัน backend:

```bash
cd backend
npx prisma migrate dev
npm run start
```

หยุด database:

```bash
docker compose down
```

ลบข้อมูล database ทั้งหมด:

```bash
docker compose down -v
```

## Environment

คัดลอกไฟล์ตัวอย่างแล้วแก้ค่าให้ตรงเครื่องของคุณ:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```
