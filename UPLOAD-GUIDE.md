# راهنمای آپلود پروژه در GitHub

راهنمای کامل از صفر تا انتشار آنلاین. اگر Git نصب ندارید، از **گام ۱** شروع کنید.

---

## گام ۰ — پیش‌نیاز: ساخت حساب GitHub

اگر حساب ندارید، در <https://github.com/signup> ثبت‌نام کنید.

---

## گام ۱ — نصب Git در ویندوز

Git روی این سیستم نصب نیست. یکی از دو روش زیر:

### روش A — نصب دستی (مطمئن‌ترین)

1. به <https://git-scm.com/download/win> بروید.
2. نسخه **64-bit Git for Windows Setup** را دانلود کنید.
3. فایل نصب را اجرا کنید و در همه مراحل **Next** بزنید (تنظیمات پیش‌فرض مناسب است).
4. پس از پایان، **PowerShell را ببندید و دوباره باز کنید** (تا PATH به‌روز شود).
5. بررسی نصب:

```powershell
git --version
```

اگر شماره نسخه نمایش داده شد (مثلاً `git version 2.47.0`)، نصب موفق است.

> ⚠️ اگر دستور بالا خطا داد، PowerShell را حتماً بسته و از نو باز کنید.
> در غیر این صورت مسیر `C:\Program Files\Git\cmd` را دستی به `PATH` اضافه کنید.

### روش B — GitHub Desktop (رابط گرافیکی، بدون خط فرمان)

اگر با خط فرمان راحت نیستید:

1. <https://desktop.github.com> را دانلود و نصب کنید.
2. با حساب GitHub وارد شوید.
3. از منوی **File → Add local repository** پوشه پروژه را انتخاب کنید.
4. اگر پیام «این پوشه مخزن Git نیست» داد، روی **create a repository** کلیک کنید.
5. سپس **Publish repository** را بزنید.

---

## گام ۲ — معرفی خود به Git (فقط یک‌بار)

در PowerShell این دو دستور را با اطلاعات خودتان اجرا کنید:

```powershell
git config --global user.name "نام شما"
git config --global user.email "ایمیل-گیت-هاب-شما@example.com"
```

> 💡 ایمیل باید همان ایمیل حساب GitHub باشد تا commitها به نام شما ثبت شود.
> اگر نمی‌خواهید ایمیل واقعی‌تان عمومی شود، از ایمیل `noreply` گیت‌هاب استفاده کنید
> (در GitHub: **Settings → Emails**).

---

## گام ۳ — ساخت مخزن خالی در GitHub

1. وارد <https://github.com/new> شوید.
2. **Repository name**: مثلاً `stm-bsc`
3. **Description** (اختیاری): `ارزیابی BSC برنامه حمل‌ونقل عمومی شهر`
4. **Public** را انتخاب کنید (برای GitHub Pages رایگان لازم است).
5. ⚠️ **مهم:** هیچ‌کدام از گزینه‌های *Add a README*، *Add .gitignore* یا *Choose a license* را تیک نزنید — چون این فایل‌ها از قبل در پروژه وجود دارند و باعث تضاد می‌شوند.
6. روی **Create repository** کلیک کنید.

صفحه‌ای باز می‌شود که آدرس مخزن را نشان می‌دهد؛ آن را کپی کنید:

```text
https://github.com/<USERNAME>/stm-bsc.git
```

---

## گام ۴ — آپلود پروژه

در PowerShell به پوشه پروژه بروید و دستورها را **به‌ترتیب** اجرا کنید:

```powershell
cd "C:\Users\yas\Documents\deepseek-harness\default-workspace\stm"

git init
git add .
git commit -m "feat: ارزیابی BSC برنامه حمل‌ونقل عمومی شهر"
git branch -M main
git remote add origin https://github.com/<USERNAME>/stm-bsc.git
git push -u origin main
```

> 🔁 در دستور `git remote add` آدرس خودتان را جایگزین `<USERNAME>` و `stm-bsc` کنید.

### احراز هویت هنگام push

Git از شما نام کاربری و رمز می‌خواهد:

- **نام کاربری:** نام کاربری GitHub
- **رمز عبور:** ❌ رمز حساب GitHub کار **نمی‌کند**

باید یک **Personal Access Token** بسازید:

