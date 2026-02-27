import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Anon client — public read routes
const supabase = createClient(supabaseUrl, supabaseAnonKey || "placeholder");

// Service role client — bypasses RLS for all authenticated writes
let _serviceClient: ReturnType<typeof createClient> | null = null;
function getServiceClient() {
  if (!_serviceClient) {
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    _serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _serviceClient;
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await getServiceClient().auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  (req as any).user = user;
  next();
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: "1mb" }));

// ─── Public Routes ─────────────────────────────────────────────────────────

app.get("/api/events/:id", async (req, res) => {
  try {
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !event) return res.status(404).json({ error: "Event not found" });

    const [{ data: subPrograms }, { data: downloadables }] = await Promise.all([
      supabase.from("sub_programs").select("*").eq("event_id", req.params.id).order("order_index"),
      supabase.from("downloadables").select("*").eq("event_id", req.params.id),
    ]);

    res.json({ ...event, sub_programs: subPrograms || [], downloadables: downloadables || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

app.get("/api/business-settings", async (req, res) => {
  try {
    const [{ data: settings }, { data: portfolio }] = await Promise.all([
      supabase.from("business_settings").select("*").eq("id", 1).single(),
      supabase.from("portfolio_images").select("*").order("order_index"),
    ]);
    res.json({ settings, portfolio: portfolio || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch business settings" });
  }
});

// ─── Protected Routes ──────────────────────────────────────────────────────

app.get("/api/events", requireAuth, async (req, res) => {
  try {
    const { data, error } = await getServiceClient()
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.post("/api/events", requireAuth, async (req, res) => {
  const { deceased_name, event_type, deceased_photo } = req.body;
  if (!deceased_name) return res.status(400).json({ error: "deceased_name is required" });
  const id = Math.random().toString(36).substring(2, 10);
  try {
    const { data, error } = await getServiceClient()
      .from("events")
      .insert([{ id, deceased_name, event_type: event_type || "memorial", deceased_photo: deceased_photo || null }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.put("/api/events/:id", requireAuth, async (req, res) => {
  const { deceased_name, event_type, deceased_photo } = req.body;
  try {
    const { data, error } = await getServiceClient()
      .from("events")
      .update({ deceased_name, event_type, deceased_photo })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

app.delete("/api/events/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await getServiceClient().from("events").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

app.post("/api/events/:id/sub-programs", requireAuth, async (req, res) => {
  const { name, date, time, location, stream_url, order_index } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const { data, error } = await getServiceClient()
      .from("sub_programs")
      .insert([{ event_id: req.params.id, name, date, time, location, stream_url, order_index: order_index || 0 }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add sub-program" });
  }
});

app.put("/api/events/:id/sub-programs/:spid", requireAuth, async (req, res) => {
  const { name, date, time, location, stream_url, order_index } = req.body;
  try {
    const { data, error } = await getServiceClient()
      .from("sub_programs")
      .update({ name, date, time, location, stream_url, order_index })
      .eq("id", req.params.spid)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update sub-program" });
  }
});

app.delete("/api/events/:id/sub-programs/:spid", requireAuth, async (req, res) => {
  try {
    const { error } = await getServiceClient().from("sub_programs").delete().eq("id", req.params.spid);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete sub-program" });
  }
});

app.post("/api/events/:id/downloads", requireAuth, async (req, res) => {
  const { title, file_url, file_type } = req.body;
  if (!title || !file_url) return res.status(400).json({ error: "title and file_url required" });
  try {
    const { data, error } = await getServiceClient()
      .from("downloadables")
      .insert([{ event_id: req.params.id, title, file_url, file_type: file_type || "program" }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add downloadable" });
  }
});

app.delete("/api/events/:id/downloads/:did", requireAuth, async (req, res) => {
  try {
    const { error } = await getServiceClient().from("downloadables").delete().eq("id", req.params.did);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete downloadable" });
  }
});

app.put("/api/business-settings", requireAuth, async (req, res) => {
  const { name, tagline, address, phone, email, about } = req.body;
  try {
    const { data, error } = await getServiceClient()
      .from("business_settings")
      .update({ name, tagline, address, phone, email, about, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update business settings" });
  }
});

app.post("/api/portfolio-images", requireAuth, async (req, res) => {
  const { title, image_url, order_index } = req.body;
  if (!image_url) return res.status(400).json({ error: "image_url is required" });
  try {
    const { data, error } = await getServiceClient()
      .from("portfolio_images")
      .insert([{ title, image_url, order_index: order_index || 0 }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add portfolio image" });
  }
});

app.delete("/api/portfolio-images/:id", requireAuth, async (req, res) => {
  try {
    const { error } = await getServiceClient().from("portfolio_images").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete portfolio image" });
  }
});

export default app;
