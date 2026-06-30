# Product Requirements Document (PRD)

## Product Name

**AI Smart Travel Planner**

## Version

1.0

## Document Owner

Product / Full Stack Development Team

## Summary

AI Smart Travel Planner คือแพลตฟอร์มวางแผนทริปท่องเที่ยวและจัดการงบประมาณด้วย AI สำหรับผู้ใช้ที่ต้องการสร้างแผนเที่ยวแบบรวดเร็ว ใช้งานง่าย และปรับตามงบประมาณจริงได้ ระบบช่วยสร้าง itinerary รายวัน แนะนำสถานที่ท่องเที่ยว แนะนำที่พักใกล้สถานที่ที่ผู้ใช้สนใจ จัดการค่าใช้จ่ายจริง และให้ผู้ดูแลระบบติดตามผู้ใช้ ทริป สถานะ AI และข้อมูลระบบได้

## Problem Statement

ผู้ใช้จำนวนมากต้องใช้เวลาหาข้อมูลทริปจากหลายแหล่ง เช่น สถานที่เที่ยว ร้านอาหาร คาเฟ่ โรงแรม งบประมาณ และแผนรายวัน ทำให้การวางแผนซับซ้อนและควบคุมค่าใช้จ่ายยาก โดยเฉพาะเมื่อมีหลายคนหรือมีงบจำกัด

ระบบนี้จะแก้ปัญหาโดยรวมการวางแผนทริป การค้นพบสถานที่ การแนะนำที่พัก และการจัดการงบประมาณไว้ในแพลตฟอร์มเดียว พร้อมใช้ AI ช่วยสร้างแผนและให้คำแนะนำ

## Goals

- ให้ผู้ใช้สร้างทริปพร้อม itinerary รายวันได้ด้วย AI
- ให้ผู้ใช้เห็นงบประมาณคาดการณ์และค่าใช้จ่ายจริง
- ให้ผู้ใช้ค้นพบสถานที่ท่องเที่ยว ร้านอาหาร คาเฟ่ อีเวนต์ และ hidden gems
- ให้ระบบแนะนำที่พักใกล้สถานที่เที่ยวที่ผู้ใช้เลือก
- ให้ผู้ใช้บันทึกสถานที่ที่สนใจและนำไปใช้สร้างทริปได้
- ให้ admin/support ตรวจสอบผู้ใช้ ทริป ระบบ AI และข้อมูลภาพรวมได้
- รองรับภาษาไทยและอังกฤษใน UI หลัก

## Non-Goals

- ไม่รับจองโรงแรมหรือชำระเงินในระบบเวอร์ชันแรก
- ไม่ยืนยันราคาโรงแรมหรือ availability แบบ real-time
- ไม่ทำ social trip sharing ในเวอร์ชันแรก
- ไม่รองรับ mobile app native ในเวอร์ชันแรก

## Target Users

### Traveler / User

ผู้ใช้ทั่วไปที่ต้องการวางแผนทริป สร้างแผนเที่ยว ควบคุมงบ และบันทึกสถานที่ที่สนใจ

### Admin

ผู้ดูแลระบบที่สามารถจัดการผู้ใช้ เปลี่ยน role ลบผู้ใช้ ดูข้อมูลทริปทั้งหมด ดู analytics และตรวจสอบ system health

### Support

ทีมช่วยเหลือผู้ใช้ที่สามารถดูข้อมูลผู้ใช้ ทริป และ analytics แบบ read-only แต่ไม่สามารถลบผู้ใช้ เปลี่ยน role หรือลบทริปได้

## Key Features

### 1. Authentication

- Register
- Login
- JWT authentication
- Protected routes
- Role-based access control: `USER`, `ADMIN`, `SUPPORT`

### 2. Trip Management

