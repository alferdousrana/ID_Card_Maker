# আইডি কার্ড মেকার (ID Card Maker)

স্কুল-কলেজের শিক্ষার্থীদের আইডি কার্ড বানিয়ে A4 পেজে একসাথে প্রিন্ট করার ছোট ওয়েব অ্যাপ।
কোনো সার্ভার বা ডাটাবেস লাগে না। সব তথ্য ব্যবহারকারীর নিজের ব্রাউজারে (IndexedDB) জমা থাকে।

## ফাইল
- `index.html` – পেজ
- `style.css` – ডিজাইন
- `script.js` – সব কাজ
- `assets/logo.png` – ডিফল্ট লোগো (না থাকলেও অ্যাপ চলবে)

## GitHub Pages এ চালু করা
1. GitHub এ নতুন repository খুলুন (যেমন `id-card-maker`), Public রাখুন।
2. **Add file → Upload files** দিয়ে এই ফোল্ডারের সব ফাইল (assets ফোল্ডারসহ) আপলোড করে Commit করুন।
3. **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)`** → Save।
4. এক-দুই মিনিট পর লিংক পাবেন: `https://<username>.github.io/id-card-maker/`

## JSON নমুনা
```json
[
  { "name": "সাদিয়া ইসলাম", "father": "মোঃ রফিকুল ইসলাম", "mother": "মোসাঃ রাশিদা বেগম",
    "class": "দ্বাদশ", "group": "মানবিক", "roll": "220", "session": "২০২৫-২০২৬", "id": "59313" }
]
```

## প্রিন্টের নিয়ম
Margins: None, Scale: 100%, Background graphics: চালু।
