import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index, decimal, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Companies table for multi-tenant support
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  logo: varchar("logo"),
  website: varchar("website"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  description: text("description"),
  industry: varchar("industry").default("pool_construction"),
  companyCode: varchar("company_code", { length: 10 }).unique().notNull(),
  ownerId: varchar("owner_id").notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company documents table
export const companyDocuments = pgTable("company_documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type").notNull(), // 'license', 'insurance', 'contract_template', 'other'
  fileUrl: text("file_url").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company locations/offices table
export const companyLocations = pgTable("company_locations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User invitations table
export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  role: varchar("role").notNull().default("user"), // 'admin', 'manager', 'user'
  invitedBy: varchar("invited_by").notNull(),
  token: varchar("token", { length: 100 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User storage table (Required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  companyId: integer("company_id").references(() => companies.id),
  role: varchar("role").default("user"), // 'admin', 'manager', 'user'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers/Leads table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  leadSource: text("lead_source"), // website, referral, marketing, etc.
  status: text("status").notNull().default("new_lead"), // new_lead, design, design_meeting, redesign, bid, budget_meeting, rebid, sign_contract, sold, on_hold, waiting_on_financing, lost_lead, bad_lead
  salesperson: text("salesperson"), // assigned salesperson
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  name: text("name").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  salespersonId: varchar("salesperson_id").references(() => users.id),
  types: text("types").array().notNull().default(["pool_spa"]), // pool_spa, pool_only, decking, patio_cover, pergola, outdoor_kitchen, driveway
  status: text("status").notNull().default("planning"), // planning, excavation, plumbing, electrical, gunite, finishing, completed, on_hold
  budget: decimal("budget", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }).default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  estimatedCompletion: timestamp("estimated_completion"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  description: text("description"),
  poolSpecs: jsonb("pool_specs"), // size, depth, features, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project todos table
export const projectTodos = pgTable("project_todos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Estimates table
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  customerId: integer("customer_id").references(() => customers.id),
  projectType: text("project_type").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, approved, rejected, expired
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Estimate line items
export const estimateItems = pgTable("estimate_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id").references(() => estimates.id),
  category: text("category").notNull(), // labor, materials, equipment, permits, etc.
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // equipment_supplier, subcontractor, material_supplier
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  specialty: text("specialty"), // pool_equipment, plumbing, electrical, concrete, etc.
  rating: integer("rating"), // 1-5 star rating
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  phase: text("phase").notNull(), // site_prep, excavation, steel_rebar, plumbing, electrical, gunite, finishing, etc.
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, blocked
  priority: text("priority").default("medium"), // high, medium, low
  assignedTo: text("assigned_to"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment table
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  name: text("name").notNull(),
  model: text("model"),
  brand: text("brand"),
  category: text("category").notNull(), // pump, heater, filter, automation, lighting, etc.
  status: text("status").notNull().default("available"), // available, in_use, maintenance, ordered, delayed
  cost: decimal("cost", { precision: 10, scale: 2 }),
  vendorId: integer("vendor_id").references(() => vendors.id),
  specifications: jsonb("specifications"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Equipment (many-to-many)
export const projectEquipment = pgTable("project_equipment", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("planned"), // planned, ordered, delivered, installed
  deliveryDate: timestamp("delivery_date"),
  installationDate: timestamp("installation_date"),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // permit, design, contract, photo, inspection, etc.
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Change orders table
export const changeOrders = pgTable("change_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reason: text("reason"), // customer_request, unforeseen_conditions, code_requirements, etc.
  status: text("status").notNull().default("pending"), // pending, approved, rejected, implemented
  costChange: decimal("cost_change", { precision: 10, scale: 2 }).notNull(),
  timeChange: integer("time_change"), // days
  requestedBy: varchar("requested_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity log for tracking project updates
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // photo_upload, status_change, task_completed, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // additional data like file paths, old/new values, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Internal messages for salesperson notifications
export const internalMessages = pgTable("internal_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  todoId: integer("todo_id").references(() => projectTodos.id),
  recipientId: varchar("recipient_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cost management tables
export const costCategories = pgTable("cost_categories", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const costItems = pgTable("cost_items", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  categoryId: integer("category_id").notNull().references(() => costCategories.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  unitType: varchar("unit_type", { length: 50 }).notNull(), // sq_ft, linear_ft, cubic_yard, each, hour, etc.
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  supplierName: varchar("supplier_name", { length: 100 }),
  supplierContact: varchar("supplier_contact", { length: 100 }),
  notes: text("notes"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const costHistory = pgTable("cost_history", {
  id: serial("id").primaryKey(),
  costItemId: integer("cost_item_id").notNull().references(() => costItems.id),
  previousCost: decimal("previous_cost", { precision: 10, scale: 2 }).notNull(),
  newCost: decimal("new_cost", { precision: 10, scale: 2 }).notNull(),
  changeReason: varchar("change_reason", { length: 200 }),
  changedBy: varchar("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
  estimates: many(estimates),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  tasks: many(tasks),
  equipment: many(projectEquipment),
  documents: many(documents),
  changeOrders: many(changeOrders),
  activities: many(activities),
  todos: many(projectTodos),
}));

export const projectTodosRelations = relations(projectTodos, ({ one }) => ({
  project: one(projects, {
    fields: [projectTodos.projectId],
    references: [projects.id],
  }),
}));

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  customer: one(customers, {
    fields: [estimates.customerId],
    references: [customers.id],
  }),
  items: many(estimateItems),
}));

export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateItems.estimateId],
    references: [estimates.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  equipment: many(equipment),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [equipment.vendorId],
    references: [vendors.id],
  }),
  projects: many(projectEquipment),
}));

export const projectEquipmentRelations = relations(projectEquipment, ({ one }) => ({
  project: one(projects, {
    fields: [projectEquipment.projectId],
    references: [projects.id],
  }),
  equipment: one(equipment, {
    fields: [projectEquipment.equipmentId],
    references: [equipment.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const changeOrdersRelations = relations(changeOrders, ({ one }) => ({
  project: one(projects, {
    fields: [changeOrders.projectId],
    references: [projects.id],
  }),
  requestedBy: one(users, {
    fields: [changeOrders.requestedBy],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [changeOrders.approvedBy],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const costCategoriesRelations = relations(costCategories, ({ many }) => ({
  costItems: many(costItems),
}));

export const costItemsRelations = relations(costItems, ({ one, many }) => ({
  category: one(costCategories, {
    fields: [costItems.categoryId],
    references: [costCategories.id],
  }),
  history: many(costHistory),
}));

export const costHistoryRelations = relations(costHistory, ({ one }) => ({
  costItem: one(costItems, {
    fields: [costHistory.costItemId],
    references: [costItems.id],
  }),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  types: z.array(z.enum(["pool_spa", "pool_only", "decking", "patio_cover", "pergola", "outdoor_kitchen", "driveway"])).min(1, "At least one project type is required"),
});

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEstimateItemSchema = createInsertSchema(estimateItems).omit({
  id: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChangeOrderSchema = createInsertSchema(changeOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertProjectTodoSchema = createInsertSchema(projectTodos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyDocumentSchema = createInsertSchema(companyDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyLocationSchema = createInsertSchema(companyLocations).omit({
  id: true,
  createdAt: true,
});

export const insertUserInvitationSchema = createInsertSchema(userInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertCostCategorySchema = createInsertSchema(costCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostItemSchema = createInsertSchema(costItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUpdated: true,
});

export const insertCostHistorySchema = createInsertSchema(costHistory).omit({
  id: true,
  changedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CompanyDocument = typeof companyDocuments.$inferSelect;
export type InsertCompanyDocument = z.infer<typeof insertCompanyDocumentSchema>;
export type CompanyLocation = typeof companyLocations.$inferSelect;
export type InsertCompanyLocation = z.infer<typeof insertCompanyLocationSchema>;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type EstimateItem = typeof estimateItems.$inferSelect;
export type InsertEstimateItem = z.infer<typeof insertEstimateItemSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type ProjectEquipment = typeof projectEquipment.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type ChangeOrder = typeof changeOrders.$inferSelect;
export type InsertChangeOrder = z.infer<typeof insertChangeOrderSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ProjectTodo = typeof projectTodos.$inferSelect;
export type InsertProjectTodo = z.infer<typeof insertProjectTodoSchema>;
export type InternalMessage = typeof internalMessages.$inferSelect;
export type InsertInternalMessage = typeof internalMessages.$inferInsert;
export type CostCategory = typeof costCategories.$inferSelect;
export type InsertCostCategory = z.infer<typeof insertCostCategorySchema>;
export type CostItem = typeof costItems.$inferSelect;
export type InsertCostItem = z.infer<typeof insertCostItemSchema>;
export type CostHistory = typeof costHistory.$inferSelect;
export type InsertCostHistory = z.infer<typeof insertCostHistorySchema>;
