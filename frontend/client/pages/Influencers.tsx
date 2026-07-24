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
} from "lucide-react";
import * as XLSX from "xlsx";
import { useKeycloakAuth } from "@/lib/keycloak-auth";
import { apiRequest } from "@/lib/api";

interface InfluencerRecord {
  id: string;
  name?: string;
  customAttributes?: Record<string, unknown>;
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

export default function Influencers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [influencers, setInfluencers] = useState<InfluencerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Add form state
  const [addName, setAddName] = useState("");
  const [addNiche, setAddNiche] = useState("");
  const [addFollowers, setAddFollowers] = useState("");
  const [addEngagement, setAddEngagement] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  // Import state
  const [importStep, setImportStep] = useState<"upload" | "preview" | "done">("upload");
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileRef = useRef<File | null>(null);

  const { token } = useKeycloakAuth();

  const loadInfluencers = async (p = page) => {
    if (!token) return;
    try {
      const res = await apiRequest<PaginatedResponse<InfluencerRecord>>(
        `/crm/influencers?page=${p}&limit=${PAGE_SIZE}`,
        { token }
      );
      setInfluencers(res.data || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (error) {
      console.error("Failed to load influencers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInfluencers(1);
  }, [token]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    setLoading(true);
    void loadInfluencers(p);
  };

  // ── Add Single Influencer ────────────────────────────────────
  const handleAddInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !addName.trim()) {
      setAddError("Name is required");
      return;
    }

    setAddSubmitting(true);
    setAddError("");

    try {
      const csvHeader = "name,niche,followers,engagement";
      const csvRow = `${addName.trim()},${addNiche.trim()},${addFollowers.trim()},${addEngagement.trim()}`;
      const csvContent = `${csvHeader}\n${csvRow}`;
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "influencer.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "influencer");

      const res = await fetch(`${API_BASE}/crm/import/execute`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add influencer");
      }

      const result = await res.json();
      if (result.imported > 0) {
        setShowAddDialog(false);
        resetAddForm();
        void loadInfluencers(1);
      } else {
        setAddError("Failed to add influencer");
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add influencer");
    } finally {
      setAddSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setAddName("");
    setAddNiche("");
    setAddFollowers("");
    setAddEngagement("");
    setAddError("");
  };

  // ── File Import with Preview ─────────────────────────────────
  const previewFile = (file: File) => {
    setFileName(file.name);

    if (!file.name.endsWith(".csv")) {
      // For Excel files, still show preview using lightweight frontend parse
      // We read first ~8KB to get header row + a few data rows
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as ArrayBuffer;
          // Parse only first 20 rows for preview (lightweight)
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            setImportError("Excel file has no sheets");
            return;
          }
          const sheet = workbook.Sheets[sheetName];
          // Only parse first 20 rows for preview
          const previewData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
            defval: "",
            range: 20, // only first 20 rows
          });

          if (previewData.length === 0) {
            setImportError("No valid rows found in the Excel file");
            return;
          }

          setPreviewRows(previewData);
          setImportStep("preview");
          setImportError("");
          uploadFileRef.current = file;
        } catch (err) {
          setImportError(err instanceof Error ? err.message : "Failed to parse Excel preview");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV: parse only first 20 rows for preview (lightweight)
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.trim().split("\n");
          if (lines.length < 2) {
            setImportError("No valid rows found. Ensure the file has a name column with data.");
            return;
          }
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          // Only first 20 data rows for preview
          const maxPreview = Math.min(lines.length - 1, 20);
          const previewData: Record<string, string>[] = [];
          for (let i = 1; i <= maxPreview; i++) {
            const values = lines[i].split(",").map((v) => v.trim());
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx] || "";
            });
            previewData.push(row);
          }

          const hasName = previewData.some((r) => r.name?.trim());
          if (!hasName) {
            setImportError("No rows with a name found. Ensure the file has a name column.");
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
    }
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
      formData.append("entityType", "influencer");

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
      void loadInfluencers(1);
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
  const filtered = influencers.filter((i) => {
    const query = searchQuery.toLowerCase();
    const name = (i.name || "").toLowerCase();
    const niche = String((i.customAttributes?.niche as string | undefined) || "").toLowerCase();
    const followers = String((i.customAttributes?.followers as string | undefined) || "").toLowerCase();
    const engagement = String((i.customAttributes?.engagement as string | undefined) || "").toLowerCase();
    return name.includes(query) || niche.includes(query) || followers.includes(query) || engagement.includes(query);
  });

  // ── Download Sample CSV ─────────────────────────────────────
  const downloadSampleCsv = () => {
    const csvContent = "name,niche,followers,engagement\nJohn Doe,Fashion,50000,4.5%\nJane Smith,Tech,120000,3.2%\nAlice Brown,Beauty,85000,5.1%";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-influencers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

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
                <th key={k} className="px-4 py-2 text-left font-semibold text-foreground capitalize">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, idx) => (
              <tr key={idx} className="border-b border-border hover:bg-muted/30">
                <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                {keys.map((k) => (
                  <td key={k} className="px-4 py-2 text-muted-foreground">
                    {row[k] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {uploadFileRef.current && (
          <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
            Showing first {previewRows.length} row{previewRows.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    );
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) return;
    const headers = ["name", "niche", "followers", "engagement"];
    const rows = filtered.map((inf) => {
      const niche = (inf.customAttributes?.niche as string) || "";
      const followers = (inf.customAttributes?.followers as string) || "";
      const engagement = (inf.customAttributes?.engagement as string) || "";
      return `"${inf.name || ""}","${niche}","${followers}","${engagement}"`;
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `influencers-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Influencers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your influencer database and campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Influencer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Influencer</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddInfluencer} className="space-y-4 mt-4">
                {addError && (
                  <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="add-name">Name *</Label>
                  <Input
                    id="add-name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Influencer name"
                    required
                    disabled={addSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-niche">Niche</Label>
                  <Input
                    id="add-niche"
                    value={addNiche}
                    onChange={(e) => setAddNiche(e.target.value)}
                    placeholder="e.g. Fashion, Tech, Beauty"
                    disabled={addSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-followers">Followers</Label>
                    <Input
                      id="add-followers"
                      value={addFollowers}
                      onChange={(e) => setAddFollowers(e.target.value)}
                      placeholder="e.g. 50000"
                      disabled={addSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-engagement">Engagement</Label>
                    <Input
                      id="add-engagement"
                      value={addEngagement}
                      onChange={(e) => setAddEngagement(e.target.value)}
                      placeholder="e.g. 4.5%"
                      disabled={addSubmitting}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={addSubmitting}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={addSubmitting || !addName.trim()}
                    className="bg-gradient-to-r from-primary to-accent text-white"
                  >
                    {addSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Influencer"
                    )}
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
                  <h3 className="font-semibold text-foreground mb-1">
                    Import Influencers
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV or Excel file to bulk import influencers
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={downloadSampleCsv}>
                    <Download className="w-4 h-4 mr-1" />
                    Sample CSV
                  </Button>
                </div>
              </div>

              {importError && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              <label className="border-2 border-dashed border-accent rounded-lg p-8 text-center cursor-pointer hover:bg-accent/10 transition block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Click to select file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV or Excel files (.csv, .xlsx, .xls)
                </p>
              </label>

              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Expected columns:</p>
                <code className="bg-muted px-1.5 py-0.5 rounded">
                  name, niche, followers, engagement
                </code>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={closeImport}>
                  Cancel
                </Button>
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
                    {fileName && (
                      <span className="ml-1">from <span className="font-medium">{fileName}</span></span>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetImport}>
                  <X className="w-4 h-4 mr-1" />
                  Change file
                </Button>
              </div>

              {importError && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {renderPreviewTable()}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={closeImport}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleImportExecute}
                  disabled={importing}
                  className="bg-gradient-to-r from-primary to-accent text-white"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import File"
                  )}
                </Button>
              </div>
            </div>
          )}

          {importStep === "done" && (
            <div className="space-y-4 text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  Import Complete
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Successfully imported {importResult?.imported ?? 0} influencer
                  {(importResult?.imported ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={closeImport}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={resetImport}
                  className="bg-gradient-to-r from-primary to-accent text-white"
                >
                  Import Another File
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Search + Pagination */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0"
          />
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Influencers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((influencer) => (
          <Card
            key={influencer.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="mb-4 w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full" />
            <h3 className="font-semibold text-foreground group-hover:text-primary transition">
              {influencer.name || "Unnamed influencer"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {(influencer.customAttributes?.niche as string | undefined) || "No niche assigned"}
            </p>
            <div className="mt-4 space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Followers</span>
                <span className="font-semibold text-foreground">
                  {(influencer.customAttributes?.followers as string | undefined) || "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Engagement</span>
                <span className="font-semibold text-secondary">
                  {(influencer.customAttributes?.engagement as string | undefined) || "—"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No influencers found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or add a new influencer
          </p>
        </Card>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}