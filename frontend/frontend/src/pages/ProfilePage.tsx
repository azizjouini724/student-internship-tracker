import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Phone, Building2, Calendar, Bell, Camera,
  ChevronLeft, ChevronRight, Plus, X, Check, Clock,
  BookOpen, Briefcase, MapPin, Save, AlertCircle,
  Upload, Link as LinkIcon, Flag, Trash2,
} from "lucide-react";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserProfile {
  id: number;
  nom: string;
  email: string;
  role: string;
  telephone?: string;
  entreprise?: string;
  ville?: string;
  photoUrl?: string;
  encadrantNom?: string;
}

interface Deadline {
  id: number;
  titre: string;
  dateEcheance: string;
  description?: string;
  important?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DAYS   = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

const roleLabel: Record<string, { label: string; color: string }> = {
  ETUDIANT:  { label: "Étudiant",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  ENCADRANT: { label: "Encadrant", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  ADMIN:     { label: "Admin",     color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const userId = Number(localStorage.getItem("userId"));
  const token  = localStorage.getItem("token");
  const isDark = localStorage.getItem("theme") === "dark";

  // ── Profile ────────────────────────────────────────────────────────────────
  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [editPhoto,    setEditPhoto]    = useState(false);
  const [photoInput,   setPhotoInput]   = useState("");
  const [photoMode,    setPhotoMode]    = useState<"url"|"file">("file");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Calendar ───────────────────────────────────────────────────────────────
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // ── Deadlines ──────────────────────────────────────────────────────────────
  const [deadlines,   setDeadlines]   = useState<Deadline[]>([]);
  const [showAddDL,   setShowAddDL]   = useState(false);
  const [newDL,       setNewDL]       = useState({ titre: "", dateEcheance: "", description: "", important: false });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addingDL,    setAddingDL]    = useState(false);

  const api = axios.create({
    baseURL: "/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    api.get<UserProfile>(`/users/${userId}`)
      .then(r => {
        setProfile(r.data);
        setPhotoInput(r.data.photoUrl ?? "");
        setPhotoPreview(r.data.photoUrl ?? "");
      })
      .catch(() => {
        setProfile({
          id: userId,
          nom: localStorage.getItem("nom") ?? "Utilisateur",
          email: "user@example.com",
          role: localStorage.getItem("role") ?? "ETUDIANT",
          photoUrl: "",
        });
      });

    api.get<Deadline[]>("/deadlines")
      .then(r => setDeadlines(r.data))
      .catch(() => setDeadlines([]));
  }, [userId]);

  // ── Photo : import depuis PC ───────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setSaveMsg("Fichier non valide."); return; }
    if (file.size > 5 * 1024 * 1024) { setSaveMsg("Image trop lourde (max 5 Mo)."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoPreview(base64);
      setPhotoInput(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!profile || !photoInput) return;
    setSaving(true);
    try {
      await api.put(`/users/${userId}/photo`, { photoUrl: photoInput });
      setProfile(prev => prev ? { ...prev, photoUrl: photoInput } : prev);
      setSaveMsg("Photo mise à jour !");
      setEditPhoto(false);
    } catch {
      // fallback local (dev sans backend)
      setProfile(prev => prev ? { ...prev, photoUrl: photoPreview } : prev);
      setSaveMsg("Photo mise à jour localement !");
      setEditPhoto(false);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  // ── Toggle important d'une deadline ────────────────────────────────────────
  const toggleImportant = (id: number) => {
    setDeadlines(prev =>
      prev.map(d => d.id === id ? { ...d, important: !d.important } : d)
    );
  };

  // ── Supprimer une deadline ─────────────────────────────────────────────────
  const deleteDeadline = async (id: number) => {
    try { await api.delete(`/deadlines/${id}`); } catch { /* ignore */ }
    setDeadlines(prev => prev.filter(d => d.id !== id));
  };

  // ── Ajouter une deadline ───────────────────────────────────────────────────
  const handleAddDeadline = async () => {
    if (!newDL.titre || !newDL.dateEcheance) return;
    setAddingDL(true);
    try {
      const res = await api.post<Deadline>("/deadlines", newDL);
      setDeadlines(prev => [...prev, { ...res.data, important: newDL.important }]);
    } catch {
      setDeadlines(prev => [...prev, { id: Date.now(), ...newDL }]);
    } finally {
      setShowAddDL(false);
      setNewDL({ titre: "", dateEcheance: "", description: "", important: false });
      setSelectedDay(null);
      setAddingDL(false);
    }
  };

  // ── Calendrier ─────────────────────────────────────────────────────────────
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth     = new Date(calYear, calMonth + 1, 0).getDate();

  // map jour → "important" | "normal"
  const deadlineMap = new Map<number, "important"|"normal">();
  deadlines.forEach(d => {
    const dt = new Date(d.dateEcheance);
    if (dt.getFullYear() === calYear && dt.getMonth() === calMonth) {
      const day = dt.getDate();
      if (d.important) deadlineMap.set(day, "important");
      else if (!deadlineMap.has(day)) deadlineMap.set(day, "normal");
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
    const iso = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setNewDL(prev => ({ ...prev, dateEcheance: iso }));
    setShowAddDL(true);
  };

  // ── Deadlines à venir (30 j) ───────────────────────────────────────────────
  const upcoming = [...deadlines]
    .filter(d => {
      const diff = (new Date(d.dateEcheance).getTime() - today.getTime()) / 86400000;
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => {
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime();
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const roleInfo   = roleLabel[profile.role] ?? { label: profile.role, color: "bg-gray-100 text-gray-700" };
  const initials   = profile.nom.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const displayPhoto = profile.photoUrl || photoPreview;

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {saveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium"
          >
            <Check size={14} /> {saveMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
            <p className={`text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Gérez vos informations personnelles et vos deadlines
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </motion.div>

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══ Colonne gauche ══════════════════════════════════════════════ */}
          <div className="space-y-6">

            {/* Carte profil */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative group mb-4">
                  {displayPhoto ? (
                    <img src={displayPhoto} alt={profile.nom}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-100 dark:ring-blue-900"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {initials}
                    </div>
                  )}
                  <button onClick={() => setEditPhoto(true)}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </button>
                </div>

                <h2 className="text-lg font-semibold">{profile.nom}</h2>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{profile.email}</p>

                <div className="mt-4 w-full space-y-2 text-left">
                  {[
                    { icon: Mail,      val: profile.email },
                    { icon: Phone,     val: profile.telephone ?? "Non renseigné" },
                    { icon: Building2, val: profile.entreprise ?? "Non renseigné" },
                    { icon: MapPin,    val: profile.ville ?? "Non renseigné" },
                  ].map(({ icon: Icon, val }, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      <Icon size={14} className={isDark ? "text-gray-500" : "text-gray-400"} />
                      <span className="truncate">{val}</span>
                    </div>
                  ))}
                </div>

                {profile.encadrantNom && (
                  <div className={`mt-4 w-full rounded-xl px-3 py-2 text-sm ${isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                    <span className="font-medium">Encadrant :</span> {profile.encadrantNom}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Panneau modifier photo ─────────────────────────────────── */}
            <AnimatePresence>
              {editPhoto && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl p-5 border shadow-md ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Camera size={14} /> Changer la photo
                    </h3>
                    <button onClick={() => setEditPhoto(false)}>
                      <X size={16} className={isDark ? "text-gray-400" : "text-gray-500"} />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className={`flex rounded-xl p-1 mb-4 gap-1 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                    {(["file","url"] as const).map(mode => (
                      <button key={mode} onClick={() => setPhotoMode(mode)}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-all ${
                          photoMode === mode
                            ? "bg-blue-600 text-white shadow"
                            : isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                        }`}>
                        {mode === "file" ? <><Upload size={12} /> Depuis mon PC</> : <><LinkIcon size={12} /> URL</>}
                      </button>
                    ))}
                  </div>

                  {/* Mode fichier */}
                  {photoMode === "file" && (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      <button onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                          isDark
                            ? "border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400"
                            : "border-gray-300 hover:border-blue-400 text-gray-400 hover:text-blue-500"
                        }`}>
                        <Upload size={24} />
                        <span className="text-sm font-medium">Cliquer pour choisir une image</span>
                        <span className="text-xs opacity-70">JPG, PNG, WEBP — max 5 Mo</span>
                      </button>
                    </>
                  )}

                  {/* Mode URL */}
                  {photoMode === "url" && (
                    <input type="url" value={photoInput}
                      onChange={e => { setPhotoInput(e.target.value); setPhotoPreview(e.target.value); }}
                      placeholder="https://example.com/photo.jpg"
                      className={`w-full text-sm px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  )}

                  {/* Prévisualisation */}
                  {photoPreview && (
                    <div className="mt-3 relative">
                      <img src={photoPreview} alt="preview"
                        className="w-full h-32 object-cover rounded-xl"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-lg font-medium ${isDark ? "bg-gray-900/80 text-gray-300" : "bg-white/80 text-gray-600"}`}>
                        Aperçu
                      </span>
                    </div>
                  )}

                  <button onClick={handleSavePhoto} disabled={saving || !photoInput}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-40">
                    {saving
                      ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      : <><Save size={14} /> Enregistrer</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className={`rounded-2xl p-5 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-blue-500" /> Informations
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Rapports",    val: "—",                                          icon: "📄" },
                  { label: "Deadlines",   val: deadlines.length,                             icon: "⏰" },
                  { label: "Importantes", val: deadlines.filter(d => d.important).length,    icon: "🚨" },
                  { label: "Statut",      val: "Actif",                                      icon: "✅" },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl p-3 text-center ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                    <div className="text-lg">{s.icon}</div>
                    <div className="text-lg font-bold mt-0.5">{s.val}</div>
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* ══ Colonne droite ══════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Calendrier ────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  <h3 className="font-semibold">Calendrier des deadlines</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium w-36 text-center">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                  <div key={d} className={`text-center text-xs font-medium py-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day      = i + 1;
                  const isToday  = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                  const dlType   = deadlineMap.get(day);
                  const isSel    = selectedDay === day;

                  return (
                    <motion.button key={day}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleDayClick(day)}
                      className={`relative aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-all
                        ${isToday
                          ? "bg-blue-600 text-white"
                          : isSel
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : isDark ? "hover:bg-gray-800 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                      {day}
                      {dlType && (
                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          isToday ? "bg-white" : dlType === "important" ? "bg-red-500" : "bg-orange-400"
                        }`} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> Aujourd'hui</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Importante</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Deadline</span>
                </div>
                <button
                  onClick={() => { setSelectedDay(null); setNewDL({ titre:"", dateEcheance:"", description:"", important:false }); setShowAddDL(true); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>
            </motion.div>

            {/* ── Formulaire nouvelle deadline ───────────────────────────── */}
            <AnimatePresence>
              {showAddDL && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-blue-100"}`}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Plus size={14} className="text-blue-500" /> Nouvelle deadline
                        {selectedDay && <span className="text-blue-600 dark:text-blue-400">— {selectedDay} {MONTHS[calMonth]}</span>}
                      </h3>
                      <button onClick={() => { setShowAddDL(false); setSelectedDay(null); }}>
                        <X size={16} className={isDark ? "text-gray-400" : "text-gray-500"} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>Titre *</label>
                        <input type="text" value={newDL.titre}
                          onChange={e => setNewDL(p => ({ ...p, titre: e.target.value }))}
                          placeholder="Ex: Rendu rapport final"
                          className={`w-full text-sm px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>Date *</label>
                        <input type="date" value={newDL.dateEcheance}
                          onChange={e => setNewDL(p => ({ ...p, dateEcheance: e.target.value }))}
                          className={`w-full text-sm px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={`text-xs font-medium mb-1 block ${isDark ? "text-gray-400" : "text-gray-600"}`}>Description (optionnel)</label>
                        <textarea value={newDL.description}
                          onChange={e => setNewDL(p => ({ ...p, description: e.target.value }))}
                          placeholder="Détails supplémentaires..." rows={2}
                          className={`w-full text-sm px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                            isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>

                      {/* Toggle Importante */}
                      <div className="sm:col-span-2">
                        <button type="button"
                          onClick={() => setNewDL(p => ({ ...p, important: !p.important }))}
                          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all ${
                            newDL.important
                              ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                              : isDark ? "border-gray-700 bg-gray-800 hover:border-gray-600" : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            newDL.important ? "bg-red-500" : isDark ? "bg-gray-700" : "bg-gray-200"
                          }`}>
                            {newDL.important && <Check size={12} className="text-white" />}
                          </div>
                          <Flag size={14} className={newDL.important ? "text-red-500" : "text-gray-400"} />
                          <span className={`text-sm font-medium ${newDL.important ? "text-red-600 dark:text-red-400" : isDark ? "text-gray-300" : "text-gray-600"}`}>
                            Marquer comme importante
                          </span>
                          {newDL.important && (
                            <span className="ml-auto text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-lg">
                              URGENT
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button onClick={handleAddDeadline} disabled={!newDL.titre || !newDL.dateEcheance || addingDL}
                        className={`flex-1 flex items-center justify-center gap-2 text-white text-sm font-medium py-2 rounded-xl transition-colors disabled:opacity-50 ${
                          newDL.important ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                        }`}>
                        {addingDL
                          ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          : <><Check size={14} /> Créer la deadline</>}
                      </button>
                      <button onClick={() => { setShowAddDL(false); setSelectedDay(null); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                        Annuler
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Deadlines à venir ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bell size={16} className="text-orange-500" /> Deadlines à venir
                </h3>
                <div className="flex items-center gap-2">
                  {deadlines.filter(d => d.important).length > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">
                      <AlertCircle size={10} />
                      {deadlines.filter(d => d.important).length} importante{deadlines.filter(d => d.important).length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>30 prochains jours</span>
                </div>
              </div>

              {upcoming.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                  <Clock size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucune deadline dans les 30 prochains jours</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((dl, i) => {
                    const daysLeft = Math.ceil((new Date(dl.dateEcheance).getTime() - today.getTime()) / 86400000);

                    const cardClass = dl.important
                      ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                      : daysLeft <= 3
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-900/15 dark:border-orange-800"
                      : daysLeft <= 7
                      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
                      : isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200";

                    const badgeClass = dl.important
                      ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                      : daysLeft <= 3
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                      : daysLeft <= 7
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";

                    return (
                      <motion.div key={dl.id}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${cardClass}`}
                      >
                        {/* Barre rouge si important */}
                        {dl.important && <div className="shrink-0 w-1 h-10 rounded-full bg-red-500" />}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${dl.important ? "text-red-700 dark:text-red-400" : ""}`}>
                              {dl.titre}
                            </p>
                            {dl.important && (
                              <span className="shrink-0 flex items-center gap-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                                <Flag size={10} /> URGENT
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(dl.dateEcheance).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                          </p>
                          {dl.description && (
                            <p className={`text-xs mt-0.5 truncate italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                              {dl.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${badgeClass}`}>
                            {daysUntil(dl.dateEcheance)}
                          </span>
                          {/* Toggle flag urgent */}
                          <button onClick={() => toggleImportant(dl.id)}
                            title={dl.important ? "Retirer urgent" : "Marquer urgent"}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              dl.important
                                ? "bg-red-100 dark:bg-red-900/40 text-red-500"
                                : isDark ? "bg-gray-700 hover:bg-red-900/30 text-gray-500 hover:text-red-400"
                                          : "bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500"
                            }`}>
                            <Flag size={12} />
                          </button>
                          {/* Supprimer */}
                          <button onClick={() => deleteDeadline(dl.id)} title="Supprimer"
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              isDark
                                ? "bg-gray-700 hover:bg-red-900/30 text-gray-500 hover:text-red-400"
                                : "bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500"
                            }`}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {deadlines.length > 6 && (
                <p className={`text-xs text-center mt-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  + {deadlines.length - 6} autres deadlines
                </p>
              )}
            </motion.div>

            {/* ── Infos stage ───────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`rounded-2xl p-6 border shadow-sm ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-500" /> Informations de stage
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Briefcase, label: "Type",       val: "Stage PFE" },
                  { icon: BookOpen,  label: "Spécialité", val: "Informatique" },
                  { icon: MapPin,    label: "Lieu",       val: profile.ville ?? "—" },
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