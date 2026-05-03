# Migrations et Seeds

Ce document explique comment lancer les migrations SQL et les seeds pour initialiser la base de données.

Prérequis
- `node` et `pnpm`/`npm` installés.
- Définir `DATABASE_URL` dans votre environnement (ex: `mysql://user:pass@host:3306/dbname`).

Fichiers
- `lib/db/migrations/001_create_tables.sql` : script de création des tables.
- `lib/db/migrations/002_seed_data.sql` : script d'insertions initiales (roles, permissions, utilisateurs demo).
- `scripts/run-sql.mjs` : petit utilitaire qui exécute les fichiers SQL.

Commandes
- Installer les dépendances si nécessaire :

```bash
pnpm install
# ou
npm install
```

- Lancer les migrations :

```bash
# Unix/macOS (zsh)
export DATABASE_URL="mysql://user:pass@host:3306/dbname"
pnpm run migrate
```

- Lancer les seeds :

```bash
export DATABASE_URL="mysql://user:pass@host:3306/dbname"
pnpm run seed
```

Notes de sécurité
- Ne jamais versionner votre `.env` contenant `DATABASE_URL` en clair.
- Les seeds insèrent des comptes de démonstration (mot de passe haché). Changez les e-mails et mots de passe en production.

Dépannage
- "ER_NOT_SUPPORTED_AUTH_MODE" : vérifiez la configuration d'authentification MySQL (utilisez mysql_native_password pour certains hébergeurs).
- Erreurs de permission : assurez-vous que l'utilisateur a les droits CREATE/INSERT/ALTER sur la base.

Si vous préférez un runner par migration (qui enregistre l'état) ou l'intégration avec Prisma/Knex, je peux ajouter un gestionnaire de migrations plus complet.

Prisma (ORM) — option sans SQL brute
-----------------------------------
Le projet inclut un schéma Prisma minimal dans `prisma/schema.prisma` et un script de seed `prisma/seed.ts`.

Pour utiliser Prisma :

1. Installer les dépendances (si vous ne les avez pas) :

```bash
pnpm add -D prisma
pnpm add @prisma/client
pnpm add -D ts-node typescript
```

2. Générer le client Prisma :

```bash
pnpm run prisma:generate
```

3. Appliquer le schéma à la base (créera les tables si nécessaire) :

```bash
export DATABASE_URL="mysql://user:pass@host:3306/dbname"
pnpm run prisma:push
```

4. Lancer le seed Prisma (utilise `SUPER_ROOT_PASSWORD` et `ADMIN_PASSWORD` depuis l'environnement si fournis, sinon fallback `Bestm@n1995`) :

```bash
export DATABASE_URL="mysql://user:pass@host:3306/dbname"
pnpm run prisma:seed
```

Remarque: le seed Prisma évite le SQL brut et utilise Prisma Client pour upsert les données.