- สร้างทริปใหม่
- ดูรายการทริปของผู้ใช้
- ดูรายละเอียดทริป
- แก้ไขข้อมูลทริป
- ลบทริป สำหรับ user เจ้าของทริป ยกเว้น role `SUPPORT`
- แสดง itinerary รายวัน
- เพิ่ม แก้ไข และลบกิจกรรมในทริป

### 3. AI Trip Planner

ผู้ใช้กรอกข้อมูล:

- Destination
- Start date
- End date
- Number of days
- Number of people
- Total budget
- Travel style
- Additional notes

ระบบสร้าง:

- Trip title
- Summary
- Daily itinerary
- Activities timeline
- Estimated cost by category
- Budget status
- Saving tips

### 4. Travel Discovery Search

ช่องค้นหาบน header รองรับ:

- ค้นหาทริปของผู้ใช้
- ค้นหาสถานที่/ไอเดียทริปอื่น แม้ยังไม่ได้สร้างหรือบันทึกทริป
- Alias ไทย/อังกฤษ เช่น พัทยา, Pattaya, ชลบุรี
- ถ้าไม่เจอทริปเดิม ระบบสามารถพาไป Create Trip พร้อมเติม destination จากคำค้นหา

### 5. Trending Destinations & Travel Discovery

หน้า Dashboard และ Create Trip มีส่วนแนะนำ:

- Trending Right Now
- Popular Places This Season
- Seasonal Recommendations
- Recommended For You
- Hidden Gems
- Popular Nearby Attractions
- Travel Inspiration

แต่ละการ์ดแสดง:

- Cover image
- Place name
- Category
- Trend score
- Description
- Estimated budget
- Save button
- Add to Trip button

### 6. Smart Stay Recommendations

ระบบแนะนำที่พัก/โรงแรมให้ผู้ใช้เลือกแบบ optional

พฤติกรรมหลัก:

- เมื่อผู้ใช้กรอก destination แล้ว ระบบเริ่มแนะนำที่พัก
- เมื่อผู้ใช้กด Add สถานที่เที่ยว ระบบจะใช้สถานที่นั้นเป็น landmark
- ระบบแนะนำที่พักใกล้สถานที่เที่ยวที่เลือก
- แสดงเป็น horizontal carousel แถวเดียว เลื่อนซ้าย-ขวาได้
- ผู้ใช้เลือกหรือไม่เลือกที่พักก็ได้
- ถ้ากด Use This Stay ระบบเพิ่มข้อมูลที่พักลง Additional Notes

ข้อมูลในการ์ด:

- Hotel name
- Area
- Category เช่น Budget Stay, Best Value, Near Attractions, Family Friendly, Luxury Pick
- Estimated nightly price
- Rating
- Best for
- Distance to highlights
- Reason
- Use This Stay button

ข้อจำกัด:

- ราคาเป็น estimated nightly price
- ระบบไม่ยืนยัน availability หรือราคาจริงแบบ real-time

### 7. Budget Management

- แสดงงบประมาณรวม
- แสดงค่าใช้จ่ายคาดการณ์แยกหมวด
- เพิ่มค่าใช้จ่ายจริง
- แก้ไขค่าใช้จ่าย
- ลบค่าใช้จ่าย
- คำนวณค่าใช้จ่ายจริงรวม
- แจ้งเตือนเมื่อเกินงบ
- แสดง budget chart

### 8. AI Budget Optimizer

หากงบประมาณเกิน ระบบควรแนะนำวิธีลดค่าใช้จ่าย เช่น:

- เปลี่ยนที่พัก
- ลดกิจกรรมเสียค่าเข้า
- ปรับวิธีเดินทาง
- เลือกร้านอาหารราคาประหยัด

### 9. Saved Places

- บันทึกสถานที่จาก discovery cards
- ดูประวัติสถานที่ที่บันทึกไว้
- เพิ่มสถานที่ที่บันทึกลงทริป

### 10. Export PDF

- Export แผนทริปเป็น PDF
- รองรับภาษาไทยด้วย font ที่แสดงผล UTF-8 ได้ถูกต้อง

