# جزيرة النجاة

لعبة باتل رويال ثلاثية الأبعاد على جزيرة: الفرق تقفز بالمظلة، تجمع الغنائم، والعاصفة تضيق. تعمل في المتصفح على الكمبيوتر والهاتف.

> **الحالة:** البنية التحتية والأمان جاهزان. الجزيرة والشخصيات والأسلحة لم تُضف بعد.

## التشغيل على جهازك

تحتاج [Node.js](https://nodejs.org) نسخة 20 أو أحدث.

```bash
cd Ahmed
npm install
cp server/.env.example server/.env
npm run dev:server      # الخادم على المنفذ 8080
npm run dev:client      # اللعبة على http://localhost:5173
```

## الأوامر

| الأمر | ماذا يفعل |
|---|---|
| `npm test` | يشغّل اختبارات الأمان والحركة |
| `npm run typecheck` | يفحص الكود من الأخطاء |
| `npm run build` | يجهّز اللعبة للنشر |
| `npm run audit:prod` | يفحص المكتبات من الثغرات |

## الشرح

- [بنية المشروع](docs/ARCHITECTURE.md)
- [الأمان](docs/SECURITY.md)
- [أين تضع الشخصيات](assets/characters/README.md) و[الخرائط](assets/maps/README.md)
