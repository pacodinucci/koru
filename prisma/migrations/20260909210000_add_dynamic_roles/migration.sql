CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "baseRole" "UserRole" NOT NULL DEFAULT 'ADMIN',
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isProtected" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

ALTER TABLE "user" ADD COLUMN "accessRoleId" TEXT;
ALTER TABLE "UserInvitation" ADD COLUMN "accessRoleId" TEXT;

CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");
CREATE INDEX "Role_isActive_name_idx" ON "Role"("isActive", "name");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "Permission_section_action_idx" ON "Permission"("section", "action");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
CREATE INDEX "user_accessRoleId_idx" ON "user"("accessRoleId");
CREATE INDEX "UserInvitation_accessRoleId_idx" ON "UserInvitation"("accessRoleId");

ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user" ADD CONSTRAINT "user_accessRoleId_fkey" FOREIGN KEY ("accessRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_accessRoleId_fkey" FOREIGN KEY ("accessRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Role" ("id","key","name","description","baseRole","isSystem","isProtected","isActive","updatedAt") VALUES
('role_superadmin','SUPERADMIN','Superadmin','Gobierno y configuración total del sistema','SUPERADMIN',true,true,true,CURRENT_TIMESTAMP),
('role_admin','ADMIN','Administrador','Administración institucional general','ADMIN',true,true,true,CURRENT_TIMESTAMP),
('role_admin_operator','ADMIN_OPERATOR','Administrador operador','Operación de caja chica e inventario','ADMIN_OPERATOR',true,true,true,CURRENT_TIMESTAMP),
('role_admin_teacher','ADMIN_TEACHER','Administrador docente','Acceso docente con funciones administrativas limitadas','ADMIN_TEACHER',true,true,true,CURRENT_TIMESTAMP),
('role_teacher','TEACHER','Docente','Gestión docente de grupos asignados','TEACHER',true,true,true,CURRENT_TIMESTAMP),
('role_parent','PARENT','Familia','Acceso al dashboard familiar propio','PARENT',true,true,true,CURRENT_TIMESTAMP);

INSERT INTO "Permission" ("id","key","section","action","label","updatedAt") VALUES
('perm_dashboard_access','dashboard.access','dashboard','access','Acceder al dashboard',CURRENT_TIMESTAMP),
('perm_blog_view','blog.view','blog','view','Ver blog',CURRENT_TIMESTAMP),
('perm_blog_manage','blog.manage','blog','manage','Gestionar blog',CURRENT_TIMESTAMP),
('perm_content_view','content.view','content','view','Ver contenido',CURRENT_TIMESTAMP),
('perm_content_manage','content.manage','content','manage','Gestionar contenido',CURRENT_TIMESTAMP),
('perm_calendar_view','calendar.view','calendar','view','Ver calendario',CURRENT_TIMESTAMP),
('perm_calendar_manage','calendar.manage','calendar','manage','Gestionar calendario',CURRENT_TIMESTAMP),
('perm_cash_view','cash-fund.view','cash-fund','view','Ver caja chica',CURRENT_TIMESTAMP),
('perm_cash_operate','cash-fund.operate','cash-fund','operate','Operar caja chica',CURRENT_TIMESTAMP),
('perm_cash_configure','cash-fund.configure','cash-fund','configure','Configurar caja chica',CURRENT_TIMESTAMP),
('perm_inventory_view','inventory.view','inventory','view','Ver inventario',CURRENT_TIMESTAMP),
('perm_inventory_operate','inventory.operate','inventory','operate','Operar inventario',CURRENT_TIMESTAMP),
('perm_inventory_configure','inventory.configure','inventory','configure','Configurar inventario',CURRENT_TIMESTAMP),
('perm_documents_view','documents.view','documents','view','Ver documentos',CURRENT_TIMESTAMP),
('perm_documents_manage','documents.manage','documents','manage','Gestionar documentos',CURRENT_TIMESTAMP),
('perm_families_view','families.view','families','view','Ver familias',CURRENT_TIMESTAMP),
('perm_families_manage','families.manage','families','manage','Gestionar familias',CURRENT_TIMESTAMP),
('perm_families_payments','families.payments','families','payments','Gestionar pagos',CURRENT_TIMESTAMP),
('perm_families_waive','families.waive-balance','families','waive-balance','Condonar saldos',CURRENT_TIMESTAMP),
('perm_students_view','students.view','students','view','Ver alumnos',CURRENT_TIMESTAMP),
('perm_students_manage','students.manage','students','manage','Gestionar alumnos',CURRENT_TIMESTAMP),
('perm_teachers_view','teachers.view','teachers','view','Ver docentes',CURRENT_TIMESTAMP),
('perm_teachers_manage','teachers.manage','teachers','manage','Gestionar docentes',CURRENT_TIMESTAMP),
('perm_exams_view','exams.view','exams','view','Ver notas',CURRENT_TIMESTAMP),
('perm_exams_manage','exams.manage','exams','manage','Gestionar notas',CURRENT_TIMESTAMP),
('perm_users_view','users.view','users','view','Ver usuarios',CURRENT_TIMESTAMP),
('perm_users_manage','users.manage','users','manage','Gestionar usuarios',CURRENT_TIMESTAMP),
('perm_mailing_view','mailing.view','mailing','view','Ver mailing',CURRENT_TIMESTAMP),
('perm_mailing_send','mailing.send','mailing','send','Enviar comunicaciones',CURRENT_TIMESTAMP),
('perm_roles_view','roles.view','roles','view','Ver roles',CURRENT_TIMESTAMP),
('perm_roles_manage','roles','manage','Gestionar roles',CURRENT_TIMESTAMP);

