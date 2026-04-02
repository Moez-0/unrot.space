# unrot | Escape the Scroll, Reclaim Your Focus

**unrot** is a curated knowledge exploration platform designed to combat "brain rot" and digital fragmentation. It provides a focused environment for deep dives into complex topics, encouraging users to reclaim their attention span through intentional "rabbit holes."

## 🚀 The Vision

In an era of short-form content and infinite scrolling, our attention is being commodified and fragmented. **unrot** offers an alternative: a space where curiosity is rewarded with depth, not just dopamine.

## ✨ Key Features

- **Curated Rabbit Holes**: Hand-picked topics across Science, Philosophy, Technology, and Art.
- **Deep Focus Mode**: An immersive reading experience with session tracking and focus scoring.
- **Knowledge Chains**: Track your exploration path as you jump from one concept to another.
- **Analytics Dashboard**: Monitor your focus trends, total focus time, and exploration depth.
- **Neo-Brutalist Design**: A bold, high-contrast interface that prioritizes content over distraction.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Motion (framer-motion)
- **Database/Auth**: Supabase
- **Charts**: Recharts
- **SEO**: React Helmet Async

## 🌐 Deployment

The platform is hosted at [unrot.space](https://unrot.space) via Netlify.

## 🔒 Admin Dashboard

The platform includes a protected admin dashboard for managing topics and monitoring user engagement. Access is restricted to authorized administrators.

## 🛡️ Supabase Security Patch (RLS)

If Supabase Security Advisor reports rls_disabled_in_public, run the SQL patch in:

- [supabase/security/2026-04-02-rls-hardening.sql](supabase/security/2026-04-02-rls-hardening.sql)

How to apply:

1. Open Supabase Dashboard → SQL Editor.
2. Paste and run the script.
3. Re-open Security Advisor and confirm the warning is resolved.

Note: The script includes an admin email check function. Update the email inside the script if your admin account email differs.

## 📄 License

This project is licensed under the MIT License.
