import {
  users,
  companies,
  companyLocations,
  userInvitations,
  customers,
  projects,
  estimates,
  estimateItems,
  vendors,
  tasks,
  equipment,
  projectEquipment,
  documents,
  changeOrders,
  activities,
  projectTodos,
  internalMessages,
  costCategories,
  costItems,
  costHistory,
  costItemTiers,
  projectBudgets,
  budgetItems,
  purchaseOrders,
  purchaseOrderItems,
  workOrders,
  workOrderItems,
  vendorBills,
  vendorBillItems,
  customerInvoices,
  customerInvoiceItems,
  paymentRecords,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type CompanyLocation,
  type InsertCompanyLocation,
  type UserInvitation,
  type InsertUserInvitation,
  type Customer,
  type InsertCustomer,
  type Project,
  type InsertProject,
  type Estimate,
  type InsertEstimate,
  type EstimateItem,
  type InsertEstimateItem,
  type Vendor,
  type InsertVendor,
  type Task,
  type InsertTask,
  type Equipment,
  type InsertEquipment,
  type ProjectEquipment,
  type Document,
  type ChangeOrder,
  type InsertChangeOrder,
  type Activity,
  type InsertActivity,
  type ProjectTodo,
  type InsertProjectTodo,
  type InternalMessage,
  type InsertInternalMessage,
  type CostCategory,
  type InsertCostCategory,
  type CostItem,
  type InsertCostItem,
  type CostHistory,
  type InsertCostHistory,
  type CostItemTier,
  type InsertCostItemTier,
  type ProjectBudget,
  type InsertProjectBudget,
  type BudgetItem,
  type InsertBudgetItem,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  type WorkOrder,
  type InsertWorkOrder,
  type WorkOrderItem,
  type InsertWorkOrderItem,
  type VendorBill,
  type InsertVendorBill,
  type VendorBillItem,
  type InsertVendorBillItem,
  type CustomerInvoice,
  type InsertCustomerInvoice,
  type CustomerInvoiceItem,
  type InsertCustomerInvoiceItem,
  type PaymentRecord,
  type InsertPaymentRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, count } from "drizzle-orm";

export interface IStorage {
  // User operations (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByOwnerId(ownerId: string): Promise<Company | undefined>;
  getCompanyByCode(companyCode: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company>;

  // Company locations
  getCompanyLocations(companyId: number): Promise<CompanyLocation[]>;
  createCompanyLocation(location: InsertCompanyLocation): Promise<CompanyLocation>;

  // User invitations
  getInvitation(token: string): Promise<UserInvitation | undefined>;
  createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  acceptInvitation(token: string, userId: string): Promise<void>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByCustomer(customerId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Estimate operations
  getEstimates(): Promise<Estimate[]>;
  getEstimate(id: number): Promise<Estimate | undefined>;
  getEstimatesByCustomer(customerId: number): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: number, updates: Partial<InsertEstimate>): Promise<Estimate>;
  deleteEstimate(id: number): Promise<void>;

  // Estimate Item operations
  getEstimateItems(estimateId: number): Promise<EstimateItem[]>;
  createEstimateItem(item: InsertEstimateItem): Promise<EstimateItem>;
  updateEstimateItem(id: number, updates: Partial<InsertEstimateItem>): Promise<EstimateItem>;
  deleteEstimateItem(id: number): Promise<void>;

  // Vendor operations
  getVendors(): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: number): Promise<void>;

  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Equipment operations
  getEquipment(): Promise<Equipment[]>;
  getEquipmentItem(id: number): Promise<Equipment | undefined>;
  getEquipmentByProject(projectId: number): Promise<ProjectEquipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;

  // Change Order operations
  getChangeOrders(): Promise<ChangeOrder[]>;
  getChangeOrder(id: number): Promise<ChangeOrder | undefined>;
  getChangeOrdersByProject(projectId: number): Promise<ChangeOrder[]>;
  createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder>;
  updateChangeOrder(id: number, updates: Partial<InsertChangeOrder>): Promise<ChangeOrder>;
  deleteChangeOrder(id: number): Promise<void>;

  // Activity operations
  getActivities(): Promise<Activity[]>;
  getActivitiesByProject(projectId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    activeProjects: number;
    revenue: string;
    leads: number;
    tasks: number;
  }>;