### 11. Admin Console

Admin เห็นเมนู:

- Admin Dashboard
- Users
- All Trips
- Analytics
- Logout

Admin capabilities:

- ดูจำนวนผู้ใช้ ทริป ค่าใช้จ่าย saved places และ AI fallback
- ดู recent activity / audit log
- ดู AI usage monitor
- ดู system health
- ดู users ทั้งหมด
- ดู user detail
- เปลี่ยน role
- ลบ user
- ดู all trips
- ดู trip detail ของ user
- filter/search users และ trips
- ดู charts เช่น user growth, trips created, expenses by category, top destinations, users by role

### 12. Support Role

Support เห็นข้อมูล admin/support area ได้แบบ read-only

Support ทำได้:

- ดู users
- ดู user detail
- ดู all trips
- ดู trip detail
- ดู analytics

Support ห้าม:

- Delete user
- Change role
- Delete trip

## User Flows

### Flow 1: Register/Login

1. ผู้ใช้สมัครสมาชิก
2. ระบบ hash password ด้วย bcrypt
3. ผู้ใช้ login
4. ระบบออก JWT token
5. ผู้ใช้เข้า protected pages ได้

### Flow 2: Generate Trip

1. ผู้ใช้ไปหน้า Create Trip
2. กรอก destination, date, people, budget, style
3. ระบบแสดงสถานที่แนะนำ
4. ผู้ใช้เลือกสถานที่ที่สนใจ
5. ระบบแนะนำที่พักใกล้สถานที่ที่เลือก
6. ผู้ใช้เลือกที่พักหรือข้ามได้
7. ผู้ใช้กด Generate Trip
8. AI หรือ fallback generator สร้างแผนทริป
9. ระบบบันทึก trip, trip days, activities, budget ลง PostgreSQL
10. ผู้ใช้ถูกพาไปหน้า Trip Detail

### Flow 3: Manage Budget

1. ผู้ใช้เปิดหน้า Budget หรือ Expenses
2. เพิ่มค่าใช้จ่ายจริง
3. ระบบคำนวณ actual spent
4. ระบบแสดง remaining budget หรือ over budget

### Flow 4: Admin Review

1. Admin login
2. เปิด Admin Dashboard
3. ดู stats, audit log, AI usage, health
4. เข้า Users หรือ All Trips
5. ค้นหา/filter ข้อมูล
6. เปิด detail page เพื่อตรวจสอบ

## Functional Requirements

### Authentication

- ระบบต้องรองรับ register/login
- ระบบต้องใช้ JWT สำหรับ protected APIs
- ระบบต้อง hash password ด้วย bcrypt
- ระบบต้องแยกสิทธิ์ตาม role

### AI Planner

- ระบบต้องเรียก AI provider ผ่าน backend เท่านั้น
- ระบบต้องบังคับให้ AI ตอบเป็น JSON
- หาก AI quota หมดหรือ error ระบบต้องใช้ fallback generator
- ระบบต้อง log AI usage success/fallback/error

### Trip

- User ต้องเห็นเฉพาะทริปของตัวเอง
- Admin/Support สามารถดู trip detail ในมุม moderation ได้
- Activity ต้องเพิ่ม แก้ไข ลบได้

### Hotel Recommendation

- ระบบต้องรับ destination และ optional landmarks
- ระบบต้องแนะนำที่พักตาม destination, budget, people, style
- ถ้ามี landmarks ต้อง prioritize ที่พักใกล้ landmarks
- UI ต้องแสดงแบบ horizontal carousel
- UI ต้องรองรับภาษาไทย/อังกฤษ

### Admin

- Admin เท่านั้นที่เปลี่ยน role และลบ user ได้
- Support ต้องถูก block ทั้ง UI และ backend
- Audit log ต้องบันทึก action สำคัญ

## Non-Functional Requirements

