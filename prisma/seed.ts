import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  ContractStatus,
  ContractType,
  CostType,
  EmployeeStatus,
  PermissionScope,
  PrismaClient,
  ReportFormat,
} from "@prisma/client";

const prisma = new PrismaClient();

type PermissionSeed = {
  module: string;
  action: string;
  description: string;
};

const permissions: PermissionSeed[] = [
  { module: "dashboard", action: "view", description: "View dashboard" },
  { module: "employees", action: "view", description: "View employees" },
  { module: "employees", action: "create", description: "Create employees" },
  { module: "employees", action: "edit", description: "Edit employees" },
  { module: "employees", action: "delete", description: "Delete employees" },
  { module: "contracts", action: "view", description: "View contracts" },
  { module: "contracts", action: "create", description: "Create contracts" },
  { module: "contracts", action: "edit", description: "Edit contracts" },
  { module: "contracts", action: "delete", description: "Delete contracts" },
  { module: "contracts", action: "generate", description: "Generate contracts" },
  { module: "contracts", action: "costs", description: "Manage contract costs" },
  { module: "reports", action: "view", description: "View reports" },
  { module: "reports", action: "create", description: "Create report templates" },
  { module: "reports", action: "run", description: "Run reports" },
  { module: "reports", action: "export", description: "Export reports" },
  { module: "admin", action: "rbac", description: "Manage roles and permissions" },
  { module: "admin", action: "users", description: "Manage users" },
  { module: "automations", action: "ai", description: "Use AI automations" },
  { module: "scheduler", action: "manage", description: "Manage scheduled reports" },
];

async function seedPermissions() {
  const result: Record<string, string> = {};

  for (const perm of permissions) {
    const record = await prisma.permission.upsert({
      where: {
        module_action: { module: perm.module, action: perm.action },
      },
      update: {
        description: perm.description,
      },
      create: perm,
    });
    result[`${perm.module}:${perm.action}`] = record.id;
  }

  return result;
}

async function seedRole(
  name: string,
  description: string,
  permissionKeys: string[],
  scope: PermissionScope = PermissionScope.ALL,
  permissionMap?: Record<string, string>,
) {
  const role = await prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });

  const map = permissionMap ?? (await seedPermissions());

  for (const key of permissionKeys) {
    const permissionId = map[key];
    if (!permissionId) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId,
        },
      },
      update: { scope },
      create: { roleId: role.id, permissionId, scope },
    });
  }

  return role;
}

async function seedUser(
  email: string,
  password: string,
  name: string,
  roleNames: string[],
) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  const roles = await prisma.role.findMany({
    where: { name: { in: roleNames } },
  });

  for (const role of roles) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: role.id },
      },
      update: { scope: PermissionScope.ALL },
      create: { userId: user.id, roleId: role.id, scope: PermissionScope.ALL },
    });
  }

  return user;
}

