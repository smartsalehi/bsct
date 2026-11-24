# -*- coding: utf-8 -*-
"""ساخت data.js برای سایت حفظ جزء ۳۰ از دادهٔ خام alquran.cloud"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "data.js")

ar = json.load(open(os.path.join(HERE, "ar.json"), encoding="utf-8"))["data"]["ayahs"]
fa = json.load(open(os.path.join(HERE, "fa.json"), encoding="utf-8"))["data"]["ayahs"]
assert len(ar) == len(fa) == 564

BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
DIACRITICS = set(range(0x064B, 0x0653)) | {0x0670, 0x06D6, 0x06ED, 0x0653, 0x0654, 0x0655}


def strip_diac(s):
    return "".join(c for c in s if ord(c) not in DIACRITICS)


def split_bismillah(text):
    """اگر آیه با بسمله شروع شده باشد، (بسمله, باقی آیه) را برمی‌گرداند."""
    target = strip_diac(BISMILLAH)
    idx = [i for i, c in enumerate(text) if ord(c) not in DIACRITICS]
    stripped = "".join(text[i] for i in idx)
    if not stripped.startswith(target):
        return "", text
    cut = idx[len(target) - 1] + 1
    # اعرابِ چسبیده به آخرین حرفِ بسمله هم حذف شود
    while cut < len(text) and ord(text[cut]) in DIACRITICS:
        cut += 1
    return text[:cut], text[cut:].strip()

# نام فارسی سوره‌ها + شرح کوتاه
SURAH_FA = {
 78: ("نبأ", "خبر بزرگ"),
 79: ("نازعات", "فرشتگانِ بیرون‌کشندهٔ جان"),
 80: ("عبس", "چهره در هم کشید"),
 81: ("تکویر", "در هم پیچیدن"),
 82: ("انفطار", "شکافتن"),
 83: ("مطففین", "کم‌فروشان"),
 84: ("انشقاق", "شکافتن"),
 85: ("بروج", "برج‌ها"),
 86: ("طارق", "ستارهٔ شب‌آیند"),
 87: ("اعلی", "برترین"),
 88: ("غاشیه", "پوشاننده"),
 89: ("فجر", "سپیده‌دم"),
 90: ("بلد", "شهر"),
 91: ("شمس", "خورشید"),
 92: ("لیل", "شب"),
 93: ("ضحی", "روشنایی روز"),
 94: ("شرح", "گشودن"),
 95: ("تین", "انجیر"),
 96: ("علق", "خون بسته"),
 97: ("قدر", "سرنوشت و ارج"),
 98: ("بینه", "دلیل روشن"),
 99: ("زلزله", "زلزله"),
 100: ("عادیات", "اسب‌های تازنده"),
 101: ("قارعه", "کوبنده"),
 102: ("تکاثر", "افزون‌خواهی"),
 103: ("عصر", "زمان"),
 104: ("همزه", "عیب‌جوی"),
 105: ("فیل", "پیل"),
 106: ("قریش", "قریش"),
 107: ("ماعون", "بخشش کوچک"),
 108: ("کوثر", "خیر فراوان"),
 109: ("کافرون", "کافران"),
 110: ("نصر", "یاری"),
 111: ("مسد", "ریسمانِ بافته"),
 112: ("اخلاص", "یکتایی"),
 113: ("فلق", "سپیدهٔ صبح"),
 114: ("ناس", "مردمان"),
}

surahs = {}
order = []
for a, f in zip(ar, fa):
    sn = a["surah"]["number"]
    if sn not in surahs:
        surahs[sn] = {
            "number": sn,
            "name": a["surah"]["name"],
            "englishName": a["surah"]["englishName"],
            "total": a["surah"]["numberOfAyahs"],
            "bismillah": True,
            "ayahs": [],
        }
        order.append(sn)
    text = a["text"].strip()
    if a["numberInSurah"] == 1:
        bis, rest = split_bismillah(text)
        if bis:
            surahs[sn]["bismillah"] = True
            text = rest
        # اگر بسمله جدا نبود، برای سورهٔ فاتحه/توبه‌گونه‌ها پرچم پیش‌فرض می‌ماند
    surahs[sn]["ayahs"].append({
        "n": a["numberInSurah"],
        "g": a["number"],
        "ar": text,
        "fa": f["text"].strip(),
        "page": a["page"],
    })

# شناسه‌ی یکتای سراسری برای هر آیه
gid = 0
for sn in order:
    s = surahs[sn]
    s["id"] = sn
    fa_name, fa_desc = SURAH_FA[sn]
    s["faName"] = fa_name
    s["faDesc"] = fa_desc
    s["startId"] = gid + 1
    for ay in s["ayahs"]:
        gid += 1
        ay["id"] = gid
    s["endId"] = gid
    assert len(s["ayahs"]) == s["total"], (sn, len(s["ayahs"]), s["total"])

lines = []
lines.append("// جزء ۳۰ قرآن کریم — دادهٔ آیه‌به‌آیه")
lines.append("// " + str(len(order)) + " سوره × ۵۶۴ آیه، متن عثمانی + ترجمهٔ فارسی (فولادوند)")
lines.append("// منبع: api.alquran.cloud (quran-uthmani + fa.fooladvand)")
lines.append("const SURAHS = [")
for sn in order:
    s = surahs[sn]
    lines.append("  {")
    lines.append("    id: %d," % s["id"])
    lines.append("    number: %d," % s["number"])
    lines.append("    name: %s," % json.dumps(s["name"], ensure_ascii=False))
    lines.append("    faName: %s," % json.dumps(s["faName"], ensure_ascii=False))
    lines.append("    faDesc: %s," % json.dumps(s["faDesc"], ensure_ascii=False))
    lines.append("    englishName: %s," % json.dumps(s["englishName"], ensure_ascii=False))
    lines.append("    total: %d," % s["total"])
    lines.append("    bismillah: %s," % ("true" if s["bismillah"] else "false"))
    lines.append("    startId: %d," % s["startId"])
    lines.append("    endId: %d," % s["endId"])
    lines.append("    ayahs: [")
    for ay in s["ayahs"]:
        lines.append("      {id: %d, n: %d, g: %d, ar: %s, fa: %s}," % (
            ay["id"], ay["n"], ay["g"],
            json.dumps(ay["ar"], ensure_ascii=False),
            json.dumps(ay["fa"], ensure_ascii=False)))
    lines.append("    ],")
    lines.append("  },")
lines.append("];")
lines.append("")
lines.append("const SURAH_COUNT = %d;" % len(order))
lines.append("const AYAH_COUNT = %d;" % gid)
lines.append("const JUZ_NUMBER = 30;")
lines.append("")
lines.append("// فهرست تخت همهٔ آیات برای جستجو و آزمون")
lines.append("const AYAHS = SURAHS.flatMap((s) =>")
lines.append("  s.ayahs.map((a) => ({ ...a, surahId: s.id, surahFa: s.faName, surahNumber: s.number }))")
lines.append(");")

open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("wrote", OUT, "surahs", len(order), "ayahs", gid)
print("sample:", json.dumps(surahs[78]["ayahs"][0], ensure_ascii=False))
print("sample114:", json.dumps(surahs[114]["ayahs"][0], ensure_ascii=False))