1. به <https://github.com/settings/tokens> بروید.
2. **Generate new token → Generate new token (classic)**
3. **Note**: `upload-stm` — **Expiration**: ۳۰ روز
4. در بخش **Scopes** فقط **`repo`** را تیک بزنید.
5. **Generate token** را بزنید و توکن را **کپی کنید** (فقط یک‌بار نمایش داده می‌شود).
6. هنگام درخواست رمز در PowerShell، توکن را Paste کنید.

> 💡 توکن را جایی امن ذخیره کنید. اگر گم شد، باید توکن جدید بسازید.

**جایگزین ساده‌تر:** نصب [GitHub CLI](https://cli.github.com) و اجرای `gh auth login` — بعد از آن دیگر لازم نیست هر بار توکن بدهید.

---

## گام ۵ — انتشار آنلاین (GitHub Pages)

پس از موفقیت `git push`:

1. در صفحه مخزن به **Settings** بروید.
2. در نوار کناری **Pages** را انتخاب کنید.
3. در بخش **Source** گزینه **GitHub Actions** را انتخاب کنید.
4. چند دقیقه صبر کنید. در تب **Actions** پیشرفت را می‌بینید.
5. آدرس سایت شما:

```text
https://<USERNAME>.github.io/stm-bsc/
```

> ⏱️ اولین انتشار معمولاً ۱ تا ۳ دقیقه طول می‌کشد.
> اگر صفحه ۴۰۴ داد، کمی صبر کنید و با `Ctrl + F5` صفحه را تازه کنید.

---

## به‌روزرسانی‌های بعدی

هر بار که فایلی را تغییر دادید:

```powershell
cd "C:\Users\yas\Documents\deepseek-harness\default-workspace\stm"
git add .
git commit -m "توضیح تغییر"
git push
```

سایت به‌طور خودکار در حدود یک دقیقه به‌روز می‌شود.

---

## دستورهای پرکاربرد

| دستور | کار |
| --- | --- |
| `git status` | نمایش فایل‌های تغییر‌یافته |
| `git diff` | نمایش جزئیات تغییرات |
| `git log --oneline` | تاریخچه commitها |
| `git remote -v` | نمایش آدرس مخزن |
| `git pull` | دریافت تغییرات از GitHub |
| `git restore .` | لغو تغییرات ذخیره‌نشده |

---

## رفع مشکلات رایج

### `git : The term 'git' is not recognized`

Git نصب نیست یا PowerShell بسته و باز نشده است. **گام ۱** را انجام دهید و
PowerShell را از نو باز کنید.

### `remote origin already exists`

```powershell
git remote set-url origin https://github.com/<USERNAME>/stm-bsc.git
```

### `failed to push some refs` / `rejected`

مخزن GitHub فایل دارد (مثلاً README ساخته‌اید). با این دستور ادغام کنید:

```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### `Authentication failed`

توکن اشتباه یا منقضی است. توکن جدید بسازید (**گام ۴**) یا از `gh auth login` استفاده کنید.

### `src refspec main does not match any`

هنوز commit نساخته‌اید:

```powershell
git add .
git commit -m "first commit"
git branch -M main
git push -u origin main
```

### صفحه سایت ۴۰۴ می‌دهد

- مطمئن شوید در **Settings → Pages → Source** گزینه **GitHub Actions** انتخاب شده.
- تب **Actions** را ببینید؛ اگر workflow قرمز است، روی آن کلیک و خطا را بخوانید.
- دقت کنید فایل `index.html` در **ریشه** مخزن باشد، نه داخل زیرپوشه.

### فونت فارسی درست نمایش داده نمی‌شود

سایت از فونت `Vazirmatn` استفاده می‌کند و اگر نصب نباشد به `Tahoma` برمی‌گردد.
برای کیفیت بهتر، فونت [Vazirmatn](https://github.com/rastikerdar/vazirmatn) را روی سیستم نصب کنید.

---

## فایل‌هایی که آپلود می‌شوند

```text
index.html              صفحه اصلی
favicon.svg             آیکون سایت
css/style.css           استایل‌ها
js/main.js              منطق و داده‌ها
.github/workflows/      انتشار خودکار
.gitignore              فایل‌های نادیده‌گرفته‌شده
LICENSE                 مجوز MIT
UPLOAD-GUIDE.md         همین راهنما
README.md               مستندات
```

> پوشه `01/` (نسخه قدیمی) در `.gitignore` قرار دارد و آپلود نمی‌شود.