async function seedOrg() {
  const departments = [
    { name: "Engineering", code: "ENG", description: "Engineering org" },
    { name: "Human Resources", code: "HR", description: "People operations" },
    { name: "Finance", code: "FIN", description: "Finance & accounting" },
    { name: "Sales", code: "SLS", description: "Revenue org" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
  }

  const positions = [
    { title: "Software Engineer", departmentCode: "ENG" },
    { title: "Engineering Manager", departmentCode: "ENG" },
    { title: "HR Generalist", departmentCode: "HR" },
    { title: "HR Manager", departmentCode: "HR" },
    { title: "Finance Analyst", departmentCode: "FIN" },
    { title: "Sales Executive", departmentCode: "SLS" },
    { title: "Account Manager", departmentCode: "SLS" },
  ];

  for (const pos of positions) {
    const dept = await prisma.department.findUnique({
      where: { code: pos.departmentCode },
    });

    await prisma.position.upsert({
      where: { title: pos.title },
      update: { departmentId: dept?.id },
      create: { title: pos.title, departmentId: dept?.id },
    });
  }
}

async function seedEmployees() {
  const engineering = await prisma.department.findUnique({ where: { code: "ENG" } });
  const hr = await prisma.department.findUnique({ where: { code: "HR" } });
  const finance = await prisma.department.findUnique({ where: { code: "FIN" } });
  const sales = await prisma.department.findUnique({ where: { code: "SLS" } });

  const positionMap: Record<string, string | undefined> = {};
  const positions = await prisma.position.findMany();
  positions.forEach((pos) => {
    positionMap[pos.title] = pos.id;
  });

  type SeedEmployee = {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    departmentId?: string | null;
    positionId?: string | null;
    status: EmployeeStatus;
    startDate: Date;
    endDate?: Date | null;
    managerCode?: string;
  };

  const seedEmployees: SeedEmployee[] = [
    {
      employeeCode: "EMP-001",
      firstName: "Alice",
      lastName: "Nguyen",
      email: "alice@example.com",
      departmentId: engineering?.id,
      positionId: positionMap["Engineering Manager"],
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2023-01-15"),
    },
    {
      employeeCode: "EMP-002",
      firstName: "Bob",
      lastName: "Tran",
      email: "bob@example.com",
      departmentId: engineering?.id,
      positionId: positionMap["Software Engineer"],
      managerCode: "EMP-001",
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2023-03-01"),
    },
    {
      employeeCode: "EMP-003",
      firstName: "Carol",
      lastName: "Pham",
      email: "carol@example.com",
      departmentId: hr?.id,
      positionId: positionMap["HR Manager"],
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2022-10-01"),
    },
    {
      employeeCode: "EMP-004",
      firstName: "David",
      lastName: "Le",
      email: "david@example.com",
      departmentId: hr?.id,
      positionId: positionMap["HR Generalist"],
      managerCode: "EMP-003",
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2024-02-15"),
    },
    {
      employeeCode: "EMP-005",
      firstName: "Evelyn",
      lastName: "Vo",
      email: "evelyn@example.com",
      departmentId: finance?.id,
      positionId: positionMap["Finance Analyst"],
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2023-07-10"),
    },
    {
      employeeCode: "EMP-006",
      firstName: "Frank",
      lastName: "Hoang",
      email: "frank@example.com",
      departmentId: sales?.id,
      positionId: positionMap["Sales Executive"],
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2023-05-20"),
    },
    {
      employeeCode: "EMP-007",
      firstName: "Grace",
      lastName: "Pham",
      email: "grace@example.com",
      departmentId: sales?.id,
      positionId: positionMap["Account Manager"],
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2022-11-01"),
    },
    {
      employeeCode: "EMP-008",
      firstName: "Henry",
      lastName: "Vu",
      email: "henry@example.com",
      departmentId: engineering?.id,
      positionId: positionMap["Software Engineer"],
      managerCode: "EMP-001",
      status: EmployeeStatus.ONBOARDING,
      startDate: new Date("2024-11-15"),
    },
    {
      employeeCode: "EMP-009",
      firstName: "Isabella",
      lastName: "Do",
      email: "isabella@example.com",
      departmentId: finance?.id,
      positionId: positionMap["Finance Analyst"],
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2023-09-01"),
    },
    {
      employeeCode: "EMP-010",
      firstName: "Jack",
      lastName: "Pham",
      email: "jack@example.com",
      departmentId: sales?.id,
      positionId: positionMap["Sales Executive"],
      status: EmployeeStatus.ACTIVE,
      startDate: new Date("2024-01-05"),
    },
  ];

  for (const emp of seedEmployees) {
    const manager = emp.managerCode
      ? await prisma.employee.findUnique({ where: { employeeCode: emp.managerCode } })
      : null;

    await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        status: emp.status,
        departmentId: emp.departmentId,
        positionId: emp.positionId,
        managerId: manager?.id,
        startDate: emp.startDate,
        endDate: emp.endDate,
      },
      create: {
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        status: emp.status,
        departmentId: emp.departmentId,
        positionId: emp.positionId,
        managerId: manager?.id,
        startDate: emp.startDate,
        endDate: emp.endDate,
      },
    });
  }
}

async function seedContractsAndTemplates() {
  const templates = [
    {
      name: "Full-time Offer",
      type: "FULL_TIME",
      content: `
        <h1>Employment Agreement</h1>
        <p>This agreement is between {{employee.name}} and {{company.name}}.</p>
        <p>Start Date: {{contract.startDate}}</p>
        <p>Base Salary: {{cost.total}} {{cost.currency}}</p>
        <p>Role: {{employee.position}}</p>
      `,
      mergeFields: {
        employee: ["name", "position", "department"],
        contract: ["startDate", "endDate", "type"],
        cost: ["total", "currency"],
      },
    },
    {
      name: "Contractor Agreement",
      type: "CONTRACTOR",
      content: `
        <h1>Contractor Agreement</h1>
        <p>Contractor: {{employee.name}}</p>
        <p>Engagement: {{contract.type}}</p>
        <p>Start: {{contract.startDate}} - End: {{contract.endDate}}</p>
        <p>Rate: {{cost.total}} per month</p>
      `,
      mergeFields: {
        employee: ["name", "position"],
        contract: ["startDate", "endDate", "type"],
        cost: ["total"],
      },
    },
    {
      name: "Intern Agreement",
      type: "INTERN",
      content: `
        <h1>Internship Agreement</h1>
        <p>Intern: {{employee.name}}</p>
        <p>Department: {{employee.department}}</p>
        <p>Start Date: {{contract.startDate}}</p>
      `,
      mergeFields: {
        employee: ["name", "department"],
        contract: ["startDate"],
      },
    },
  ];

  for (const tmpl of templates) {
    await prisma.contractTemplate.upsert({
      where: { name: tmpl.name },
      update: {
        type: tmpl.type,
        content: tmpl.content,
        mergeFields: tmpl.mergeFields,
      },
      create: {
        name: tmpl.name,
        type: tmpl.type,
        content: tmpl.content,
        mergeFields: tmpl.mergeFields,
      },
    });
  }

  const firstEmployee = await prisma.employee.findUnique({ where: { employeeCode: "EMP-001" } });
  const template = await prisma.contractTemplate.findFirst({
    where: { name: "Full-time Offer" },
  });

  if (firstEmployee && template) {
    const contract = await prisma.contract.upsert({
      where: { id: `${firstEmployee.id}-contract` },
      update: {
        generatedContent: template.content,
        templateId: template.id,
        type: ContractType.FULL_TIME,
        status: ContractStatus.ACTIVE,
      },
      create: {
        id: `${firstEmployee.id}-contract`,
        employeeId: firstEmployee.id,
        templateId: template.id,
        startDate: new Date("2023-01-15"),
        status: ContractStatus.ACTIVE,
        type: ContractType.FULL_TIME,
        generatedContent: template.content,
      },
    });

    await prisma.contractCost.upsert({
      where: { id: `${contract.id}-base-salary` },
      update: {
        amount: 85000,
        currency: "USD",
        note: "Annual base salary",
      },
      create: {
        id: `${contract.id}-base-salary`,
        contractId: contract.id,
        costType: CostType.PAYROLL,
        amount: 85000,
        currency: "USD",
        note: "Annual base salary",
        effectiveDate: new Date("2023-01-15"),
      },
    });
  }
}

