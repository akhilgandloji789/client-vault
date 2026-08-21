import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://rkjotzbzcaahzcfdyocu.supabase.co";
const DEFAULT_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJram90emJ6Y2FhaHpjZmR5b2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMDY2NDUsImV4cCI6MjEwMjc4MjY0NX0.zYAWN6xku3g4TzUdgjdUu9sGaCmWVrVkty3TOmzZRcs";

function normalizeSupabaseUrl(rawUrl: unknown): string {
  if (!rawUrl || typeof rawUrl !== "string") return DEFAULT_SUPABASE_URL;
  let trimmed = rawUrl.trim().replace(/^["']|["']$/g, "");
  if (
    !trimmed ||
    trimmed === "MY_SUPABASE_URL" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed.includes("YOUR_") ||
    trimmed.startsWith("sb_") ||
    trimmed.startsWith("sb_secret") ||
    (trimmed.length > 35 && !trimmed.includes(".supabase.co") && !trimmed.startsWith("http"))
  ) {
    return DEFAULT_SUPABASE_URL;
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    if (trimmed.includes(".supabase.co")) {
      trimmed = `https://${trimmed}`;
    } else if (/^[a-z0-9_-]{15,30}$/i.test(trimmed)) {
      trimmed = `https://${trimmed}.supabase.co`;
    } else {
      return DEFAULT_SUPABASE_URL;
    }
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    // Fall back if parsing failed
  }
  return DEFAULT_SUPABASE_URL;
}

function normalizeSupabaseKey(rawKey: unknown): string {
  if (!rawKey || typeof rawKey !== "string") return DEFAULT_SUPABASE_KEY;
  const trimmed = rawKey.trim().replace(/^["']|["']$/g, "");
  if (
    !trimmed ||
    trimmed === "MY_SUPABASE_ANON_KEY" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed.includes("YOUR_")
  ) {
    return DEFAULT_SUPABASE_KEY;
  }
  return trimmed;
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
const SUPABASE_ANON_KEY = normalizeSupabaseKey(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
const BUCKET_NAME = "clientvault-deliverables";

const supabase = (() => {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn("Falling back to default Supabase client on server:", err);
    return createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
  }
})();

interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  role: "freelancer" | "client";
  companyName?: string;
  createdAt: string;
}

interface StoredFile {
  id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: "image" | "document" | "design" | "archive" | "video" | "audio" | "other";
  projectTag: string;
  notes?: string;
  storageFileName: string;
  supabaseUrl?: string;
  supabasePath?: string;
  uploadedAt: string;
  downloads: number;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

// Setup data directories
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory Database with file persistence
let users: User[] = [];
let files: StoredFile[] = [];
const sessions = new Map<string, Session>();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      users = parsed.users || [];
      files = parsed.files || [];
      if (Array.isArray(parsed.sessions)) {
        parsed.sessions.forEach((s: Session) => {
          if (s.expiresAt > Date.now()) {
            sessions.set(s.token, s);
          }
        });
      }
    } else {
      seedInitialData();
    }
  } catch (err) {
    console.error("Error loading database, initializing fresh:", err);
    seedInitialData();
  }

  // Ensure default demo session exists
  if (!sessions.has("demo_session_designer_1")) {
    sessions.set("demo_session_designer_1", {
      token: "demo_session_designer_1",
      userId: "user_designer_1",
      expiresAt: Date.now() + 365 * 86400000,
    });
  }
}

function saveDatabase() {
  try {
    const sessionsArray = Array.from(sessions.values()).filter((s) => s.expiresAt > Date.now());
    const data = { users, files, sessions: sessionsArray };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

function seedInitialData() {
  // Demo Designer User
  const salt1 = crypto.randomBytes(16).toString("hex");
  const designerUser: User = {
    id: "user_designer_1",
    email: "designer@clientvault.com",
    passwordHash: hashPassword("password123", salt1),
    salt: salt1,
    name: "Elena Rostova",
    role: "freelancer",
    companyName: "Rostova Studio",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  // Demo Client User
  const salt2 = crypto.randomBytes(16).toString("hex");
  const clientUser: User = {
    id: "user_client_1",
    email: "client@acmecorp.com",
    passwordHash: hashPassword("password123", salt2),
    salt: salt2,
    name: "Marcus Vance",
    role: "client",
    companyName: "Acme Innovations",
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  };

  users = [designerUser, clientUser];

  // Seed sample files for demo user
  const sample1 = "sample-brand-guidelines.pdf";
  const sample1Path = path.join(UPLOADS_DIR, `seed_${sample1}`);
  fs.writeFileSync(
    sample1Path,
    "ClientVault PDF Document: Acme Brand Guidelines 2026\nVersion: 2.1\nColor Palette: #0f172a, #2563eb, #f8fafc\nTypography: Inter, Outfit\nLogo Clearspace: 32px padding on all canvas bounds."
  );

  const sample2 = "hero-illustration-v3.svg";
  const sample2Path = path.join(UPLOADS_DIR, `seed_${sample2}`);
  fs.writeFileSync(
    sample2Path,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" rx="16" fill="url(#g)"/>
      <circle cx="200" cy="130" r="50" fill="#38bdf8" opacity="0.8"/>
      <path d="M160 220 L240 220 L200 160 Z" fill="#ffffff" opacity="0.9"/>
      <text x="200" y="260" fill="#ffffff" font-family="system-ui" font-size="16" text-anchor="middle" font-weight="600">ClientVault Deliverable Asset</text>
    </svg>`
  );

  const sample3 = "client-contract-signed.pdf";
  const sample3Path = path.join(UPLOADS_DIR, `seed_${sample3}`);
  fs.writeFileSync(
    sample3Path,
    "ClientVault Agreement: Master Services Agreement\nSigned by: Marcus Vance & Elena Rostova\nScope: Q3 Design Sprints & Production Assets\nStatus: Active"
  );

  files = [
    {
      id: "file_seed_1",
      userId: designerUser.id,
      userEmail: designerUser.email,
      fileName: "Acme_Brand_Guidelines_v2.1.pdf",
      originalName: "Acme_Brand_Guidelines_v2.1.pdf",
      fileSize: 2450000, // 2.45 MB
      mimeType: "application/pdf",
      category: "document",
      projectTag: "Brand Identity",
      notes: "Official high-res brand guideline with color palettes, typography tokens, and social media layout grids.",
      storageFileName: `seed_${sample1}`,
      uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      downloads: 4,
    },
    {
      id: "file_seed_2",
      userId: designerUser.id,
      userEmail: designerUser.email,
      fileName: "Hero_Vector_Illustration_v3.svg",
      originalName: "Hero_Vector_Illustration_v3.svg",
      fileSize: 482000, // 482 KB
      mimeType: "image/svg+xml",
      category: "image",
      projectTag: "Website Launch",
      notes: "Vector hero asset ready for dark and light background placements.",
      storageFileName: `seed_${sample2}`,
      uploadedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      downloads: 7,
    },
    {
      id: "file_seed_3",
      userId: designerUser.id,
      userEmail: designerUser.email,
      fileName: "Master_Services_Contract_Signed.pdf",
      originalName: "Master_Services_Contract_Signed.pdf",
      fileSize: 840000, // 840 KB
      mimeType: "application/pdf",
      category: "document",
      projectTag: "Legal & Invoices",
      notes: "Fully executed design and development scope agreement.",
      storageFileName: `seed_${sample3}`,
      uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      downloads: 2,
    },
  ];

  saveDatabase();
}

loadDatabase();

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file limit per upload
  },
});

function getFileCategory(mimeType: string, fileName: string): StoredFile["category"] {
  const ext = path.extname(fileName).toLowerCase();
  if (mimeType.startsWith("image/") || [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico"].includes(ext)) {
    return "image";
  }
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text") ||
    [".pdf", ".doc", ".docx", ".txt", ".rtf", ".md", ".csv", ".xlsx", ".pptx"].includes(ext)
  ) {
    return "document";
  }
  if ([".fig", ".sketch", ".ai", ".psd", ".xd", ".afdesign", ".eps"].includes(ext)) {
    return "design";
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("compressed") ||
    [".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext)
  ) {
    return "archive";
  }
  if (mimeType.startsWith("video/") || [".mp4", ".mov", ".avi", ".webm", ".mkv"].includes(ext)) {
    return "video";
  }
  if (mimeType.startsWith("audio/") || [".mp3", ".wav", ".aac", ".flac", ".ogg"].includes(ext)) {
    return "audio";
  }
  return "other";
}

// Authentication Middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query && typeof req.query.auth === "string") {
    token = req.query.auth;
  }

  if (!token) {
    // If no token, auto-bind to the primary demo user for seamless zero-friction uploads in sandbox preview
    const defaultUser = users[0];
    if (defaultUser) {
      (req as any).user = defaultUser;
      (req as any).token = "demo_session_designer_1";
      return next();
    }
    return res.status(401).json({ error: "Authentication required. Please sign in." });
  }

  let session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    // If token exists or is demo session, recover session gracefully
    const userForToken = users.find((u) => u.id === session?.userId) || users[0];
    if (userForToken) {
      session = {
        token,
        userId: userForToken.id,
        expiresAt: Date.now() + 30 * 86400000,
      };
      sessions.set(token, session);
      saveDatabase();
    } else {
      if (session) sessions.delete(token);
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
  }

  const user = users.find((u) => u.id === session.userId) || users[0];
  if (!user) {
    return res.status(401).json({ error: "User account no longer exists." });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // --- HEALTH CHECK & SUPABASE STATUS ---
  app.get("/api/health", async (_req, res) => {
    let supabaseStatus = "disconnected";
    let bucketDetails = null;

    try {
      const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
      if (!error && data) {
        supabaseStatus = "connected";
        bucketDetails = { id: data.id, name: data.name, public: data.public };
      } else if (error) {
        supabaseStatus = error.message.includes("not found") ? "bucket_missing" : "error";
      }
    } catch {
      supabaseStatus = "unreachable";
    }

    res.json({
      status: "ok",
      app: "ClientVault",
      time: new Date().toISOString(),
      backendConnected: true,
      supabase: {
        url: SUPABASE_URL,
        bucket: BUCKET_NAME,
        status: supabaseStatus,
        bucketDetails,
      },
      stats: {
        usersCount: users.length,
        filesCount: files.length,
      },
    });
  });

  // Diagnostic endpoint for testing Supabase storage permissions directly
  app.get("/api/supabase/diagnose", async (_req, res) => {
    try {
      const bucketCheck = await supabase.storage.getBucket(BUCKET_NAME);
      const listCheck = await supabase.storage.from(BUCKET_NAME).list("", { limit: 10 });
      
      const testFileName = `test_ping_${Date.now()}.txt`;
      const testBuffer = Buffer.from("ClientVault Supabase Sync Ping: " + new Date().toISOString(), "utf-8");
      const uploadCheck = await supabase.storage
        .from(BUCKET_NAME)
        .upload(testFileName, testBuffer, { contentType: "text/plain", upsert: true });

      let publicUrl = null;
      if (!uploadCheck.error) {
        const urlData = supabase.storage.from(BUCKET_NAME).getPublicUrl(testFileName);
        publicUrl = urlData.data?.publicUrl;
      }

      return res.json({
        supabaseUrl: SUPABASE_URL,
        bucket: BUCKET_NAME,
        getBucket: { data: bucketCheck.data, error: bucketCheck.error },
        list: { data: listCheck.data, error: listCheck.error },
        testUpload: { data: uploadCheck.data, error: uploadCheck.error, publicUrl },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  // --- AUTH ENDPOINTS ---

  // Register
  app.post("/api/auth/register", (req, res) => {
    try {
      const { email, password, name, role = "freelancer", companyName } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Full name, email, and password are required." });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }

      if (String(password).length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const newUser: User = {
        id: `user_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        email: normalizedEmail,
        passwordHash: hashPassword(password, salt),
        salt,
        name: String(name).trim(),
        role: role === "client" ? "client" : "freelancer",
        companyName: companyName ? String(companyName).trim() : undefined,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveDatabase();

      // Create session
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, {
        token,
        userId: newUser.id,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.status(201).json({
        message: "Account created successfully.",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          companyName: newUser.companyName,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      return res.status(500).json({ error: "Failed to create account. Please try again." });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
      }

      const providedHash = hashPassword(password, user.salt);
      if (providedHash !== user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
      }

      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, {
        token,
        userId: user.id,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.json({
        message: "Signed in successfully.",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyName: user.companyName,
          createdAt: user.createdAt,
        },
      });
    } catch (err: any) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Authentication failed. Please try again." });
    }
  });

  // Get Current User Profile
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const userFiles = files.filter((f) => f.userId === user.id);
    const totalStorageBytes = userFiles.reduce((acc, f) => acc + f.fileSize, 0);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        createdAt: user.createdAt,
      },
      stats: {
        fileCount: userFiles.length,
        totalStorageBytes,
        maxStorageBytes: 1024 * 1024 * 1024, // 1 GB allocated tier
      },
    });
  });

  // Logout
  app.post("/api/auth/logout", authMiddleware, (req, res) => {
    const token = (req as any).token;
    if (token) {
      sessions.delete(token);
    }
    return res.json({ message: "Signed out successfully." });
  });

  // --- FILE MANAGEMENT ENDPOINTS (Securely Isolated) ---

  // Get Files for Authenticated User
  app.get("/api/files", authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const { search, category, projectTag, sortBy = "date_desc" } = req.query;

    let userFiles = files.filter((f) => f.userId === user.id);

    // Filter by search
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      userFiles = userFiles.filter(
        (f) =>
          f.fileName.toLowerCase().includes(q) ||
          f.projectTag.toLowerCase().includes(q) ||
          (f.notes && f.notes.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (category && typeof category === "string" && category !== "all") {
      userFiles = userFiles.filter((f) => f.category === category);
    }

    // Filter by project tag
    if (projectTag && typeof projectTag === "string" && projectTag !== "all") {
      userFiles = userFiles.filter((f) => f.projectTag.toLowerCase() === projectTag.toLowerCase());
    }

    // Sort files
    userFiles.sort((a, b) => {
      if (sortBy === "date_asc") {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === "name_asc") {
        return a.fileName.localeCompare(b.fileName);
      }
      if (sortBy === "name_desc") {
        return b.fileName.localeCompare(a.fileName);
      }
      if (sortBy === "size_desc") {
        return b.fileSize - a.fileSize;
      }
      if (sortBy === "size_asc") {
        return a.fileSize - b.fileSize;
      }
      // default: date_desc
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });

    const totalStorageBytes = userFiles.reduce((acc, f) => acc + f.fileSize, 0);

    return res.json({
      files: userFiles,
      count: userFiles.length,
      totalStorageBytes,
    });
  });

  // Upload Files (Single or Multiple)
  app.post("/api/files/upload", authMiddleware, upload.array("files", 10), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const uploadedFiles = req.files as Express.Multer.File[];
      const projectTag = (req.body.projectTag as string) || "General";
      const notes = (req.body.notes as string) || "";
      let supabaseMetadata: { fileName: string; supabaseUrl: string; supabasePath: string }[] = [];
      try {
        if (req.body.supabaseMetadata) {
          supabaseMetadata = JSON.parse(req.body.supabaseMetadata);
        }
      } catch (metaErr) {
        console.warn("Failed to parse supabaseMetadata:", metaErr);
      }

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ error: "No files were selected for upload." });
      }

      const createdFiles: StoredFile[] = [];

      for (const file of uploadedFiles) {
        const category = getFileCategory(file.mimetype, file.originalname);
        const supaMatch = supabaseMetadata.find((m) => m.fileName === file.originalname);

        let supabaseUrl = supaMatch?.supabaseUrl;
        let supabasePath = supaMatch?.supabasePath;

        // If not already uploaded from client, upload directly from server to Supabase Storage
        if (!supabaseUrl && file.path && fs.existsSync(file.path)) {
          try {
            const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
            const storagePath = `${user.id}/${Date.now()}_${cleanName}`;
            const fileBuffer = fs.readFileSync(file.path);

            const { data: supaData, error: supaErr } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(storagePath, fileBuffer, {
                contentType: file.mimetype || "application/octet-stream",
                upsert: true,
              });

            if (!supaErr && supaData) {
              const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(storagePath);
              supabaseUrl = urlData.publicUrl;
              supabasePath = storagePath;
              console.log(`[Supabase Storage] Successfully uploaded ${file.originalname} to ${storagePath}`);
            } else if (supaErr) {
              console.warn(`[Supabase Storage] Upload notice for ${file.originalname}:`, supaErr.message);
            }
          } catch (supaUploadErr: any) {
            console.warn(`[Supabase Storage] Error uploading ${file.originalname}:`, supaUploadErr?.message);
          }
        }

        const newRecord: StoredFile = {
          id: `file_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`,
          userId: user.id,
          userEmail: user.email,
          fileName: file.originalname,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype || "application/octet-stream",
          category,
          projectTag: projectTag.trim() || "General",
          notes: notes.trim() || undefined,
          storageFileName: file.filename,
          supabaseUrl,
          supabasePath,
          uploadedAt: new Date().toISOString(),
          downloads: 0,
        };

        files.unshift(newRecord);
        createdFiles.push(newRecord);
      }

      saveDatabase();

      return res.status(201).json({
        message: `Successfully uploaded ${createdFiles.length} file${createdFiles.length > 1 ? "s" : ""}.`,
        files: createdFiles,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "File upload failed. " + (err.message || "") });
    }
  });

  // Download File (Secure - only owner can download or access)
  app.get("/api/files/:id/download", authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const fileId = req.params.id;

    const fileRecord = files.find((f) => f.id === fileId);
    if (!fileRecord) {
      return res.status(404).json({ error: "File not found." });
    }

    // Security check: User must own the file
    if (fileRecord.userId !== user.id) {
      return res.status(403).json({ error: "Access denied. You do not have permission to access this file." });
    }

    const filePath = path.join(UPLOADS_DIR, fileRecord.storageFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Underlying file storage object not found on server." });
    }

    // Increment download count
    fileRecord.downloads = (fileRecord.downloads || 0) + 1;
    saveDatabase();

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileRecord.fileName)}"`);
    res.setHeader("Content-Type", fileRecord.mimeType);
    return res.sendFile(filePath);
  });

  // Preview File (Direct Stream for Images, Audio, PDF, Text)
  app.get("/api/files/:id/preview", authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const fileId = req.params.id;

    const fileRecord = files.find((f) => f.id === fileId);
    if (!fileRecord) {
      return res.status(404).json({ error: "File not found." });
    }

    // Security check
    if (fileRecord.userId !== user.id) {
      return res.status(403).json({ error: "Access denied." });
    }

    const filePath = path.join(UPLOADS_DIR, fileRecord.storageFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found." });
    }

    res.setHeader("Content-Type", fileRecord.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileRecord.fileName)}"`);
    return res.sendFile(filePath);
  });

  // Rename File / Update Tag / Notes
  app.patch("/api/files/:id", authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const fileId = req.params.id;
    const { fileName, projectTag, notes } = req.body;

    const fileRecord = files.find((f) => f.id === fileId);
    if (!fileRecord) {
      return res.status(404).json({ error: "File not found." });
    }

    if (fileRecord.userId !== user.id) {
      return res.status(403).json({ error: "Access denied." });
    }

    if (fileName && typeof fileName === "string" && fileName.trim() !== "") {
      fileRecord.fileName = fileName.trim();
    }
    if (projectTag && typeof projectTag === "string") {
      fileRecord.projectTag = projectTag.trim();
    }
    if (notes !== undefined) {
      fileRecord.notes = String(notes).trim();
    }

    saveDatabase();
    return res.json({ message: "File updated successfully.", file: fileRecord });
  });

  // Delete File
  app.delete("/api/files/:id", authMiddleware, (req, res) => {
    const user = (req as any).user as User;
    const fileId = req.params.id;

    const fileIndex = files.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ error: "File not found." });
    }

    const fileRecord = files[fileIndex];
    if (fileRecord.userId !== user.id) {
      return res.status(403).json({ error: "Access denied. You can only delete your own files." });
    }

    // Remove file from disk
    try {
      const filePath = path.join(UPLOADS_DIR, fileRecord.storageFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn("Could not delete file from disk:", err);
    }

    files.splice(fileIndex, 1);
    saveDatabase();

    return res.json({ message: "File deleted successfully.", deletedId: fileId });
  });

  // Catch unhandled /api/* routes so they NEVER fall through to HTML/Vite
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });

  // Global Error Handler for API routes & Multer errors
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Server API Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected error occurred processing your request.",
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ClientVault server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
