import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import { parse } from "csv-parse";
import { z } from "zod";
import { 
  insertCustomerSchema, 
  insertProjectSchema, 
  insertEstimateSchema, 
  insertEstimateItemSchema, 
  insertVendorSchema, 
  insertTaskSchema, 
  insertEquipmentSchema, 
  insertChangeOrderSchema, 
  insertActivitySchema, 
  insertProjectTodoSchema,
  insertCompanySchema,
  insertCompanyLocationSchema,
  insertUserInvitationSchema,
  insertProjectBudgetSchema,
  insertBudgetItemSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  insertWorkOrderSchema,
  insertWorkOrderItemSchema,
  insertVendorBillSchema,
  insertVendorBillItemSchema,
  insertCustomerInvoiceSchema,
  insertCustomerInvoiceItemSchema,
  insertPaymentRecordSchema,
  insertProjectBidItemSchema,
  insertSupplierSchema,
  insertSubcontractorSchema
} from "@shared/schema";

// Utility function to generate company codes
function generateCompanyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Parse vCard file content and extract contact information
function parseVCardFile(content: string): Array<{
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
}> {
  const contacts: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
  }> = [];

  // Split content into individual vCard entries
  const vCards = content.split(/BEGIN:VCARD/i).slice(1);

  for (const vCardContent of vCards) {
    const contact: any = {};
    const lines = vCardContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Parse full name (FN) or structured name (N)
      if (trimmedLine.startsWith('FN:')) {
        const fullName = trimmedLine.substring(3).trim();
        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          contact.firstName = nameParts[0];
          contact.lastName = nameParts.slice(1).join(' ');
        }
      } else if (trimmedLine.startsWith('N:')) {
        // N format: LastName;FirstName;MiddleName;Prefix;Suffix
        const nameParts = trimmedLine.substring(2).split(';');
        if (nameParts.length >= 2) {
          contact.lastName = nameParts[0].trim();
          contact.firstName = nameParts[1].trim();
        }
      }
      
      // Parse email
      else if (trimmedLine.includes('EMAIL')) {
        const emailMatch = trimmedLine.match(/EMAIL[^:]*:(.+)/i);
        if (emailMatch) {
          contact.email = emailMatch[1].trim();
        }
      }
      
      // Parse phone number
      else if (trimmedLine.includes('TEL')) {
        const phoneMatch = trimmedLine.match(/TEL[^:]*:(.+)/i);
        if (phoneMatch) {
          // Clean up phone number - remove non-digit characters except + and spaces
          const phone = phoneMatch[1].trim().replace(/[^\d\s\+\-\(\)]/g, '');
          if (phone) {
            contact.phone = phone;
          }
        }
      }
      
      // Parse address
      else if (trimmedLine.includes('ADR')) {
        const addressMatch = trimmedLine.match(/ADR[^:]*:(.+)/i);
        if (addressMatch) {
          // ADR format: PostOfficeBox;ExtendedAddress;Street;Locality;Region;PostalCode;Country
          const addressParts = addressMatch[1].split(';');
          const street = addressParts[2]?.trim();
          if (street) {
            contact.address = street;
          }
        }
      }
    }

    // Only add contacts that have at least a first and last name
    if (contact.firstName && contact.lastName) {
      contacts.push({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        address: contact.address || undefined,
      });
    }
  }

  return contacts;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/vcard'];
    const allowedExtensions = ['.csv', '.xls', '.xlsx', '.vcf'];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and vCard files are allowed'));
    }
  }
});


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Company routes
  app.get('/api/user/company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.companyId) {
        return res.json(null);
      }
      
      const company = await storage.getCompany(user.companyId);
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already owns a company
      const existingCompany = await storage.getCompanyByOwnerId(userId);
      if (existingCompany) {
        return res.status(400).json({ message: "User already owns a company" });
      }

      const data = req.body;
      const { locations, ...companyData } = data;

      // Generate a unique company code
      let companyCode: string;
      let attempts = 0;
      do {
        companyCode = generateCompanyCode();
        const existing = await storage.getCompanyByCode(companyCode);
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        return res.status(500).json({ message: "Failed to generate unique company code" });
      }

      // Validate company data
      const validatedCompany = insertCompanySchema.parse({
        ...companyData,
        companyCode,
        ownerId: userId,
        slug: companyData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });

      // Create company
      const company = await storage.createCompany(validatedCompany);

      // Create company locations
      if (locations && Array.isArray(locations)) {
        for (const location of locations) {
          const validatedLocation = insertCompanyLocationSchema.parse({
            ...location,
            companyId: company.id,
          });
          await storage.createCompanyLocation(validatedLocation);
        }
      }

      // Update user with company and admin role
      await storage.upsertUser({
        id: userId,
        companyId: company.id,
        role: 'admin',
        updatedAt: new Date(),
      });

      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.post('/api/companies/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { companyCode } = req.body;
      
      if (!companyCode) {
        return res.status(400).json({ message: "Company code is required" });
      }
      
      // Find company by code
      const company = await storage.getCompanyByCode(companyCode.toUpperCase());
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Update user's companyId
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user to join the company
      await storage.upsertUser({
        ...user,
        companyId: company.id,
      });
      
      res.json({ 
        message: "Successfully joined company",
        company 
      });
    } catch (error) {
      console.error("Error joining company:", error);
      res.status(500).json({ message: "Failed to join company" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Import leads from iPhone contacts (vCard)
  app.post('/api/customers/import-contacts', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Validate file type
      if (!req.file.originalname.toLowerCase().endsWith('.vcf')) {
        return res.status(400).json({ message: 'Only vCard (.vcf) files are supported' });
      }

      // Validate file size (5MB max)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'File size must be less than 5MB' });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const contacts = parseVCardFile(fileContent);
      
      let imported = 0;
      let skipped = 0;

      for (const contact of contacts) {
        try {
          // Only import contacts with both first and last names
          if (contact.firstName && contact.lastName) {
            await storage.createCustomer({
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email || null,
              phone: contact.phone || null,
              address: contact.address || null,
              city: null,
              state: null,
              zipCode: null,
              leadSource: "iPhone Contacts",
              status: "new_lead",
              priority: "warm",
              salesperson: null,
              notes: null,
            });
            imported++;
          } else {
            skipped++;
          }
        } catch (error) {
          console.error('Error importing contact:', error);
          skipped++;
        }
      }

      res.json({
        message: `Successfully imported ${imported} contacts from iPhone. ${skipped} contacts skipped (missing name or duplicate).`,
        imported,
        skipped
      });

    } catch (error) {
      console.error('Error importing contacts:', error);
      res.status(500).json({ message: 'Failed to import contacts' });
    }
  });

  // Upload leads from CSV file
  app.post('/api/customers/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const results: any[] = [];
      const errors: string[] = [];

      // Parse CSV content
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, async (err, records) => {
        if (err) {
          return res.status(400).json({ message: "Error parsing CSV file", error: err.message });
        }

        let successCount = 0;
        let errorCount = 0;

        for (const [index, record] of records.entries()) {
          try {
            // Map CSV columns to customer fields (flexible column naming)
            const customerData = {
              firstName: record.firstName || record['First Name'] || record.first_name || '',
              lastName: record.lastName || record['Last Name'] || record.last_name || '',
              email: record.email || record.Email || record.email_address || null,
              phone: record.phone || record.Phone || record.phone_number || null,
              address: record.address || record.Address || record.street_address || null,
              city: record.city || record.City || null,
              state: record.state || record.State || null,
              zipCode: record.zipCode || record['Zip Code'] || record.zip_code || record.zip || null,
              leadSource: record.leadSource || record['Lead Source'] || record.lead_source || record.source || null,
              status: 'new_lead', // Default status for uploaded leads
              priority: record.priority || record.Priority || 'warm',
              salesperson: record.salesperson || record.Salesperson || record.sales_person || null,
              notes: record.notes || record.Notes || record.comments || null,
            };

            // Validate required fields
            if (!customerData.firstName && !customerData.lastName) {
              errors.push(`Row ${index + 2}: First name or last name is required`);
              errorCount++;
              continue;
            }

            // Validate with schema
            const validatedData = insertCustomerSchema.parse(customerData);
            await storage.createCustomer(validatedData);
            successCount++;

          } catch (error) {
            console.error(`Error processing row ${index + 2}:`, error);
            errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
            errorCount++;
          }
        }

        res.json({
          message: `Upload completed: ${successCount} leads imported, ${errorCount} errors`,
          successCount,
          errorCount,
          errors: errors.slice(0, 10) // Limit to first 10 errors for display
        });
      });

    } catch (error) {
      console.error("Error uploading leads:", error);
      res.status(500).json({ message: "Failed to upload leads", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      console.log("Received customer data:", req.body);
      const customerData = insertCustomerSchema.parse(req.body);
      console.log("Parsed customer data:", customerData);
      const customer = await storage.createCustomer(customerData);
      console.log("Created customer:", customer);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer", error: String(error) });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCustomerSchema.partial().parse(req.body);
      
      // Get current customer to check status change
      const currentCustomer = await storage.getCustomer(id);
      if (!currentCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const customer = await storage.updateCustomer(id, updates);
      
      // Check if status changed to "sold" - automatically create project
      if (updates.status === "sold" && currentCustomer.status !== "sold") {
        try {
          // Create project for sold lead
          const projectData = {
            name: `${customer.firstName} ${customer.lastName} Pool Project`,
            customerId: customer.id,
            types: ["pool_spa"] as ("pool_spa" | "pool_only" | "decking" | "patio_cover" | "pergola" | "outdoor_kitchen" | "driveway")[],
            status: "planning" as const,
            address: customer.address || "",
            city: customer.city || "",
            state: customer.state || "",
            zipCode: customer.zipCode || "",
            description: `Pool project for ${customer.firstName} ${customer.lastName}`,
          };
          
          const project = await storage.createProject(projectData);
          
          // Create default todos for the new project
          await storage.createDefaultTodos(project.id);
          
          // Create activity log for project creation
          await storage.createActivity({
            type: "project_created",
            description: `Project automatically created from sold lead: ${customer.firstName} ${customer.lastName}`,
            projectId: project.id,
            userId: (req.user as any)?.claims?.sub || "system",
          });
          
          console.log(`Automatically created project ${project.id} for sold customer ${customer.id}`);
        } catch (projectError) {
          console.error("Error creating project for sold customer:", projectError);
          // Don't fail the customer update if project creation fails
        }
      }
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);

      // Create default todos for the new project
      await storage.createDefaultTodos(project.id);

      // Create activity log
      await storage.createActivity({
        projectId: project.id,
        userId: req.user.claims.sub,
        type: "project_created",
        description: `Project "${project.name}" was created`,
      });

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Project Todo routes
  app.get('/api/projects/:id/todos', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const todos = await storage.getProjectTodos(projectId);
      res.json(todos);
    } catch (error) {
      console.error("Error getting project todos:", error);
      res.status(500).json({ message: "Failed to get project todos" });
    }
  });

  app.get('/api/projects/:id/todos/next', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const nextTodo = await storage.getNextTodo(projectId);
      res.json(nextTodo || null);
    } catch (error) {
      console.error("Error fetching next todo:", error);
      res.status(500).json({ message: "Failed to fetch next todo" });
    }
  });

  app.post('/api/projects/:id/todos', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const todoData = { ...req.body, projectId };
      const todo = await storage.createProjectTodo(todoData);
      res.status(201).json(todo);
    } catch (error) {
      console.error("Error creating project todo:", error);
      res.status(500).json({ message: "Failed to create project todo" });
    }
  });

  app.put('/api/todos/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // If marking as completed, add completion info
      if (updates.completed && !updates.completedAt) {
        updates.completedAt = new Date();
        updates.completedBy = (req.user as any)?.claims?.sub || "system";
      } else if (updates.completed && updates.completedAt) {
        // Convert string to Date object if needed
        updates.completedAt = new Date(updates.completedAt);
        updates.completedBy = (req.user as any)?.claims?.sub || "system";
      } else if (!updates.completed) {
        updates.completedAt = null;
        updates.completedBy = null;
      }
      
      const todo = await storage.updateProjectTodo(id, updates);
      
      // If todo was marked as completed, send internal message to salesperson
      if (updates.completed && todo.projectId) {
        try {
          const project = await storage.getProject(todo.projectId);
          if (project?.salespersonId) {
            const nextTodo = await storage.getNextTodo(todo.projectId);
            const message = nextTodo 
              ? `Todo "${todo.title}" completed. Next todo: "${nextTodo.title}"`
              : `Todo "${todo.title}" completed. All todos are now complete!`;
            
            await storage.createInternalMessage({
              projectId: todo.projectId,
              todoId: todo.id,
              recipientId: project.salespersonId,
              senderId: (req.user as any)?.claims?.sub || "system",
              subject: `Todo Completed: ${project.name}`,
              message: message,
            });
          }
        } catch (messageError) {
          console.error("Error sending internal message:", messageError);
          // Don't fail the todo update if messaging fails
        }
      }
      
      res.json(todo);
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(500).json({ message: "Failed to update todo" });
    }
  });

  app.delete('/api/todos/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProjectTodo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ message: "Failed to delete todo" });
    }
  });

  // Internal Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getInternalMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.post('/api/projects/:id/default-todos', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      await storage.createDefaultTodos(projectId);
      res.status(201).json({ message: "Default todos created successfully" });
    } catch (error) {
      console.error("Error creating default todos:", error);
      res.status(500).json({ message: "Failed to create default todos" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, updates);

      // Create activity log
      await storage.createActivity({
        projectId: id,
        userId: req.user.claims.sub,
        type: "project_updated",
        description: `Project "${project.name}" was updated`,
      });

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Estimate routes
  app.get('/api/estimates', isAuthenticated, async (req, res) => {
    try {
      const estimates = await storage.getEstimates();
      res.json(estimates);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      res.status(500).json({ message: "Failed to fetch estimates" });
    }
  });

  app.post('/api/estimates', isAuthenticated, async (req, res) => {
    try {
      const estimateData = insertEstimateSchema.parse(req.body);
      const estimate = await storage.createEstimate(estimateData);
      res.status(201).json(estimate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid estimate data", errors: error.errors });
      }
      console.error("Error creating estimate:", error);
      res.status(500).json({ message: "Failed to create estimate" });
    }
  });

  // Vendor routes
  app.get('/api/vendors', isAuthenticated, async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.post('/api/vendors', isAuthenticated, async (req, res) => {
    try {
      const vendorData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(vendorData);
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.put('/api/vendors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(id, updates);
      res.json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.delete('/api/vendors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVendor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      const suppliers = await storage.getSuppliers(company.id);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      const supplierData = insertSupplierSchema.parse({ ...req.body, companyId: company.id });
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, updates);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Subcontractor routes
  app.get('/api/subcontractors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      const subcontractors = await storage.getSubcontractors(company.id);
      res.json(subcontractors);
    } catch (error) {
      console.error("Error fetching subcontractors:", error);
      res.status(500).json({ message: "Failed to fetch subcontractors" });
    }
  });

  app.post('/api/subcontractors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      const subcontractorData = insertSubcontractorSchema.parse({ ...req.body, companyId: company.id });
      const subcontractor = await storage.createSubcontractor(subcontractorData);
      res.status(201).json(subcontractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subcontractor data", errors: error.errors });
      }
      console.error("Error creating subcontractor:", error);
      res.status(500).json({ message: "Failed to create subcontractor" });
    }
  });

  app.put('/api/subcontractors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertSubcontractorSchema.partial().parse(req.body);
      const subcontractor = await storage.updateSubcontractor(id, updates);
      res.json(subcontractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subcontractor data", errors: error.errors });
      }
      console.error("Error updating subcontractor:", error);
      res.status(500).json({ message: "Failed to update subcontractor" });
    }
  });

  app.delete('/api/subcontractors/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubcontractor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subcontractor:", error);
      res.status(500).json({ message: "Failed to delete subcontractor" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.query;
      const tasks = projectId 
        ? await storage.getTasksByProject(parseInt(projectId as string))
        : await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);

      // Create activity log
      if (task.projectId) {
        await storage.createActivity({
          projectId: task.projectId,
          userId: req.user.claims.sub,
          type: "task_created",
          description: `Task "${task.title}" was created`,
        });
      }

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, updates);

      // Create activity log
      if (task.projectId) {
        await storage.createActivity({
          projectId: task.projectId,
          userId: req.user.claims.sub,
          type: "task_updated",
          description: `Task "${task.title}" was updated`,
        });
      }

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Equipment routes
  app.get('/api/equipment', isAuthenticated, async (req, res) => {
    try {
      const equipment = await storage.getEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.post('/api/equipment', isAuthenticated, async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid equipment data", errors: error.errors });
      }
      console.error("Error creating equipment:", error);
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  // Activity routes
  app.get('/api/activities', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.query;
      const activities = projectId 
        ? await storage.getActivitiesByProject(parseInt(projectId as string))
        : await storage.getActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Change order routes
  app.get('/api/change-orders', isAuthenticated, async (req, res) => {
    try {
      const { projectId } = req.query;
      const changeOrders = projectId 
        ? await storage.getChangeOrdersByProject(parseInt(projectId as string))
        : await storage.getChangeOrders();
      res.json(changeOrders);
    } catch (error) {
      console.error("Error fetching change orders:", error);
      res.status(500).json({ message: "Failed to fetch change orders" });
    }
  });

  app.post('/api/change-orders', isAuthenticated, async (req: any, res) => {
    try {
      const changeOrderData = insertChangeOrderSchema.parse(req.body);
      const changeOrder = await storage.createChangeOrder({
        ...changeOrderData,
        requestedBy: req.user.claims.sub,
      });

      // Create activity log
      await storage.createActivity({
        projectId: changeOrder.projectId,
        userId: req.user.claims.sub,
        type: "change_order_created",
        description: `Change order "${changeOrder.title}" was created`,
      });

      res.status(201).json(changeOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid change order data", errors: error.errors });
      }
      console.error("Error creating change order:", error);
      res.status(500).json({ message: "Failed to create change order" });
    }
  });

  // Cost Management routes
  app.get('/api/cost-categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      const categories = await storage.getCostCategories(company?.id);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching cost categories:", error);
      res.status(500).json({ message: "Failed to fetch cost categories" });
    }
  });

  app.post('/api/cost-categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      const categoryData = { ...req.body, companyId: company.id };
      const category = await storage.createCostCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating cost category:", error);
      res.status(500).json({ message: "Failed to create cost category" });
    }
  });

  app.put('/api/cost-categories/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const category = await storage.updateCostCategory(id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating cost category:", error);
      res.status(500).json({ message: "Failed to update cost category" });
    }
  });

  app.delete('/api/cost-categories/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCostCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cost category:", error);
      res.status(500).json({ message: "Failed to delete cost category" });
    }
  });

  app.get('/api/cost-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      const { categoryId } = req.query;
      const items = await storage.getCostItems(
        company.id, 
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching cost items:", error);
      res.status(500).json({ message: "Failed to fetch cost items" });
    }
  });

  app.post('/api/cost-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      const itemData = { ...req.body, companyId: company.id };
      const item = await storage.createCostItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating cost item:", error);
      res.status(500).json({ message: "Failed to create cost item" });
    }
  });

  app.put('/api/cost-items/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateCostItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating cost item:", error);
      res.status(500).json({ message: "Failed to update cost item" });
    }
  });

  app.delete('/api/cost-items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      
      // Verify the cost item belongs to this company
      const costItem = await storage.getCostItem(id);
      if (!costItem) {
        return res.status(404).json({ message: "Cost item not found" });
      }
      if (costItem.companyId !== company.id) {
        return res.status(403).json({ message: "Unauthorized to delete this cost item" });
      }
      
      await storage.deleteCostItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cost item:", error);
      res.status(500).json({ message: "Failed to delete cost item" });
    }
  });

  app.get('/api/cost-items/:id/history', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getCostHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching cost history:", error);
      res.status(500).json({ message: "Failed to fetch cost history" });
    }
  });

  // Cost Item Tier routes
  app.get('/api/cost-items/:id/tiers', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tiers = await storage.getCostItemTiers(id);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching cost item tiers:", error);
      res.status(500).json({ message: "Failed to fetch cost item tiers" });
    }
  });

  app.post('/api/cost-items/with-tiers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      
      const { item, tiers } = req.body;
      const itemData = { ...item, companyId: company.id };
      const newItem = await storage.createCostItemWithTiers(itemData, tiers);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating cost item with tiers:", error);
      res.status(500).json({ message: "Failed to create cost item with tiers" });
    }
  });

  app.post('/api/cost-item-tiers', isAuthenticated, async (req, res) => {
    try {
      const tierData = req.body;
      const tier = await storage.createCostItemTier(tierData);
      res.status(201).json(tier);
    } catch (error) {
      console.error("Error creating cost item tier:", error);
      res.status(500).json({ message: "Failed to create cost item tier" });
    }
  });

  app.put('/api/cost-item-tiers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const tier = await storage.updateCostItemTier(id, updates);
      res.json(tier);
    } catch (error) {
      console.error("Error updating cost item tier:", error);
      res.status(500).json({ message: "Failed to update cost item tier" });
    }
  });

  app.delete('/api/cost-item-tiers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCostItemTier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cost item tier:", error);
      res.status(500).json({ message: "Failed to delete cost item tier" });
    }
  });

  // =================== FINANCIAL MANAGEMENT ROUTES ===================

  // Project Budget Routes
  app.get('/api/budgets/:projectId?', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const projectId = req.params.projectId ? parseInt(req.params.projectId) : undefined;
      if (projectId) {
        const budgets = await storage.getProjectBudgets(projectId);
        res.json(budgets);
      } else {
        // Return empty array if no project specified
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching project budgets:", error);
      res.status(500).json({ message: "Failed to fetch project budgets" });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const budgetData = insertProjectBudgetSchema.parse(req.body);
      const budget = await storage.createProjectBudget({ ...budgetData, companyId: company.id });
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating project budget:", error);
      res.status(500).json({ message: "Failed to create project budget" });
    }
  });

  app.put('/api/budgets/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const budget = await storage.updateProjectBudget(id, updates);
      res.json(budget);
    } catch (error) {
      console.error("Error updating project budget:", error);
      res.status(500).json({ message: "Failed to update project budget" });
    }
  });

  app.delete('/api/budgets/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProjectBudget(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project budget:", error);
      res.status(500).json({ message: "Failed to delete project budget" });
    }
  });

  // Purchase Order Routes
  app.get('/api/purchase-orders/:projectId?', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const projectId = req.params.projectId ? parseInt(req.params.projectId) : undefined;
      const purchaseOrders = await storage.getPurchaseOrders(projectId);
      res.json(purchaseOrders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.post('/api/purchase-orders', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const poData = insertPurchaseOrderSchema.parse(req.body);
      const purchaseOrder = await storage.createPurchaseOrder({ ...poData, companyId: company.id });
      res.status(201).json(purchaseOrder);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  app.put('/api/purchase-orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const purchaseOrder = await storage.updatePurchaseOrder(id, updates);
      res.json(purchaseOrder);
    } catch (error) {
      console.error("Error updating purchase order:", error);
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  });

  app.delete('/api/purchase-orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePurchaseOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  });

  // Work Order Routes
  app.get('/api/work-orders/:projectId?', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const projectId = req.params.projectId ? parseInt(req.params.projectId) : undefined;
      const workOrders = await storage.getWorkOrders(projectId);
      res.json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  app.post('/api/work-orders', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const woData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder({ ...woData, companyId: company.id });
      res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(500).json({ message: "Failed to create work order" });
    }
  });

  app.put('/api/work-orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const workOrder = await storage.updateWorkOrder(id, updates);
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      res.status(500).json({ message: "Failed to update work order" });
    }
  });

  app.delete('/api/work-orders/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkOrder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work order:", error);
      res.status(500).json({ message: "Failed to delete work order" });
    }
  });

  // Vendor Bill Routes
  app.get('/api/vendor-bills/:projectId?', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const projectId = req.params.projectId ? parseInt(req.params.projectId) : undefined;
      const vendorBills = await storage.getVendorBills(projectId);
      res.json(vendorBills);
    } catch (error) {
      console.error("Error fetching vendor bills:", error);
      res.status(500).json({ message: "Failed to fetch vendor bills" });
    }
  });

  app.post('/api/vendor-bills', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const billData = insertVendorBillSchema.parse(req.body);
      const vendorBill = await storage.createVendorBill({ ...billData, companyId: company.id });
      res.status(201).json(vendorBill);
    } catch (error) {
      console.error("Error creating vendor bill:", error);
      res.status(500).json({ message: "Failed to create vendor bill" });
    }
  });

  app.put('/api/vendor-bills/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const vendorBill = await storage.updateVendorBill(id, updates);
      res.json(vendorBill);
    } catch (error) {
      console.error("Error updating vendor bill:", error);
      res.status(500).json({ message: "Failed to update vendor bill" });
    }
  });

  app.delete('/api/vendor-bills/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVendorBill(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor bill:", error);
      res.status(500).json({ message: "Failed to delete vendor bill" });
    }
  });

  // Customer Invoice Routes
  app.get('/api/customer-invoices/:projectId?', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const projectId = req.params.projectId ? parseInt(req.params.projectId) : undefined;
      const customerInvoices = await storage.getCustomerInvoices(projectId);
      res.json(customerInvoices);
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
      res.status(500).json({ message: "Failed to fetch customer invoices" });
    }
  });

  app.post('/api/customer-invoices', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const invoiceData = insertCustomerInvoiceSchema.parse(req.body);
      const customerInvoice = await storage.createCustomerInvoice({ ...invoiceData, companyId: company.id });
      res.status(201).json(customerInvoice);
    } catch (error) {
      console.error("Error creating customer invoice:", error);
      res.status(500).json({ message: "Failed to create customer invoice" });
    }
  });

  app.put('/api/customer-invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const customerInvoice = await storage.updateCustomerInvoice(id, updates);
      res.json(customerInvoice);
    } catch (error) {
      console.error("Error updating customer invoice:", error);
      res.status(500).json({ message: "Failed to update customer invoice" });
    }
  });

  app.delete('/api/customer-invoices/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomerInvoice(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer invoice:", error);
      res.status(500).json({ message: "Failed to delete customer invoice" });
    }
  });

  // Payment Record Routes
  app.get('/api/payment-records/:invoiceId', isAuthenticated, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const payments = await storage.getPaymentRecords(invoiceId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payment records:", error);
      res.status(500).json({ message: "Failed to fetch payment records" });
    }
  });

  app.post('/api/payment-records', isAuthenticated, async (req, res) => {
    try {
      const paymentData = insertPaymentRecordSchema.parse(req.body);
      const payment = await storage.createPaymentRecord(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment record:", error);
      res.status(500).json({ message: "Failed to create payment record" });
    }
  });

  app.put('/api/payment-records/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const payment = await storage.updatePaymentRecord(id, updates);
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment record:", error);
      res.status(500).json({ message: "Failed to update payment record" });
    }
  });

  app.delete('/api/payment-records/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePaymentRecord(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment record:", error);
      res.status(500).json({ message: "Failed to delete payment record" });
    }
  });

  // Project Bid Items routes
  app.get("/api/projects/:projectId/bid-items", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const bidItems = await storage.getProjectBidItems(projectId);
      res.json(bidItems);
    } catch (error) {
      console.error("Error fetching project bid items:", error);
      res.status(500).json({ message: "Failed to fetch project bid items" });
    }
  });

  app.post("/api/projects/:projectId/bid-items", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const validatedData = insertProjectBidItemSchema.parse({
        ...req.body,
        projectId,
        companyId: company.id,
      });
      const bidItem = await storage.createProjectBidItem(validatedData);
      res.json(bidItem);
    } catch (error) {
      console.error("Error creating project bid item:", error);
      res.status(500).json({ message: "Failed to create project bid item" });
    }
  });

  app.post("/api/projects/:projectId/bid-from-costs", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByOwnerId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      const { bidItems } = req.body; // Array of { costItemId, quantity, markupPercentage }
      
      const createdItems = await storage.createProjectBidFromCostItems(projectId, company.id, bidItems);
      res.json(createdItems);
    } catch (error) {
      console.error("Error creating bid from cost items:", error);
      res.status(500).json({ message: "Failed to create bid from cost items" });
    }
  });

  app.patch("/api/bid-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const bidItem = await storage.updateProjectBidItem(id, updates);
      res.json(bidItem);
    } catch (error) {
      console.error("Error updating project bid item:", error);
      res.status(500).json({ message: "Failed to update project bid item" });
    }
  });

  app.delete("/api/bid-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProjectBidItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project bid item:", error);
      res.status(500).json({ message: "Failed to delete project bid item" });
    }
  });

  app.post("/api/projects/:projectId/calculate-actual-costs", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const actualCosts = await storage.calculateProjectActualCosts(projectId);
      res.json({ actualCosts });
    } catch (error) {
      console.error("Error calculating actual costs:", error);
      res.status(500).json({ message: "Failed to calculate actual costs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
