import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // roles
  const roles = ['root', 'admin', 'customer']
  for (const r of roles) {
    await prisma.roles.upsert({
      where: { slug: r },
      update: {},
      create: { name: r[0].toUpperCase() + r.slice(1), slug: r }
    })
  }

  // permissions
  const perms = [
    { name: 'Can toggle account activation', slug: 'can_toggle_activated_an_account' },
    { name: 'Can delete user', slug: 'can_delete_user' },
    { name: 'Can manage roles', slug: 'can_manage_roles' },
    { name: 'Can manage permissions', slug: 'can_manage_permissions' },
    { name: 'Can view users', slug: 'can_view_users' },
    { name: 'Can create users', slug: 'can_create_users' },
    { name: 'Can update users', slug: 'can_update_users' },
    { name: 'Can view logs', slug: 'can_view_logs' },
    { name: 'Can view categories', slug: 'can_view_categories' },
    { name: 'Can create categories', slug: 'can_create_categories' },
    { name: 'Can update categories', slug: 'can_update_categories' },
    { name: 'Can delete categories', slug: 'can_delete_categories' }
  ]
  for (const p of perms) {
    await prisma.permissions.upsert({ where: { slug: p.slug }, update: {}, create: p })
  }

  // assign all permissions to root
  const rootRole = await prisma.roles.findUnique({ where: { slug: 'root' } })
  const allPerms = await prisma.permissions.findMany()
  if (rootRole) {
    for (const p of allPerms) {
      await prisma.role_permissions.upsert({
        where: { role_id_permission_id: { role_id: rootRole.id, permission_id: p.id } },
        update: {},
        create: { role_id: rootRole.id, permission_id: p.id }
      })
    }
  }

  // limited permissions to admin
  const adminRole = await prisma.roles.findUnique({ where: { slug: 'admin' } })
  const adminSlugs = [
    'can_view_users', 
    'can_create_users', 
    'can_update_users', 
    'can_toggle_activated_an_account',
    'can_view_categories',
    'can_create_categories',
    'can_update_categories',
    'can_delete_categories'
  ]
  if (adminRole) {
    for (const slug of adminSlugs) {
      const p = await prisma.permissions.findUnique({ where: { slug } })
      if (p) {
        await prisma.role_permissions.upsert({
          where: { role_id_permission_id: { role_id: adminRole.id, permission_id: p.id } },
          update: {},
          create: { role_id: adminRole.id, permission_id: p.id }
        })
      }
    }
  }

  // users
  const rootEmail = process.env.ROOT_EMAIL || 'aikpeachille55@gmail.com'
  const adminEmail = process.env.ADMIN_EMAIL || 'aikpe@kassigroup.com'

  if (!rootEmail || !adminEmail) {
    console.error("Error: ROOT_EMAIL and ADMIN_EMAIL must be defined in .env")
    return
  }

  const users = [
    { first_name: 'Super', last_name: 'Root', email: rootEmail, password: process.env.ROOT_PASSWORD || '' },
    { first_name: 'Admin', last_name: 'User', email: adminEmail, password: process.env.ADMIN_PASSWORD || '' }
  ]

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12)
    await prisma.users.upsert({
      where: { email: u.email },
      update: { 
        first_name: u.first_name, 
        last_name: u.last_name, 
        password: hash, 
        status: 'activated', 
        updated_at: new Date(),
        deleted_at: null // Ensure not deleted
      },
      create: { first_name: u.first_name, last_name: u.last_name, email: u.email, password: hash, status: 'activated' }
    })
  }

  // assign roles to users
  const superUser = await prisma.users.findUnique({ where: { email: rootEmail } })
  const adminUser = await prisma.users.findUnique({ where: { email: adminEmail } })
  
  if (superUser && rootRole) {
    await prisma.user_roles.upsert({ 
      where: { user_id_role_id: { user_id: superUser.id, role_id: rootRole.id } }, 
      update: {}, 
      create: { user_id: superUser.id, role_id: rootRole.id } 
    })
    console.log(`Assigned ROOT role to ${rootEmail}`)
  }
  
  if (adminUser && adminRole) {
    await prisma.user_roles.upsert({ 
      where: { user_id_role_id: { user_id: adminUser.id, role_id: adminRole.id } }, 
      update: {}, 
      create: { user_id: adminUser.id, role_id: adminRole.id } 
    })
    console.log(`Assigned ADMIN role to ${adminEmail}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