  // Project Todo operations
  getProjectTodos(projectId: number): Promise<ProjectTodo[]>;
  createProjectTodo(todo: InsertProjectTodo): Promise<ProjectTodo>;
  updateProjectTodo(id: number, updates: Partial<InsertProjectTodo>): Promise<ProjectTodo>;
  deleteProjectTodo(id: number): Promise<void>;
  createDefaultTodos(projectId: number): Promise<void>;
  getNextTodo(projectId: number): Promise<ProjectTodo | undefined>;

  // Internal Message operations
  getInternalMessages(recipientId: string): Promise<InternalMessage[]>;
  createInternalMessage(message: InsertInternalMessage): Promise<InternalMessage>;
  markMessageAsRead(messageId: number): Promise<void>;

  // Cost Management operations
  getCostCategories(): Promise<CostCategory[]>;
  getCostCategory(id: number): Promise<CostCategory | undefined>;
  createCostCategory(category: InsertCostCategory): Promise<CostCategory>;
  updateCostCategory(id: number, updates: Partial<InsertCostCategory>): Promise<CostCategory>;
  deleteCostCategory(id: number): Promise<void>;

  getCostItems(categoryId?: number): Promise<CostItem[]>;
  getCostItem(id: number): Promise<CostItem | undefined>;
  createCostItem(item: InsertCostItem): Promise<CostItem>;
  updateCostItem(id: number, updates: Partial<InsertCostItem>): Promise<CostItem>;
  deleteCostItem(id: number): Promise<void>;

  getCostHistory(costItemId: number): Promise<CostHistory[]>;
  createCostHistory(history: InsertCostHistory): Promise<CostHistory>;

  // Project Budget operations
  getProjectBudgets(projectId: number): Promise<ProjectBudget[]>;
  getProjectBudget(id: number): Promise<ProjectBudget | undefined>;
  createProjectBudget(budget: InsertProjectBudget): Promise<ProjectBudget>;
  updateProjectBudget(id: number, updates: Partial<InsertProjectBudget>): Promise<ProjectBudget>;
  deleteProjectBudget(id: number): Promise<void>;

