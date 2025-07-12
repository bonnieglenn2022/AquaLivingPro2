import {
  users,
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
  type User,
  type UpsertUser,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, count } from "drizzle-orm";

export interface IStorage {
  // User operations (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
}

export const storage = new DatabaseStorage();