INSERT INTO "RolePermission" ("roleId","permissionId")
SELECT 'role_superadmin',"id" FROM "Permission";

INSERT INTO "RolePermission" ("roleId","permissionId")
SELECT 'role_admin',"id" FROM "Permission" WHERE "key" NOT IN ('cash-fund.configure','inventory.configure','families.waive-balance','roles.manage');

INSERT INTO "RolePermission" ("roleId","permissionId")
SELECT 'role_admin_operator',"id" FROM "Permission" WHERE "key" IN ('dashboard.access','cash-fund.view','cash-fund.operate','inventory.view','inventory.operate','families.view','families.payments');

INSERT INTO "RolePermission" ("roleId","permissionId")
SELECT 'role_admin_teacher',"id" FROM "Permission" WHERE "key" IN ('dashboard.access','calendar.view','cash-fund.view','inventory.view','students.view','exams.view','exams.manage');

INSERT INTO "RolePermission" ("roleId","permissionId")
SELECT 'role_teacher',"id" FROM "Permission" WHERE "key" IN ('dashboard.access','calendar.view','cash-fund.view','inventory.view','students.view','exams.view','exams.manage');

UPDATE "user" SET "accessRoleId" = CASE "role"::text
  WHEN 'SUPERADMIN' THEN 'role_superadmin'
  WHEN 'ADMIN' THEN 'role_admin'
  WHEN 'ADMIN_OPERATOR' THEN 'role_admin_operator'
  WHEN 'ADMIN_TEACHER' THEN 'role_admin_teacher'
  WHEN 'TEACHER' THEN 'role_teacher'
  WHEN 'PARENT' THEN 'role_parent'
END;

UPDATE "UserInvitation" SET "accessRoleId" = CASE "role"::text
  WHEN 'SUPERADMIN' THEN 'role_superadmin'
  WHEN 'ADMIN' THEN 'role_admin'
  WHEN 'ADMIN_OPERATOR' THEN 'role_admin_operator'
  WHEN 'ADMIN_TEACHER' THEN 'role_admin_teacher'
  WHEN 'TEACHER' THEN 'role_teacher'
  WHEN 'PARENT' THEN 'role_parent'
END;