  // Budget Item operations
  getBudgetItems(budgetId: number): Promise<BudgetItem[]>;
  getBudgetItem(id: number): Promise<BudgetItem | undefined>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: number, updates: Partial<InsertBudgetItem>): Promise<BudgetItem>;
  deleteBudgetItem(id: number): Promise<void>;

  // Purchase Order operations
  getPurchaseOrders(projectId?: number): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(purchaseOrder: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, updates: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;
  deletePurchaseOrder(id: number): Promise<void>;

  // Purchase Order Item operations
  getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]>;
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(id: number, updates: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem>;
  deletePurchaseOrderItem(id: number): Promise<void>;

  // Work Order operations
  getWorkOrders(projectId?: number): Promise<WorkOrder[]>;
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: number, updates: Partial<InsertWorkOrder>): Promise<WorkOrder>;
  deleteWorkOrder(id: number): Promise<void>;

  // Work Order Item operations
  getWorkOrderItems(workOrderId: number): Promise<WorkOrderItem[]>;
  createWorkOrderItem(item: InsertWorkOrderItem): Promise<WorkOrderItem>;
  updateWorkOrderItem(id: number, updates: Partial<InsertWorkOrderItem>): Promise<WorkOrderItem>;
  deleteWorkOrderItem(id: number): Promise<void>;

  // Vendor Bill operations
  getVendorBills(projectId?: number): Promise<VendorBill[]>;
  getVendorBill(id: number): Promise<VendorBill | undefined>;
  createVendorBill(bill: InsertVendorBill): Promise<VendorBill>;
  updateVendorBill(id: number, updates: Partial<InsertVendorBill>): Promise<VendorBill>;
  deleteVendorBill(id: number): Promise<void>;

  // Vendor Bill Item operations
  getVendorBillItems(billId: number): Promise<VendorBillItem[]>;
  createVendorBillItem(item: InsertVendorBillItem): Promise<VendorBillItem>;
  updateVendorBillItem(id: number, updates: Partial<InsertVendorBillItem>): Promise<VendorBillItem>;
  deleteVendorBillItem(id: number): Promise<void>;

  // Customer Invoice operations
  getCustomerInvoices(projectId?: number): Promise<CustomerInvoice[]>;
  getCustomerInvoice(id: number): Promise<CustomerInvoice | undefined>;
  createCustomerInvoice(invoice: InsertCustomerInvoice): Promise<CustomerInvoice>;
  updateCustomerInvoice(id: number, updates: Partial<InsertCustomerInvoice>): Promise<CustomerInvoice>;
  deleteCustomerInvoice(id: number): Promise<void>;

  // Customer Invoice Item operations
  getCustomerInvoiceItems(invoiceId: number): Promise<CustomerInvoiceItem[]>;
  createCustomerInvoiceItem(item: InsertCustomerInvoiceItem): Promise<CustomerInvoiceItem>;
  updateCustomerInvoiceItem(id: number, updates: Partial<InsertCustomerInvoiceItem>): Promise<CustomerInvoiceItem>;
  deleteCustomerInvoiceItem(id: number): Promise<void>;

  // Payment Record operations
  getPaymentRecords(invoiceId: number): Promise<PaymentRecord[]>;
  createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord>;
  updatePaymentRecord(id: number, updates: Partial<InsertPaymentRecord>): Promise<PaymentRecord>;
  deletePaymentRecord(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (Required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByOwnerId(ownerId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.ownerId, ownerId));
    return company;
  }

  async getCompanyByCode(companyCode: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.companyCode, companyCode));
    return company;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(companyData)
      .returning();
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  // Company locations
  async getCompanyLocations(companyId: number): Promise<CompanyLocation[]> {
    return await db.select().from(companyLocations).where(eq(companyLocations.companyId, companyId));
  }

  async createCompanyLocation(locationData: InsertCompanyLocation): Promise<CompanyLocation> {
    const [location] = await db
      .insert(companyLocations)
      .values(locationData)
      .returning();
    return location;
  }

  // User invitations
  async getInvitation(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db.select().from(userInvitations).where(eq(userInvitations.token, token));
    return invitation;
  }

  async createInvitation(invitationData: InsertUserInvitation): Promise<UserInvitation> {
    const [invitation] = await db
      .insert(userInvitations)
      .values(invitationData)
      .returning();
    return invitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.getInvitation(token);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation expired");
    }

    if (invitation.acceptedAt) {
      throw new Error("Invitation already accepted");
    }

    // Update user with company and role
    await db
      .update(users)
      .set({
        companyId: invitation.companyId,
        role: invitation.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Mark invitation as accepted
    await db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.token, token));
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByCustomer(customerId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.customerId, customerId));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Estimate operations
  async getEstimates(): Promise<Estimate[]> {
    return await db.select().from(estimates).orderBy(desc(estimates.createdAt));
  }

  async getEstimate(id: number): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id));
    return estimate;
  }

  async getEstimatesByCustomer(customerId: number): Promise<Estimate[]> {
    return await db.select().from(estimates).where(eq(estimates.customerId, customerId));
  }

  async createEstimate(estimate: InsertEstimate): Promise<Estimate> {
    const [newEstimate] = await db.insert(estimates).values(estimate).returning();
    return newEstimate;
  }

  async updateEstimate(id: number, updates: Partial<InsertEstimate>): Promise<Estimate> {
    const [updatedEstimate] = await db
      .update(estimates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(estimates.id, id))
      .returning();
    return updatedEstimate;
  }

  async deleteEstimate(id: number): Promise<void> {
    await db.delete(estimates).where(eq(estimates.id, id));
  }

  // Estimate Item operations
  async getEstimateItems(estimateId: number): Promise<EstimateItem[]> {
    return await db.select().from(estimateItems).where(eq(estimateItems.estimateId, estimateId));
  }

  async createEstimateItem(item: InsertEstimateItem): Promise<EstimateItem> {
    const [newItem] = await db.insert(estimateItems).values(item).returning();
    return newItem;
  }

  async updateEstimateItem(id: number, updates: Partial<InsertEstimateItem>): Promise<EstimateItem> {
    const [updatedItem] = await db
      .update(estimateItems)
      .set(updates)
      .where(eq(estimateItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteEstimateItem(id: number): Promise<void> {
    await db.delete(estimateItems).where(eq(estimateItems.id, id));
  }

  // Vendor operations
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).where(eq(vendors.isActive, true)).orderBy(vendors.name);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor> {
    const [updatedVendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor;
  }

  async deleteVendor(id: number): Promise<void> {
    await db.update(vendors).set({ isActive: false }).where(eq(vendors.id, id));
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.dueDate);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(tasks.dueDate);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Equipment operations
  async getEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment).orderBy(equipment.name);
  }

  async getEquipmentItem(id: number): Promise<Equipment | undefined> {
    const [item] = await db.select().from(equipment).where(eq(equipment.id, id));
    return item;
  }

  async getEquipmentByProject(projectId: number): Promise<ProjectEquipment[]> {
    return await db.select().from(projectEquipment).where(eq(projectEquipment.projectId, projectId));
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db.insert(equipment).values(equipmentData).returning();
    return newEquipment;
  }

  async updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment> {
    const [updatedEquipment] = await db
      .update(equipment)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return updatedEquipment;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  // Change Order operations
  async getChangeOrders(): Promise<ChangeOrder[]> {
    return await db.select().from(changeOrders).orderBy(desc(changeOrders.createdAt));
  }

  async getChangeOrder(id: number): Promise<ChangeOrder | undefined> {
    const [changeOrder] = await db.select().from(changeOrders).where(eq(changeOrders.id, id));
    return changeOrder;
  }

  async getChangeOrdersByProject(projectId: number): Promise<ChangeOrder[]> {
    return await db.select().from(changeOrders).where(eq(changeOrders.projectId, projectId));
  }

  async createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder> {
    const [newChangeOrder] = await db.insert(changeOrders).values(changeOrder).returning();
    return newChangeOrder;
  }

  async updateChangeOrder(id: number, updates: Partial<InsertChangeOrder>): Promise<ChangeOrder> {
    const [updatedChangeOrder] = await db
      .update(changeOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(changeOrders.id, id))
      .returning();
    return updatedChangeOrder;
  }

  async deleteChangeOrder(id: number): Promise<void> {
    await db.delete(changeOrders).where(eq(changeOrders.id, id));
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50);
  }

  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    activeProjects: number;
    revenue: string;
    leads: number;
    tasks: number;
  }> {
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(
        and(
          or(
            eq(projects.status, "planning"),
            eq(projects.status, "excavation"),
            eq(projects.status, "plumbing"),
            eq(projects.status, "electrical"),
            eq(projects.status, "gunite"),
            eq(projects.status, "finishing")
          )
        )
      );

    const [revenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${projects.budget}), 0)::text`
      })
      .from(projects)
      .where(
        and(
          or(
            eq(projects.status, "planning"),
            eq(projects.status, "excavation"),
            eq(projects.status, "plumbing"),
            eq(projects.status, "electrical"),
            eq(projects.status, "gunite"),
            eq(projects.status, "finishing")
          )
        )
      );

    const [leadsResult] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.status, "lead"));

    const [tasksResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          or(eq(tasks.status, "pending"), eq(tasks.status, "in_progress")),
          sql`${tasks.dueDate} <= NOW() + INTERVAL '7 days'`
        )
      );

    return {
      activeProjects: activeProjectsResult.count,
      revenue: revenueResult.total || "0",
      leads: leadsResult.count,
      tasks: tasksResult.count,
    };
  }

  // Project Todo operations
  async getProjectTodos(projectId: number): Promise<ProjectTodo[]> {
    return await db.select().from(projectTodos).where(eq(projectTodos.projectId, projectId)).orderBy(projectTodos.order);
  }

  async createProjectTodo(todo: InsertProjectTodo): Promise<ProjectTodo> {
    const [newTodo] = await db.insert(projectTodos).values(todo).returning();
    return newTodo;
  }

  async updateProjectTodo(id: number, updates: Partial<InsertProjectTodo>): Promise<ProjectTodo> {
    const [updatedTodo] = await db
      .update(projectTodos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectTodos.id, id))
      .returning();
    return updatedTodo;
  }

  async deleteProjectTodo(id: number): Promise<void> {
    await db.delete(projectTodos).where(eq(projectTodos.id, id));
  }

  async createDefaultTodos(projectId: number): Promise<void> {
    const defaultTodos = [
      { title: "Customer Deposit", description: "Collect deposit from customer", order: 1 },
      { title: "Submit HOA", description: "Submit HOA application", order: 2 },
      { title: "Submit Permit", description: "Submit permit application", order: 3 },
      { title: "HOA Approval", description: "Receive HOA approval", order: 4 },
      { title: "Permit Approval", description: "Receive permit approval", order: 5 },
      { title: "Order 811", description: "Order 811 utility marking", order: 6 },
      { title: "Neighbor Access Agreement", description: "Get neighbor access agreement", order: 7 },
      { title: "Signed Site Plan", description: "Get signed site plan", order: 8 },
      { title: "Advise Customer about Communication Line Cut", description: "Inform customer about communication line cut", order: 9 },
      { title: "811 Refresh", description: "Refresh 811 utility marking", order: 10 },
      { title: "Material Selections", description: "Complete material selections", order: 11 },
      { title: "Schedule Excavation", description: "Schedule excavation work", order: 12 },
      { title: "Order Stub Out", description: "Order stub out materials", order: 13 },
      { title: "Schedule Rebar", description: "Schedule rebar installation", order: 14 },
      { title: "Schedule Gunite", description: "Schedule gunite application", order: 15 },
      { title: "Order Equipment", description: "Order pool equipment", order: 16 },
      { title: "Schedule Gunite Cleanup", description: "Schedule gunite cleanup", order: 17 },
      { title: "Schedule Long Plumb", description: "Schedule long plumb work", order: 18 },
      { title: "Schedule Tile & Coping", description: "Schedule tile and coping installation", order: 19 },
      { title: "Schedule Decking", description: "Schedule decking installation", order: 20 },
      { title: "Schedule Final Cleanup", description: "Schedule final cleanup", order: 21 },
      { title: "Schedule Plaster", description: "Schedule plaster application", order: 22 },
      { title: "Order Start Up", description: "Order start up service", order: 23 },
      { title: "Confirm Pool is Full", description: "Confirm pool is filled", order: 24 },
      { title: "Pictures & Reviews", description: "Take final pictures and get reviews", order: 25 },
    ];

    const todosToInsert = defaultTodos.map(todo => ({
      ...todo,
      projectId,
      completed: false,
    }));

    await db.insert(projectTodos).values(todosToInsert);
  }
  async getNextTodo(projectId: number): Promise<ProjectTodo | undefined> {
    const [nextTodo] = await db
      .select()
      .from(projectTodos)
      .where(and(eq(projectTodos.projectId, projectId), eq(projectTodos.completed, false)))
      .orderBy(projectTodos.order)
      .limit(1);
    return nextTodo;
  }

  async getInternalMessages(recipientId: string): Promise<InternalMessage[]> {
    return await db
      .select()
      .from(internalMessages)
      .where(eq(internalMessages.recipientId, recipientId))
      .orderBy(desc(internalMessages.createdAt));
  }

  async createInternalMessage(message: InsertInternalMessage): Promise<InternalMessage> {
    const [newMessage] = await db
      .insert(internalMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(internalMessages)
      .set({ read: true })
      .where(eq(internalMessages.id, messageId));
  }

  // Cost Management operations
  async getCostCategories(companyId?: number): Promise<CostCategory[]> {
    const query = db
      .select()
      .from(costCategories)
      .where(eq(costCategories.isActive, true));

    if (companyId) {
      query.where(and(eq(costCategories.isActive, true), eq(costCategories.companyId, companyId)));
    }

    return await query.orderBy(costCategories.sortOrder, costCategories.name);
  }

  async getCostCategory(id: number): Promise<CostCategory | undefined> {
    const [category] = await db
      .select()
      .from(costCategories)
      .where(eq(costCategories.id, id));
    return category;
  }

  async createCostCategory(category: InsertCostCategory): Promise<CostCategory> {
    const [newCategory] = await db
      .insert(costCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCostCategory(id: number, updates: Partial<InsertCostCategory>): Promise<CostCategory> {
    const [updatedCategory] = await db
      .update(costCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(costCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCostCategory(id: number): Promise<void> {
    await db
      .update(costCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(costCategories.id, id));
  }

  async getCostItems(companyId?: number, categoryId?: number): Promise<CostItem[]> {
    let whereConditions = [eq(costItems.isActive, true)];

    if (companyId) {
      whereConditions.push(eq(costItems.companyId, companyId));
    }

    if (categoryId) {
      whereConditions.push(eq(costItems.categoryId, categoryId));
    }

    return await db
      .select()
      .from(costItems)
      .where(and(...whereConditions))
      .orderBy(costItems.name);
  }

  async getCostItem(id: number): Promise<CostItem | undefined> {
    const [item] = await db
      .select()
      .from(costItems)
      .where(eq(costItems.id, id));
    return item;
  }

  async createCostItem(item: InsertCostItem): Promise<CostItem> {
    const [newItem] = await db
      .insert(costItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateCostItem(id: number, updates: Partial<InsertCostItem>): Promise<CostItem> {
    // If cost is being updated, create history entry
    if (updates.costPerUnit) {
      const existingItem = await this.getCostItem(id);
      if (existingItem && existingItem.costPerUnit !== updates.costPerUnit.toString()) {
        await this.createCostHistory({
          costItemId: id,
          previousCost: existingItem.costPerUnit,
          newCost: updates.costPerUnit.toString(),
          changeReason: "Price update",
          changedBy: "system", // This would be the actual user ID in a real implementation
        });
      }
    }

    const [updatedItem] = await db
      .update(costItems)
      .set({ ...updates, updatedAt: new Date(), lastUpdated: new Date() })
      .where(eq(costItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteCostItem(id: number): Promise<void> {
    await db
      .update(costItems)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(costItems.id, id));
  }

  async getCostHistory(costItemId: number): Promise<CostHistory[]> {
    return await db
      .select()
      .from(costHistory)
      .where(eq(costHistory.costItemId, costItemId))
      .orderBy(desc(costHistory.changedAt));
  }

  async createCostHistory(history: InsertCostHistory): Promise<CostHistory> {
    const [newHistory] = await db
      .insert(costHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  // Cost Item Tier operations
  async getCostItemTiers(costItemId: number): Promise<CostItemTier[]> {
    return await db
      .select()
      .from(costItemTiers)
      .where(eq(costItemTiers.costItemId, costItemId))
      .orderBy(costItemTiers.sortOrder, costItemTiers.minValue);
  }

  async createCostItemTier(tier: InsertCostItemTier): Promise<CostItemTier> {
    const [newTier] = await db
      .insert(costItemTiers)
      .values(tier)
      .returning();
    return newTier;
  }

  async updateCostItemTier(id: number, updates: Partial<InsertCostItemTier>): Promise<CostItemTier> {
    const [updatedTier] = await db
      .update(costItemTiers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(costItemTiers.id, id))
      .returning();
    return updatedTier;
  }

  async deleteCostItemTier(id: number): Promise<void> {
    await db
      .delete(costItemTiers)
      .where(eq(costItemTiers.id, id));
  }

  async createCostItemWithTiers(item: InsertCostItem, tiers: InsertCostItemTier[]): Promise<CostItem> {
    // Create the cost item with tiered pricing enabled
    const [newItem] = await db
      .insert(costItems)
      .values({ ...item, hasTieredPricing: true })
      .returning();

    // Create the tiers
    if (tiers.length > 0) {
      const tiersToInsert = tiers.map((tier, index) => ({
        ...tier,
        costItemId: newItem.id,
        sortOrder: index,
      }));
      await db.insert(costItemTiers).values(tiersToInsert);
    }

    return newItem;
  }

  // Project Budget operations
  async getProjectBudgets(projectId: number): Promise<ProjectBudget[]> {
    return await db
      .select()
      .from(projectBudgets)
      .where(eq(projectBudgets.projectId, projectId))
      .orderBy(desc(projectBudgets.createdAt));
  }

  async getProjectBudget(id: number): Promise<ProjectBudget | undefined> {
    const [budget] = await db
      .select()
      .from(projectBudgets)
      .where(eq(projectBudgets.id, id));
    return budget;
  }

  async createProjectBudget(budget: InsertProjectBudget): Promise<ProjectBudget> {
    const [newBudget] = await db
      .insert(projectBudgets)
      .values(budget)
      .returning();
    return newBudget;
  }

  async updateProjectBudget(id: number, updates: Partial<InsertProjectBudget>): Promise<ProjectBudget> {
    const [updatedBudget] = await db
      .update(projectBudgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectBudgets.id, id))
      .returning();
    return updatedBudget;
  }

  async deleteProjectBudget(id: number): Promise<void> {
    await db
      .delete(projectBudgets)
      .where(eq(projectBudgets.id, id));
  }

  // Budget Item operations
  async getBudgetItems(budgetId: number): Promise<BudgetItem[]> {
    return await db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, budgetId))
      .orderBy(budgetItems.sortOrder, budgetItems.name);
  }

  async getBudgetItem(id: number): Promise<BudgetItem | undefined> {
    const [item] = await db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.id, id));
    return item;
  }

  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db
      .insert(budgetItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateBudgetItem(id: number, updates: Partial<InsertBudgetItem>): Promise<BudgetItem> {
    const [updatedItem] = await db
      .update(budgetItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgetItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteBudgetItem(id: number): Promise<void> {
    await db
      .delete(budgetItems)
      .where(eq(budgetItems.id, id));
  }

  // Purchase Order operations
  async getPurchaseOrders(projectId?: number): Promise<PurchaseOrder[]> {
    const query = db
      .select()
      .from(purchaseOrders);

    if (projectId) {
      query.where(eq(purchaseOrders.projectId, projectId));
    }

    return await query.orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [order] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
    return order;
  }

  async createPurchaseOrder(purchaseOrder: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [newOrder] = await db
      .insert(purchaseOrders)
      .values(purchaseOrder)
      .returning();
    return newOrder;
  }

  async updatePurchaseOrder(id: number, updates: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const [updatedOrder] = await db
      .update(purchaseOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async deletePurchaseOrder(id: number): Promise<void> {
    await db
      .delete(purchaseOrders)
      .where(eq(purchaseOrders.id, id));
  }

  // Purchase Order Item operations
  async getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
    return await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId))
      .orderBy(purchaseOrderItems.sortOrder, purchaseOrderItems.name);
  }

  async createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const [newItem] = await db
      .insert(purchaseOrderItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updatePurchaseOrderItem(id: number, updates: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem> {
    const [updatedItem] = await db
      .update(purchaseOrderItems)
      .set(updates)
      .where(eq(purchaseOrderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deletePurchaseOrderItem(id: number): Promise<void> {
    await db
      .delete(purchaseOrderItems)
      .where(eq(purchaseOrderItems.id, id));
  }

  // Work Order operations
  async getWorkOrders(projectId?: number): Promise<WorkOrder[]> {
    const query = db
      .select()
      .from(workOrders);

    if (projectId) {
      query.where(eq(workOrders.projectId, projectId));
    }

    return await query.orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    const [order] = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.id, id));
    return order;
  }

  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const [newOrder] = await db
      .insert(workOrders)
      .values(workOrder)
      .returning();
    return newOrder;
  }

  async updateWorkOrder(id: number, updates: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const [updatedOrder] = await db
      .update(workOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteWorkOrder(id: number): Promise<void> {
    await db
      .delete(workOrders)
      .where(eq(workOrders.id, id));
  }

  // Work Order Item operations
  async getWorkOrderItems(workOrderId: number): Promise<WorkOrderItem[]> {
    return await db
      .select()
      .from(workOrderItems)
      .where(eq(workOrderItems.workOrderId, workOrderId))
      .orderBy(workOrderItems.sortOrder, workOrderItems.name);
  }

  async createWorkOrderItem(item: InsertWorkOrderItem): Promise<WorkOrderItem> {
    const [newItem] = await db
      .insert(workOrderItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateWorkOrderItem(id: number, updates: Partial<InsertWorkOrderItem>): Promise<WorkOrderItem> {
    const [updatedItem] = await db
      .update(workOrderItems)
      .set(updates)
      .where(eq(workOrderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteWorkOrderItem(id: number): Promise<void> {
    await db
      .delete(workOrderItems)
      .where(eq(workOrderItems.id, id));
  }

  // Vendor Bill operations
  async getVendorBills(projectId?: number): Promise<VendorBill[]> {
    const query = db
      .select()
      .from(vendorBills);

    if (projectId) {
      query.where(eq(vendorBills.projectId, projectId));
    }

    return await query.orderBy(desc(vendorBills.createdAt));
  }

  async getVendorBill(id: number): Promise<VendorBill | undefined> {
    const [bill] = await db
      .select()
      .from(vendorBills)
      .where(eq(vendorBills.id, id));
    return bill;
  }

  async createVendorBill(bill: InsertVendorBill): Promise<VendorBill> {
    const [newBill] = await db
      .insert(vendorBills)
      .values(bill)
      .returning();
    return newBill;
  }

  async updateVendorBill(id: number, updates: Partial<InsertVendorBill>): Promise<VendorBill> {
    const [updatedBill] = await db
      .update(vendorBills)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendorBills.id, id))
      .returning();
    return updatedBill;
  }

  async deleteVendorBill(id: number): Promise<void> {
    await db
      .delete(vendorBills)
      .where(eq(vendorBills.id, id));
  }

  // Vendor Bill Item operations
  async getVendorBillItems(billId: number): Promise<VendorBillItem[]> {
    return await db
      .select()
      .from(vendorBillItems)
      .where(eq(vendorBillItems.vendorBillId, billId))
      .orderBy(vendorBillItems.sortOrder, vendorBillItems.name);
  }

  async createVendorBillItem(item: InsertVendorBillItem): Promise<VendorBillItem> {
    const [newItem] = await db
      .insert(vendorBillItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateVendorBillItem(id: number, updates: Partial<InsertVendorBillItem>): Promise<VendorBillItem> {
    const [updatedItem] = await db
      .update(vendorBillItems)
      .set(updates)
      .where(eq(vendorBillItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteVendorBillItem(id: number): Promise<void> {
    await db
      .delete(vendorBillItems)
      .where(eq(vendorBillItems.id, id));
  }

  // Customer Invoice operations
  async getCustomerInvoices(projectId?: number): Promise<CustomerInvoice[]> {
    const query = db
      .select()
      .from(customerInvoices);

    if (projectId) {
      query.where(eq(customerInvoices.projectId, projectId));
    }

    return await query.orderBy(desc(customerInvoices.createdAt));
  }

  async getCustomerInvoice(id: number): Promise<CustomerInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(customerInvoices)
      .where(eq(customerInvoices.id, id));
    return invoice;
  }

  async createCustomerInvoice(invoice: InsertCustomerInvoice): Promise<CustomerInvoice> {
    const [newInvoice] = await db
      .insert(customerInvoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateCustomerInvoice(id: number, updates: Partial<InsertCustomerInvoice>): Promise<CustomerInvoice> {
    const [updatedInvoice] = await db
      .update(customerInvoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerInvoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteCustomerInvoice(id: number): Promise<void> {
    await db
      .delete(customerInvoices)
      .where(eq(customerInvoices.id, id));
  }

  // Customer Invoice Item operations
  async getCustomerInvoiceItems(invoiceId: number): Promise<CustomerInvoiceItem[]> {
    return await db
      .select()
      .from(customerInvoiceItems)
      .where(eq(customerInvoiceItems.invoiceId, invoiceId))
      .orderBy(customerInvoiceItems.sortOrder, customerInvoiceItems.name);
  }

  async createCustomerInvoiceItem(item: InsertCustomerInvoiceItem): Promise<CustomerInvoiceItem> {
    const [newItem] = await db
      .insert(customerInvoiceItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateCustomerInvoiceItem(id: number, updates: Partial<InsertCustomerInvoiceItem>): Promise<CustomerInvoiceItem> {
    const [updatedItem] = await db
      .update(customerInvoiceItems)
      .set(updates)
      .where(eq(customerInvoiceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteCustomerInvoiceItem(id: number): Promise<void> {
    await db
      .delete(customerInvoiceItems)
      .where(eq(customerInvoiceItems.id, id));
  }

  // Payment Record operations
  async getPaymentRecords(invoiceId: number): Promise<PaymentRecord[]> {
    return await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.invoiceId, invoiceId))
      .orderBy(desc(paymentRecords.createdAt));
  }

  async createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord> {
    const [newPayment] = await db
      .insert(paymentRecords)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePaymentRecord(id: number, updates: Partial<InsertPaymentRecord>): Promise<PaymentRecord> {
    const [updatedPayment] = await db
      .update(paymentRecords)
      .set(updates)
      .where(eq(paymentRecords.id, id))
      .returning();
    return updatedPayment;
  }

  async deletePaymentRecord(id: number): Promise<void> {
    await db
      .delete(paymentRecords)
      .where(eq(paymentRecords.id, id));
  }
}

export const storage = new DatabaseStorage();
