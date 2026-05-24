import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Phone, Building2, Calendar, Bell, Camera,
  ChevronLeft, ChevronRight, Plus, X, Check, Clock,
  BookOpen, Briefcase, MapPin, Save, AlertCircle,
  Upload, Link as LinkIcon, Flag, Trash2, FileText,
  Pencil, User, Globe,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserProfile {
  id: number;
  nom: string;
  email: string;
  role: string;
  telephone?: string;
  entreprise?: string;
  ville?: string;
  specialite?: string;
  photoUrl?: string;
  encadrant?: { nom: string; email: string };
}

// ✅ FIX : le backend utilise "date" pas "dateEcheance"
interface CalendarEvent {
  id: number;
  titre: string;
  date: string;
  description?: string;
  important?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const roleLabel: Record<string, { label: string; color: string }> = {
  ETUDIANT: { label: "Étudiant", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  ENCADRANT: { label: "Encadrant", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const userId = Number(localStorage.getItem("userId"));
  const token = localStorage.getItem("token");
  const isDark = localStorage.getItem("theme") === "dark";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editPhoto, setEditPhoto] = useState(false);
  const [photoInput, setPhotoInput] = useState("");
  const [photoMode, setPhotoMode] = useState<"url" | "file">("file");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: "", email: "", telephone: "", entreprise: "", ville: "", specialite: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddDL, setShowAddDL] = useState(false);
  const [newDL, setNewDL] = useState({ titre: "", date: "", description: "", important: false });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addingDL, setAddingDL] = useState(false);

  const api = axios.create({
    baseURL: "/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    api.get<UserProfile>(`/users/${userId}`)
      .then(r => {
        const data = r.data;
        setProfile(data);
        setPhotoInput(data.photoUrl ?? "");
        setPhotoPreview(data.photoUrl ?? "");
        setEditForm({
          nom: data.nom ?? "", email: data.email ?? "",
          telephone: data.telephone ?? "", entreprise: data.entreprise ?? "",
          ville: data.ville ?? "", specialite: data.specialite ?? "",
        });
        if (data.photoUrl) localStorage.setItem("photoUrl", data.photoUrl);
        if (data.nom) localStorage.setItem("nom", data.nom);
      })
      .catch(() => {
        const fb: UserProfile = {
          id: userId, nom: localStorage.getItem("nom") ?? "Utilisateur",
          email: "", role: localStorage.getItem("role") ?? "ETUDIANT",
          photoUrl: localStorage.getItem("photoUrl") ?? "",
          telephone: localStorage.getItem("telephone") ?? "",
          entreprise: localStorage.getItem("entreprise") ?? "",
          ville: localStorage.getItem("ville") ?? "",
        };
        setProfile(fb);
        setPhotoInput(fb.photoUrl ?? "");
        setPhotoPreview(fb.photoUrl ?? "");
        setEditForm({
          nom: fb.nom, email: fb.email,
          telephone: fb.telephone ?? "", entreprise: fb.entreprise ?? "",
          ville: fb.ville ?? "", specialite: "",
        });
      });

    api.get<CalendarEvent[]>(`/events/user/${userId}`)
      .then(r => setEvents(r.data))
      .catch(() => setEvents([]));
  }, [userId]);

  // ── Start editing ──────────────────────────────────────────────────────────
  const startEditing = () => {
    if (!profile) return;
    setEditForm({
      nom: profile.nom ?? "", email: profile.email ?? "",
      telephone: profile.telephone ?? "", entreprise: profile.entreprise ?? "",
      ville: profile.ville ?? "", specialite: profile.specialite ?? "",
    });
    setIsEditing(true);
  };

