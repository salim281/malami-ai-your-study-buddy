## Goal

Rebuild `src/routes/index.tsx` to match the sketched layout while keeping the current "one free question → prompt sign-in" behavior and the existing `/app` post-login experience (Chat, Learn, Quizzes, Vocabulary) unchanged.

## Layout (from sketch)

**Desktop**

```text
[Logo  Malami AI]                 [ Ask · Contact · About · Login/Create ]
------------------------------------------------------------------------
                    Hi, I am Malami AI
             Your Hausa & English study buddy

        ┌──────────────────────────────────────────┐
        │  Ask Malami AI...                      ▶ │
        └──────────────────────────────────────────┘

   [ Learn 🔒 ]     [ Quizzes 🔒 ]     [ Vocabulary 🔒 ]
        (locked previews — click → /auth)

------------------------------------------------------------------------
Footer (3MTT project info, v1.0, Salim Kabiru, Fellow ID, Track)
```

**Mobile**

- Top bar: menu (hamburger) icon on left, logo + "Malami AI" centered/left.
- Hero: "Hi, I am Malami" + short tagline.
- Large Ask box with send arrow.
- Message area appears below after asking.
- Locked feature chips stacked.
- Footer.

Hamburger menu opens a sheet with: Ask, Contact, About, Login / Create account.

## Behavior

- Landing greeting: "Sannu! I am Malami AI" (Hausa + English mix), matches persona.
- Ask box accepts one free question in Hausa or English; answer streams into a message area right below the input (same `askPublic` server fn — no change).
- After the first answer: replace input with the existing sign-in CTA card ("Madalla! Create a free account to keep chatting…").
- Locked feature tiles (Learn / Quizzes / Vocabulary) each show icon + name + small lock badge; click routes to `/auth`. Chat tile is implicitly the current hero box.
- Signed-in visitors: top nav shows "Open app" → `/app`; locked tiles become "Open" and link to `/app`.
- Anchor links `#about`, `#contact` scroll to footer sections (About project, Contact/credits). No new routes.

## Footer

Keep the current content but restructure into three columns as sketched, with an `id="about"` block (3MTT Knowledge Showcase 2.0, v1.0) and an `id="contact"` block (Salim Kabiru, Fellow ID FE/23/68144580, Track: AI/ML).

## Files

- **Edit** `src/routes/index.tsx` — new layout, nav, hero, Ask box, locked feature tiles, restructured footer. Reuse `askPublic`, `supabase.auth.getSession`, existing icons.
- No changes to server functions, auth, `/app`, or DB.
- Remove the footer after successfully logged in/created an account

## Out of scope

- No changes to Chat/Learn/Quiz/Vocabulary logic or post-login UI.
- No new routes or backend work.