### Performance

- หน้า Dashboard และ Create Trip ควรโหลดภายใน 3 วินาทีในสภาพแวดล้อม local/dev
- AI requests ควรมี fallback เมื่อ provider ล้มเหลว

### Security

- ไม่เก็บ API key ใน frontend
- ไม่ commit `.env`
- ใช้ JWT guard
- ตรวจ owner ของ trip ก่อนอ่าน/แก้ไข/ลบ
- Role permission ต้อง enforce ที่ backend

### Reliability

- หาก Gemini/OpenAI ใช้งานไม่ได้ ระบบยังสร้างทริปและ discovery fallback ได้
- Database migration ต้องเก็บใน Prisma migrations

### Accessibility

- ปุ่มสำคัญควรมี text label
- คอนทราสต์ควรอ่านง่าย
- UI ต้องไม่ล้นหรือซ้อนทับบน desktop/mobile

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Shadcn-style UI components
- Axios
- Recharts
- Framer Motion

### Backend

- NestJS
- TypeScript
- REST API
- Prisma ORM
- JWT Authentication
- Swagger API Documentation

### Database

- PostgreSQL
- Docker Compose for local database

### AI

- Gemini API / OpenAI API
- Fallback generator

## Data Models

Core models:

- User
- Trip
- TripDay
- Activity
- Budget
- Expense
- SavedPlace
- AuditLog
- AiUsageLog

## API Overview

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`

### Trips

- `POST /trips`
- `GET /trips`
- `GET /trips/:id`
- `PATCH /trips/:id`
- `DELETE /trips/:id`

### AI Planner

- `POST /ai-planner/generate-trip`
- `POST /ai-planner/optimize-budget`
- `POST /ai-planner/discover`
- `POST /ai-planner/hotels`

### Activities

- `POST /activities`
- `PATCH /activities/:id`
- `DELETE /activities/:id`

### Expenses

- `POST /expenses`
- `GET /expenses/trip/:tripId`
- `PATCH /expenses/:id`
- `DELETE /expenses/:id`

### Budgets

- `GET /budgets/trip/:tripId`
- `PATCH /budgets/:id`

### Admin

- `GET /admin/stats`
- `GET /admin/users`
- `GET /admin/users/:id`
- `PATCH /admin/users/:id/role`
- `DELETE /admin/users/:id`
- `GET /admin/trips`
- `GET /admin/trips/:id`
- `GET /admin/analytics`
- `GET /admin/audit-logs`
- `GET /admin/ai-usage`
- `GET /admin/health`

## Success Metrics

- ผู้ใช้สามารถสร้างทริปสำเร็จได้ภายใน 1-2 นาที
- AI fallback ทำงานเมื่อ provider quota หมด
- ผู้ใช้สามารถเพิ่มค่าใช้จ่ายจริงและเห็นงบคงเหลือได้
- ผู้ใช้สามารถเลือกสถานที่และเห็นที่พักใกล้เคียงได้
- Admin สามารถตรวจสอบ user/trip/AI usage ได้จาก dashboard

## Risks

- AI provider quota หมด ทำให้ผลลัพธ์ไม่หลากหลายเท่า AI จริง
- ราคาที่พักไม่ใช่ real-time อาจไม่ตรงกับราคาจองจริง
- ข้อมูลสถานที่จาก fallback อาจเป็นแนว recommendation ไม่ใช่ข้อมูล live
- PDF ภาษาไทยต้องพึ่ง font ที่รองรับ Unicode

## Future Enhancements

- เชื่อม Google Places API สำหรับสถานที่จริง
- เชื่อม Booking/Agoda affiliate API สำหรับโรงแรมจริง
- เพิ่ม map view
- เพิ่ม collaborative trip planning
- เพิ่ม notification system
- เพิ่ม support ticket system
- เพิ่ม trip sharing public link
- เพิ่ม payment/subscription สำหรับ premium AI planning