async function seedReports() {
  const templates = [
    {
      name: "Headcount by Department",
      description: "Active employees grouped by department",
      jsonSchema: {
        type: "object",
        properties: {
          from: { type: "string", format: "date", title: "From" },
          to: { type: "string", format: "date", title: "To" },
        },
      },
      queryDefinition: {
        source: "employee",
        filters: [{ field: "status", op: "=", value: "ACTIVE" }],
        groupBy: ["department"],
        metrics: [{ field: "id", op: "count", alias: "headcount" }],
      },
      outputLayout: {
        type: "table",
        columns: ["department", "headcount"],
      },
    },
    {
      name: "Contract Cost Summary",
      description: "Total contract cost by type",
      jsonSchema: {
        type: "object",
        properties: {
          department: { type: "string", title: "Department Code" },
        },
      },
      queryDefinition: {
        source: "contractCost",
        groupBy: ["costType"],
        metrics: [{ field: "amount", op: "sum", alias: "total" }],
      },
      outputLayout: {
        type: "table",
        columns: ["costType", "total"],
      },
    },
  ];

  for (const tmpl of templates) {
    await prisma.reportTemplate.upsert({
      where: { name: tmpl.name },
      update: {
        description: tmpl.description,
        jsonSchema: tmpl.jsonSchema,
        queryDefinition: tmpl.queryDefinition,
        outputLayout: tmpl.outputLayout,
      },
      create: tmpl,
    });
  }

  const reportTemplate = await prisma.reportTemplate.findUnique({
    where: { name: "Headcount by Department" },
  });

  if (reportTemplate) {
    await prisma.scheduledReport.upsert({
      where: { id: `${reportTemplate.id}-weekly` },
      update: {
        scheduleCron: "0 9 * * 1",
        recipients: ["hr@example.com"],
        active: true,
      },
      create: {
        id: `${reportTemplate.id}-weekly`,
        templateId: reportTemplate.id,
        scheduleCron: "0 9 * * 1",
        recipients: ["hr@example.com"],
        active: true,
      },
    });
  }
}

async function main() {
  const permissionMap = await seedPermissions();

  await seedRole(
    "ADMIN",
    "Full access to all modules",
    Object.keys(permissionMap),
    PermissionScope.ALL,
    permissionMap,
  );

  await seedRole(
    "HR",
    "HR operations",
    [
      "dashboard:view",
      "employees:view",
      "employees:create",
      "employees:edit",
      "contracts:view",
      "contracts:create",
      "contracts:edit",
      "contracts:generate",
      "contracts:costs",
      "reports:view",
      "reports:create",
      "reports:run",
      "reports:export",
      "automations:ai",
      "scheduler:manage",
    ],
    PermissionScope.ALL,
    permissionMap,
  );

  await seedRole(
    "MANAGER",
    "Manager with department scope",
    [
      "dashboard:view",
      "employees:view",
      "employees:edit",
      "contracts:view",
      "contracts:generate",
      "reports:view",
      "reports:run",
    ],
    PermissionScope.DEPARTMENT,
    permissionMap,
  );

  await seedOrg();
  await seedEmployees();
  await seedContractsAndTemplates();
  await seedReports();

  await seedUser("admin@demo.com", "Admin123!", "Admin User", ["ADMIN"]);
  await seedUser("hr@demo.com", "Hr123!", "HR User", ["HR"]);
  await seedUser("manager@demo.com", "Manager123!", "Manager User", ["MANAGER"]);

  console.log("Seeding complete ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
