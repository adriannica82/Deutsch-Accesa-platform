# Șabloane de email (Supabase → Authentication → Emails)

Supabase nu permite setarea acestor șabloane din cod; se lipesc manual în panou, în română. Variabila `{{ .ConfirmationURL }}` este linkul care duce în aplicație.

## Invite user (invitația)

**Subiect:** Invitație la Deutsch · antrenament

```html
<h2>Ai fost invitat la Deutsch · antrenament</h2>
<p>Un administrator te-a invitat în platforma de exersare a limbii germane, cu explicații în română.</p>
<p>Apasă pe buton, completează prenumele, numele și alege o parolă. Durează sub un minut.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 22px;background:#173139;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:700">Finalizează înregistrarea</a></p>
<p style="color:#61737a;font-size:13px">Dacă nu te așteptai la acest email, îl poți ignora. Linkul poate fi folosit o singură dată și expiră după câtva timp; dacă nu mai merge, cere o invitație nouă administratorului.</p>
```

## Reset password (folosit și la „Retrimite” pentru cine a deschis deja linkul)

**Subiect:** Alege o parolă nouă pentru Deutsch · antrenament

```html
<h2>Alege o parolă nouă</h2>
<p>Apasă pe buton ca să-ți alegi parola cu care intri în Deutsch · antrenament.</p>
<p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 22px;background:#173139;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:700">Alege parola</a></p>
<p style="color:#61737a;font-size:13px">Dacă nu ai cerut asta, ignoră acest email.</p>
```

## Setări necesare în Supabase (le face proprietarul proiectului)

1. **Authentication → Sign In / Providers → User Signups:** oprește „Allow new users to sign up” (înregistrarea publică rămâne închisă; invitațiile merg în continuare, pentru că sunt create de server).
2. **Authentication → URL Configuration:** la **Site URL** pune adresa platformei (de ex. `https://…vercel.app`) și adaugă aceeași adresă (cu `/**` la sfârșit, sau exact adresa) la **Redirect URLs**. Altfel linkul din email nu duce în aplicație.
3. **Authentication → Emails → SMTP Settings:** activează „Custom SMTP” cu datele unui furnizor (Resend, Brevo, SendGrid etc.): host, port, utilizator, parolă și adresa/numele expeditorului. Emailurile implicite pleacă doar către adresele echipei proiectului și sunt foarte limitate.
4. **Authentication → Emails → Templates:** lipește șabloanele „Invite user” și „Reset password” de mai sus (subiect + conținut).
5. **Authentication → Sign In / Providers → Email → Email OTP Expiration:** valoarea maximă permisă este **86400 secunde (24 de ore)**, deci o invitație este valabilă cel mult o zi; după aceea administratorul apasă „Retrimite”.
6. **Opțional, doar pe planul Pro:** „Prevent use of leaked passwords” (Authentication → Sign In / Providers → Email); pe planul gratuit nu există.
