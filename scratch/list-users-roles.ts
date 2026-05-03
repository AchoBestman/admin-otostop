import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    where: { deleted_at: null },
    include: {
      user_roles: {
        include: {
          role: true
        }
      }
    }
  });

  console.log("\n--- Liste des Utilisateurs et leurs Rôles ---\n");
  
  users.forEach(user => {
    const roles = user.user_roles.map(ur => ur.role.name).join(", ");
    console.log(`ID: ${user.id} | Nom: ${user.first_name} ${user.last_name} | Email: ${user.email} | Rôles: [${roles || "Aucun"}]`);
  });
  
  console.log("\n--------------------------------------------\n");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
