"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Loader2, Building2, Receipt, Download, Upload, AlertTriangle } from "lucide-react";

interface BusinessSettings {
  businessName: string;
  gstin: string;
  panNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: "Mangalam Banquet & Hotel",
    gstin: "10ANSPD0701C1ZY",
    panNumber: "ANSPD0701C",
    phone: "83839 81280",
    email: "",
    address: "Ward No 37",
    city: "Bettiah",
    state: "Bihar",
    pincode: "845438",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data) return;
        setSettings((prev) => ({
          ...prev,
          businessName: data.businessName ?? prev.businessName,
          gstin: data.gstin ?? prev.gstin,
          panNumber: data.panNumber ?? prev.panNumber,
          phone: data.phone ?? prev.phone,
          email: data.email ?? prev.email,
          address: data.address ?? prev.address,
          city: data.city ?? prev.city,
          state: data.state ?? prev.state,
          pincode: data.pincode ?? prev.pincode,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        ...settings,
        stateCode: "10",
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Backup failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `mangalam-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Backup error:", err);
      alert(err instanceof Error ? err.message : "Failed to create backup");
    } finally {
      setBackingUp(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setRestoreResult(null);
    }
  }

  async function handleRestore() {
    if (!restoreFile) return;
    
    setRestoring(true);
    setShowRestoreConfirm(false);
    setRestoreResult(null);
    
    try {
      const text = await restoreFile.text();
      const backup = JSON.parse(text);
      
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Restore failed");
      }
      
      setRestoreResult({ success: true, message: result.message });
      setRestoreFile(null);
      // Reset file input
      const fileInput = document.getElementById("restore-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Restore error:", err);
      setRestoreResult({ 
        success: false, 
        message: err instanceof Error ? err.message : "Failed to restore backup" 
      });
    } finally {
      setRestoring(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-56 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Business configuration and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Business Information</CardTitle>
            <CardDescription>Your business details for invoices and communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={settings.city} onChange={(e) => setSettings({ ...settings, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input value={settings.state} onChange={(e) => setSettings({ ...settings, state: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>PIN Code</Label>
                <Input value={settings.pincode} onChange={(e) => setSettings({ ...settings, pincode: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Receipt className="h-4 w-4" /> GST Configuration</CardTitle>
            <CardDescription>Tax registration details for GST invoicing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={settings.gstin} onChange={(e) => setSettings({ ...settings, gstin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>PAN Number</Label>
                <Input value={settings.panNumber} onChange={(e) => setSettings({ ...settings, panNumber: e.target.value })} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
              <p className="font-medium">GST Rate Structure:</p>
              <p className="text-muted-foreground">Room ≤ ₹999/night → 0% | ₹1,000–₹7,500 → 5% (no ITC) | &gt; ₹7,500 → 18% (with ITC)</p>
              <p className="text-muted-foreground">Hall & Services → 18% (CGST 9% + SGST 9%)</p>
              <p className="text-muted-foreground">Catering → 5% (CGST 2.5% + SGST 2.5%, no ITC)</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="h-4 w-4" /> Data Backup & Restore</CardTitle>
            <CardDescription>Download all your data for safekeeping or restore from a backup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Backup Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Download Backup</h4>
              <p className="text-sm text-muted-foreground">
                Creates a complete backup of all bookings, customers, invoices, inquiries, inventory, events, and settings.
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBackup} 
                disabled={backingUp}
              >
                {backingUp ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating Backup...</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" /> Download Backup</>
                )}
              </Button>
            </div>

            <hr />

            {/* Restore Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Restore from Backup</h4>
              <p className="text-sm text-muted-foreground">
                Upload a previously downloaded backup file to restore your data. This will <strong>overwrite</strong> existing data.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  id="restore-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRestoreConfirm(true)}
                  disabled={!restoreFile || restoring}
                >
                  {restoring ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Restoring...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Restore</>
                  )}
                </Button>
              </div>

              {restoreFile && !showRestoreConfirm && !restoring && (
                <p className="text-sm text-muted-foreground">
                  Selected: <strong>{restoreFile.name}</strong> ({(restoreFile.size / 1024).toFixed(1)} KB)
                </p>
              )}

              {/* Confirmation Dialog */}
              {showRestoreConfirm && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-orange-800">Are you sure you want to restore?</p>
                      <p className="text-sm text-orange-700">
                        This will overwrite all current data with the backup. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRestoreConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRestore}
                    >
                      Yes, Restore Data
                    </Button>
                  </div>
                </div>
              )}

              {/* Result Message */}
              {restoreResult && (
                <div className={`rounded-lg p-3 text-sm ${
                  restoreResult.success 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {restoreResult.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" className="bg-maroon-700 hover:bg-maroon-800" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Settings</>}
          </Button>
          {saved && <span className="text-sm text-green-600">Settings saved!</span>}
        </div>
      </form>
    </div>
  );
}