  // ── Save profile info ──────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const payload = {
        nom: editForm.nom, email: editForm.email,
        telephone: editForm.telephone, entreprise: editForm.entreprise,
        ville: editForm.ville, specialite: editForm.specialite,
      };
      await api.put(`/users/${userId}`, payload);
      setProfile(prev => prev ? { ...prev, ...payload } : prev);
      localStorage.setItem("nom", editForm.nom);
      localStorage.setItem("telephone", editForm.telephone);
      localStorage.setItem("entreprise", editForm.entreprise);
      localStorage.setItem("ville", editForm.ville);
      setIsEditing(false);
      toast.success("Profil mis à jour !");
    } catch {
      setProfile(prev => prev ? { ...prev, ...editForm } : prev);
      localStorage.setItem("nom", editForm.nom);
      localStorage.setItem("telephone", editForm.telephone);
      localStorage.setItem("entreprise", editForm.entreprise);
      localStorage.setItem("ville", editForm.ville);
      setIsEditing(false);
      toast.success("Profil mis à jour localement !");
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelEditing = () => {
    if (!profile) return;
    setEditForm({
      nom: profile.nom ?? "", email: profile.email ?? "",
      telephone: profile.telephone ?? "", entreprise: profile.entreprise ?? "",
      ville: profile.ville ?? "", specialite: profile.specialite ?? "",
    });
    setIsEditing(false);
  };

  // ── Photo : import ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Fichier non valide."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image trop lourde (max 5 Mo)."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoPreview(base64);
      setPhotoInput(base64);
    };
    reader.readAsDataURL(file);
  };

  // ── Save photo ─────────────────────────────────────────────────────────────
  const handleSavePhoto = async () => {
    if (!profile || !photoInput) return;
    setSaving(true);
    try {
      await api.put(`/users/${userId}/photo`, { photoUrl: photoInput });
      setProfile(prev => prev ? { ...prev, photoUrl: photoInput } : prev);
      localStorage.setItem("photoUrl", photoInput);
      setEditPhoto(false);
      toast.success("Photo mise à jour !");
    } catch (error: any) {
      console.error("❌ Photo error:", error.response?.status, error.response?.data);
      setProfile(prev => prev ? { ...prev, photoUrl: photoPreview } : prev);
      localStorage.setItem("photoUrl", photoPreview);
      setEditPhoto(false);
      toast.error("Erreur serveur — photo sauvegardée localement");
    } finally {
      setSaving(false);
    }
  };

  // ── Remove photo ───────────────────────────────────────────────────────────
  const handleRemovePhoto = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.put(`/users/${userId}/photo`, { photoUrl: "" });
      setProfile(prev => prev ? { ...prev, photoUrl: "" } : prev);
      localStorage.removeItem("photoUrl");
      setPhotoInput(""); setPhotoPreview(""); setEditPhoto(false);
      toast.success("Photo supprimée");
    } catch {
      setProfile(prev => prev ? { ...prev, photoUrl: "" } : prev);
      localStorage.removeItem("photoUrl");
      setPhotoInput(""); setPhotoPreview(""); setEditPhoto(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle important ───────────────────────────────────────────────────────
  const toggleImportant = async (id: number) => {
    try {
      // ✅ FIX : envoyer userId dans le body
      await api.put(`/events/${id}/important`, { userId });
      setEvents(prev => prev.map(e => e.id === id ? { ...e, important: !e.important } : e));
    } catch {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, important: !e.important } : e));
    }
  };

  // ── Supprimer un événement ─────────────────────────────────────────────────
  const deleteEvent = async (id: number) => {
    try {
      await api.delete(`/events/${id}?userId=${userId}`);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success("Événement supprimé");
    } catch {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  // ── Ajouter un événement ───────────────────────────────────────────────────
  const handleAddEvent = async () => {
    if (!newDL.titre || !newDL.date) return;
    setAddingDL(true);
    try {
      // ✅ FIX : envoyer "date" (le backend attend "date" ou "dateEcheance")
      const res = await api.post<CalendarEvent>("/events", {
        titre: newDL.titre,
        date: newDL.date,
        dateEcheance: newDL.date,
        description: newDL.description,
        important: newDL.important,
        userId: userId,
      });
      setEvents(prev => [...prev, res.data]);
      toast.success("Événement ajouté !");
    } catch (error: any) {
      console.error("❌ Erreur création événement:", error.response?.data || error.message);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setShowAddDL(false);
      setNewDL({ titre: "", date: "", description: "", important: false });
      setSelectedDay(null);
      setAddingDL(false);
    }
  };

  // ── Calendrier ─────────────────────────────────────────────────────────────
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const eventMap = new Map<number, "important" | "normal">();
  events.forEach(ev => {
    const dt = new Date(ev.date);
    if (dt.getFullYear() === calYear && dt.getMonth() === calMonth) {
      const day = dt.getDate();
      if (ev.important) eventMap.set(day, "important");
      else if (!eventMap.has(day)) eventMap.set(day, "normal");
    }
  });

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setNewDL(prev => ({ ...prev, date: iso }));
    setShowAddDL(true);
  };

  // ── Événements à venir (30 j) ──────────────────────────────────────────────
  const upcoming = [...events]
    .filter(ev => {
      const diff = (new Date(ev.date).getTime() - today.getTime()) / 86400000;
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => {
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 6);

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Demain";
    return `Dans ${diff} j`;
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const roleInfo = roleLabel[profile.role] ?? { label: profile.role, color: "bg-gray-100 text-gray-700" };
  const initials = profile.nom.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const displayPhoto = profile.photoUrl || photoPreview;

  const inputClass = `w-full text-sm px-3 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
    isDark ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
  }`;

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
            <p className={`text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Gérez vos informations personnelles et votre agenda</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${roleInfo.color}`}>{roleInfo.label}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══ Colonne gauche ══════════════════════════════════════════════ */}
          <div className="space-y-6">

            {/* CARTE PROFIL */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              <div className="flex flex-col items-center text-center">

                {/* Avatar */}
                <div className="relative group mb-4">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt={profile.nom} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-100 dark:ring-blue-900"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">{initials}</div>
                  )}
                  <button onClick={() => setEditPhoto(true)}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </button>
                </div>

                {!isEditing ? (
                  <>
                    <h2 className="text-lg font-semibold">{profile.nom}</h2>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{profile.email}</p>
                    <div className="mt-4 w-full space-y-2 text-left">
                      {[
                        { icon: Mail, val: profile.email },
                        { icon: Phone, val: profile.telephone ?? "Non renseigné" },
                        { icon: Building2, val: profile.entreprise ?? "Non renseigné" },
                        { icon: MapPin, val: profile.ville ?? "Non renseigné" },
                        { icon: Globe, val: profile.specialite ?? "Non renseigné" },
                      ].map(({ icon: Icon, val }, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                          <Icon size={14} className={isDark ? "text-gray-500" : "text-gray-400"} />
                          <span className="truncate">{val}</span>
                        </div>
                      ))}
                    </div>

                    {profile.encadrant?.nom && (
                      <div className={`mt-4 w-full rounded-xl px-3 py-2 text-sm ${isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                        <span className="font-medium">Encadrant :</span> {profile.encadrant.nom}
                      </div>
                    )}

                    <button onClick={startEditing}
                      className="mt-5 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                      <Pencil size={14} /> Modifier mes informations
                    </button>
                  </>
                ) : (
                  <div className="w-full mt-3 space-y-3 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><Pencil size={14} className="text-blue-500" /> Modifier le profil</h3>
                      <button onClick={cancelEditing}><X size={16} className={isDark ? "text-gray-400" : "text-gray-500"} /></button>
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}><User size={10} className="inline mr-1" /> Nom complet</label>
                      <input type="text" value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}><Mail size={10} className="inline mr-1" /> Email</label>
                      <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}><Phone size={10} className="inline mr-1" /> Téléphone</label>
                      <input type="tel" value={editForm.telephone} onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}><Building2 size={10} className="inline mr-1" /> Entreprise</label>
                      <input type="text" value={editForm.entreprise} onChange={e => setEditForm(f => ({ ...f, entreprise: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}><MapPin size={10} className="inline mr-1" /> Ville</label>
                      <input type="text" value={editForm.ville} onChange={e => setEditForm(f => ({ ...f, ville: e.target.value }))} className={inputClass} />
                    </div>
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}><Globe size={10} className="inline mr-1" /> Spécialité</label>
                      <input type="text" value={editForm.specialite} onChange={e => setEditForm(f => ({ ...f, specialite: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleSaveProfile} disabled={savingProfile}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50">
                        {savingProfile ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Save size={14} /> Sauvegarder</>}
                      </button>
                      <button onClick={cancelEditing} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Panneau modifier photo */}
            <AnimatePresence>
              {editPhoto && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl p-5 border shadow-md ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><Camera size={14} /> Changer la photo</h3>
                    <button onClick={() => setEditPhoto(false)}><X size={16} className={isDark ? "text-gray-400" : "text-gray-500"} /></button>
                  </div>
                  <div className={`flex rounded-xl p-1 mb-4 gap-1 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                    {(["file", "url"] as const).map(mode => (
                      <button key={mode} onClick={() => setPhotoMode(mode)}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-all ${
                          photoMode === mode ? "bg-blue-600 text-white shadow" : isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                        }`}>
                        {mode === "file" ? <><Upload size={12} /> Depuis mon PC</> : <><LinkIcon size={12} /> URL</>}
                      </button>
                    ))}
                  </div>
                  {photoMode === "file" && (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <button onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                          isDark ? "border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400" : "border-gray-300 hover:border-blue-400 text-gray-400 hover:text-blue-500"
                        }`}>
                        <Upload size={24} /><span className="text-sm font-medium">Cliquer pour choisir une image</span><span className="text-xs opacity-70">JPG, PNG, WEBP — max 5 Mo</span>
                      </button>
                    </>
                  )}
                  {photoMode === "url" && (
                    <input type="url" value={photoInput} onChange={e => { setPhotoInput(e.target.value); setPhotoPreview(e.target.value); }}
                      placeholder="https://example.com/photo.jpg" className={inputClass} />
                  )}
                  {photoPreview && (
                    <div className="mt-3 relative">
                      <img src={photoPreview} alt="preview" className="w-full h-32 object-cover rounded-xl"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-lg font-medium ${isDark ? "bg-gray-900/80 text-gray-300" : "bg-white/80 text-gray-600"}`}>Aperçu</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleSavePhoto} disabled={saving || !photoInput}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-40">
                      {saving ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Save size={14} /> Enregistrer</>}
                    </button>
                    {displayPhoto && (
                      <button onClick={handleRemovePhoto} disabled={saving}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-40">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className={`rounded-2xl p-5 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BookOpen size={14} className="text-blue-500" /> Informations</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Rapports", val: "—", icon: FileText },
                  { label: "Événements", val: events.length, icon: Clock },
                  { label: "Importants", val: events.filter(e => e.important).length, icon: Flag },
                  { label: "Statut", val: "Actif", icon: Check },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl p-3 text-center ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                    <div className="flex justify-center mb-2"><s.icon size={20} className="text-blue-500" /></div>
                    <div className="text-lg font-bold mt-0.5">{s.val}</div>
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ══ Colonne droite ══════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Calendrier */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2"><Calendar size={16} className="text-blue-500" /><h3 className="font-semibold">Mon Agenda</h3></div>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronLeft size={16} /></button>
                  <span className="text-sm font-medium w-36 text-center">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (<div key={d} className={`text-center text-xs font-medium py-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{d}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                  const evType = eventMap.get(day);
                  const isSel = selectedDay === day;
                  return (
                    <motion.button key={day} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleDayClick(day)}
                      className={`relative aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-all ${
                        isToday ? "bg-blue-600 text-white" : isSel ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : isDark ? "hover:bg-gray-800 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                      }`}>
                      {day}
                      {evType && (<span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : evType === "important" ? "bg-red-500" : "bg-orange-400"}`} />)}
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Aujourd'hui</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Important</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Événement</span>
                </div>
                <button onClick={() => { setSelectedDay(null); setNewDL({ titre: "", date: "", description: "", important: false }); setShowAddDL(true); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </motion.div>

            {/* Formulaire nouvel événement */}
            <AnimatePresence>
              {showAddDL && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-blue-100"}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Plus size={14} className="text-blue-500" /> Nouvel événement
                        {selectedDay && <span className="text-blue-600 dark:text-blue-400">— {selectedDay} {MONTHS[calMonth]}</span>}
                      </h3>
                      <button onClick={() => { setShowAddDL(false); setSelectedDay(null); }}><X size={16} className={isDark ? "text-gray-400" : "text-gray-500"} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>Titre *</label>
                        <input type="text" value={newDL.titre} onChange={e => setNewDL(p => ({ ...p, titre: e.target.value }))} placeholder="Ex: Rendu rapport" className={inputClass} />
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>Date *</label>
                        <input type="date" value={newDL.date} onChange={e => setNewDL(p => ({ ...p, date: e.target.value }))} className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>Description (optionnel)</label>
                        <textarea value={newDL.description} onChange={e => setNewDL(p => ({ ...p, description: e.target.value }))} placeholder="Détails..." rows={2} className={`${inputClass} resize-none`} />
                      </div>
                      <div className="sm:col-span-2">
                        <button type="button" onClick={() => setNewDL(p => ({ ...p, important: !p.important }))}
                          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all ${
                            newDL.important ? "border-red-400 bg-red-50 dark:bg-red-900/20" : isDark ? "border-gray-700 bg-gray-800 hover:border-gray-600" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${newDL.important ? "bg-red-500" : isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                            {newDL.important && <Check size={12} className="text-white" />}
                          </div>
                          <Flag size={14} className={newDL.important ? "text-red-500" : "text-gray-400"} />
                          <span className={`text-sm font-medium ${newDL.important ? "text-red-600 dark:text-red-400" : isDark ? "text-gray-300" : "text-gray-600"}`}>Marquer comme important</span>
                          {newDL.important && (<span className="ml-auto text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-lg">URGENT</span>)}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleAddEvent} disabled={!newDL.titre || !newDL.date || addingDL}
                        className={`flex-1 flex items-center justify-center gap-2 text-white text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-50 ${
                          newDL.important ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                        }`}>
                        {addingDL ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Check size={14} /> Ajouter</>}
                      </button>
                      <button onClick={() => { setShowAddDL(false); setSelectedDay(null); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>Annuler</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Événements à venir */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><Bell size={16} className="text-orange-500" /> Prochains événements</h3>
                <div className="flex items-center gap-2">
                  {events.filter(e => e.important).length > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">
                      <AlertCircle size={10} />{events.filter(e => e.important).length} important{events.filter(e => e.important).length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>30 prochains jours</span>
                </div>
              </div>

              {upcoming.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                  <Clock size={32} className="mx-auto mb-2 opacity-40" /><p className="text-sm">Aucun événement dans les 30 prochains jours</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((ev, i) => {
                    const daysLeft = Math.ceil((new Date(ev.date).getTime() - today.getTime()) / 86400000);
                    const cardClass = ev.important ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                      : daysLeft <= 3 ? "bg-orange-50 border-orange-200 dark:bg-orange-900/15 dark:border-orange-800"
                      : daysLeft <= 7 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
                      : isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200";
                    const badgeClass = ev.important ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                      : daysLeft <= 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                      : daysLeft <= 7 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";

                    return (
                      <motion.div key={ev.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${cardClass}`}>
                        {ev.important && <div className="shrink-0 w-1 h-10 rounded-full bg-red-500" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${ev.important ? "text-red-700 dark:text-red-400" : ""}`}>{ev.titre}</p>
                            {ev.important && (<span className="shrink-0 flex items-center gap-0.5 text-xs font-bold text-red-600 dark:text-red-400"><Flag size={10} /> URGENT</span>)}
                          </div>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(ev.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                          </p>
                          {ev.description && (<p className={`text-xs mt-0.5 truncate italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>{ev.description}</p>)}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${badgeClass}`}>{daysUntil(ev.date)}</span>
                          <button onClick={() => toggleImportant(ev.id)} title={ev.important ? "Retirer urgent" : "Marquer urgent"}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              ev.important ? "bg-red-100 dark:bg-red-900/40 text-red-500" : isDark ? "bg-gray-700 hover:bg-red-900/30 text-gray-500 hover:text-red-400" : "bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500"
                            }`}><Flag size={12} /></button>
                          <button onClick={() => deleteEvent(ev.id)} title="Supprimer"
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              isDark ? "bg-gray-700 hover:bg-red-900/30 text-gray-500 hover:text-red-400" : "bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500"
                            }`}><Trash2 size={12} /></button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              {events.length > 6 && (<p className={`text-xs text-center mt-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>+ {events.length - 6} autres événements</p>)}
            </motion.div>

            {/* Infos stage */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Briefcase size={16} className="text-indigo-500" /> Informations de stage</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Briefcase, label: "Type", val: "Stage PFE" },
                  { icon: BookOpen, label: "Spécialité", val: profile.specialite || "Informatique" },
                  { icon: MapPin, label: "Lieu", val: profile.ville ?? "—" },
                ].map(({ icon: Icon, label, val }, i) => (
                  <div key={i} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-indigo-900/40" : "bg-indigo-100"}`}>
                      <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                      <p className="text-sm font-medium mt-0.5">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}