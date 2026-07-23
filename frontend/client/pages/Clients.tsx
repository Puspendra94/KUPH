import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Upload,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { useKeycloakAuth } from "@/lib/keycloak-auth";
import { apiRequest } from "@/lib/api";

interface ClientRecord {
  id: string;
  name?: string;
  customAttributes?: Record<string, unknown>;
  status?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const PAGE_SIZE = 20;

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addName, setAddName] = useState("");
  const [addIndustry, setAddIndustry] = useState("");
  const [addCampaigns, setAddCampaigns] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "done">("upload");
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileRef = useRef<File | null>(null);

  const { token } = useKeycloakAuth();

  const loadClients = async (p = page) => {
    if (!token) return;
    try {
      const res = await apiRequest<PaginatedResponse<ClientRecord>>(
        `/crm/clients?page=${p}&limit=${PAGE_SIZE}`,
        { token }
      );
      setClients(res.data || []);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (error) {
      console.error("Failed to load clients", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients(1);
  }, [token]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    setLoading(true);
    void loadClients(p);
  };

  // ── Add Single Client ────────────────────────────────────────
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !addName.trim()) {
      setAddError("Name is required");
      return;
    }

    setAddSubmitting(true);
    setAddError("");

    try {
      const csvHeader = "name,industry,campaigns";
      const csvRow = `${addName.trim()},${addIndustry.trim()},${addCampaigns.trim()}`;
      const csvContent = `${csvHeader}\n${csvRow}`;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "client.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "brand");

      const res = await fetch(`${API_BASE}/crm/import/execute`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add client");
      }

      const result = await res.json();
      if (result.imported > 0) {
        setShowAddDialog(false);
        setAddName("");
        setAddIndustry("");
        setAddCampaigns("");
        setAddError("");
        void loadClients(1);
      } else {
        setAddError("Failed to add client");
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── File Import ──────────────────────────────────────────────
  const downloadSampleCsv = () => {
    const content = "name,industry,campaigns\nAcme Corp,Technology,5\nFashion House,Retail,12\nGreen Foods,FMCG,3";
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.trim().split("\n");
        if (lines.length < 2) {
          setImportError("No valid rows found. Ensure the file has a name column.");
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const maxPreview = Math.min(lines.length - 1, 20);
        const previewData: Record<string, string>[] = [];
        for (let i = 1; i <= maxPreview; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
          previewData.push(row);
        }
        const hasName = previewData.some((r) => r.name?.trim());
        if (!hasName) {
          setImportError("No rows with a name found.");
          return;
        }
        setPreviewRows(previewData);
        setImportStep("preview");
        setImportError("");
        uploadFileRef.current = file;
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to parse file");
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    previewFile(file);
  };

  const handleImportExecute = async () => {
    if (!token || !uploadFileRef.current) return;
    setImporting(true);
    setImportError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFileRef.current);
      formData.append("entityType", "brand");
      const res = await fetch(`${API_BASE}/crm/import/execute`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Import failed");
      }
      const result = await res.json();
      setImportResult(result);
      setImportStep("done");
      void loadClients(1);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setPreviewRows([]);
    setImportStep("upload");
    setImportResult(null);
    setImportError("");
    setFileName("");
    uploadFileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeImport = () => {
    setShowImport(false);
    setTimeout(resetImport, 200);
  };

  // ── Search Filter ───────────────────────────────────────────
  const filtered = clients.filter((c) => {
    const query = searchQuery.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const industry = String((c.customAttributes?.industry as string | undefined) || "").toLowerCase();
    return name.includes(query) || industry.includes(query);
  });

  const renderPreviewTable = () => {
    if (previewRows.length === 0) return null;
    const keys = Object.keys(previewRows[0]);
    return (
      <div className="overflow-x-auto rounded-lg border border-border max-h-60 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-2 text-left font-semibold text-foreground">#</th>
              {keys.map((k) => (
                <th key={k} className="px-4 py-2 text-left font-semibold text-foreground capitalize">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, idx) => (
              <tr key={idx} className="border-b border-border hover:bg-muted/30">
                <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                {keys.map((k) => (
                  <td key={k} className="px-4 py-2 text-muted-foreground">{row[k] || "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
          Showing first {previewRows.length} row{previewRows.length !== 1 ? "s" : ""}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-2">
            Manage your brand partners and relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddClient} className="space-y-4 mt-4">
                {addError && (
                  <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="add-name">Name *</Label>
                  <Input id="add-name" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Client name" required disabled={addSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-industry">Industry</Label>
                  <Input id="add-industry" value={addIndustry} onChange={(e) => setAddIndustry(e.target.value)} placeholder="e.g. Technology, Retail" disabled={addSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-campaigns">Campaigns</Label>
                  <Input id="add-campaigns" value={addCampaigns} onChange={(e) => setAddCampaigns(e.target.value)} placeholder="e.g. 5" disabled={addSubmitting} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={addSubmitting}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={addSubmitting || !addName.trim()} className="bg-gradient-to-r from-primary to-accent text-white">
                    {addSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                    ) : "Add Client"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Dialog */}
      {showImport && (
        <Card className="p-6 bg-accent/5 border border-accent/20">
          {importStep === "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Import Clients</h3>
                  <p className="text-sm text-muted-foreground">Upload a CSV file to bulk import clients</p>
                </div>
                <Button variant="ghost" size="sm" onClick={downloadSampleCsv}>
                  <Download className="w-4 h-4 mr-1" /> Sample CSV
                </Button>
              </div>
              {importError && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}
              <label className="border-2 border-dashed border-accent rounded-lg p-8 text-center cursor-pointer hover:bg-accent/10 transition block">
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                <Upload className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Click to select file</p>
                <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              </label>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Expected columns:</p>
                <code className="bg-muted px-1.5 py-0.5 rounded">name, industry, campaigns</code>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={closeImport}>Cancel</Button>
              </div>
            </div>
          )}
          {importStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Preview Import</h3>
                  <p className="text-sm text-muted-foreground">
                    Previewing first {previewRows.length} row{previewRows.length !== 1 ? "s" : ""}
                    {fileName && <span className="ml-1">from <span className="font-medium">{fileName}</span></span>}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetImport}><X className="w-4 h-4 mr-1" /> Change file</Button>
              </div>
              {importError && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}
              {renderPreviewTable()}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={closeImport}>Cancel</Button>
                <Button size="sm" onClick={handleImportExecute} disabled={importing} className="bg-gradient-to-r from-primary to-accent text-white">
                  {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : "Import File"}
                </Button>
              </div>
            </div>
          )}
          {importStep === "done" && (
            <div className="space-y-4 text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground text-lg">Import Complete</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Successfully imported {importResult?.imported ?? 0} client{(importResult?.imported ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={closeImport}>Close</Button>
                <Button size="sm" onClick={resetImport} className="bg-gradient-to-r from-primary to-accent text-white">Import Another File</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search by name or industry..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-0" />
        </div>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Loading clients…</p>}

      {/* Clients Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Client Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Industry</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Campaigns</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{client.name?.charAt(0)}</span>
                      </div>
                      <p className="font-medium text-foreground">{client.name || "Unnamed client"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {(client.customAttributes?.industry as string | undefined) || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {Number(client.customAttributes?.campaigns ?? 0)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      (client.status || "active") === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {(client.status || "active").toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No clients found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or add a new client</p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-4">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}