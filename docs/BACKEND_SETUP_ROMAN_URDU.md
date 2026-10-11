# Backend setup (Roman Urdu, aasan steps)

Ye system kaise chalta hai:

    Visitor form bharta hai  ->  Google Apps Script (Code.gs)  ->  Aap ki private Google Sheet mein nayi row

Koi server nahi chahiye. Backend Google ke paas chalta hai, free hai, aur Sheet private rehti hai.
Jab tak `contactEndpoint` (data.js mein) khali hai, form sirf email app kholta hai.

## Ek baar karne wale steps

1. **Sheet banayein:** sheets.google.com par naya blank spreadsheet, naam `Portfolio Contact Data`. Share nahi karna.
2. **Script paste karein:** Sheet mein Extensions > Apps Script. Purana code delete karein. `backend/Code.gs` ka poora code copy karke paste karein. Ctrl+S.
3. **Pehli baar chalayein:** toolbar mein function `setup` chunein, **Run** dabayein. Permission aaye to: Review permissions > apna account > Advanced > Go to project > Allow.
   Sheet mein wapas jayein: `Contact Submissions` tab aur 7 columns ban gaye honge.
4. **Deploy:** Deploy > New deployment > Web app.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Deploy dabayein, aur `/exec` par khatam hone wala link copy karein.
5. **Link website mein lagayein:** `frontend/js/data.js` mein
   `contactEndpoint: "https://script.google.com/macros/s/.../exec",`
6. **GitHub + Netlify:** poora folder GitHub par daalein, Netlify mein import karein. (`netlify.toml` ne publish folder `frontend` set kar diya hai.)
7. **Test:** live site par khud form bharein. Hara "Thank you (ref MS-...)" aaye aur Sheet mein nayi row ho.

Browser ka check: `/exec` link browser mein kholein, ye likha aana chahiye: `{"ok":true,"service":"portfolio-contact"}`

## Data download
Sheet mein File > Download > Microsoft Excel (.xlsx) ya CSV.
Status column (New / Read / Replied / Spam) se track karein ke kis ko jawab diya.

## Yaad rakhein
- `Code.gs` mein baad mein kuch badlein to Save kafi nahi. Deploy > Manage deployments > pencil icon > Version: **New version** > Deploy. Link wohi rehta hai.
- Wo link public hota hai (website ke code mein dikhta hai). Is liye spam limits lagi hain: ek email se 10 minute mein 3 messages, kul 40 messages per ghanta.
- Ye mukammal spam protection nahi hai. Spam bohat aaye to captcha (Cloudflare Turnstile) lagana hoga.

## Masle aaye to
| Masla | Hal |
|---|---|
| "Network problem" | Link ghalat hai, ya Who has access "Anyone" nahi. `/exec` link browser mein kholein. |
| Script badli magar farq nahi | New version deploy karein (upar likha hai). |
| Row save nahi hui | Apps Script mein left side **Executions** kholein, asli error wahan likha hota hai. |
| "Too many messages" | Test ke dauran limit lag gayi. 10 minute ruken ya doosri email use karein. |
| Form email app khol raha hai | `contactEndpoint` abhi khali hai. |

Poori detail (tests, security): `BACKEND_SETUP.md`
