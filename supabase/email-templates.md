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

1. **Authentication → URL Configuration:** adaugă adresa platformei (de ex. `https://…vercel.app`) la **Site URL** și la **Redirect URLs**, altfel linkul din email nu duce în aplicație.
2. **Project Settings → Authentication → SMTP Settings:** activează un SMTP propriu (Resend, Brevo etc.) și alege adresa expeditorului. Emailurile implicite pleacă doar către adresele echipei proiectului și sunt foarte limitate.
3. **Authentication → Providers → Email:** la **Email OTP Expiration** pune 604800 (7 zile) ca invitațiile să rămână valabile o săptămână.
4. **Authentication → Providers → Email:** dezactivează „Allow new users to sign up” (înregistrarea publică rămâne închisă) și activează „Leaked password protection”.
