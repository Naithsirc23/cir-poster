import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { ArrowUpRight, Bookmark, Check, ChevronRight, Clipboard, Copy, FileText, Hash, Home as HomeIcon, Inbox, Layers3, Linkedin, Loader2, Menu, MoreHorizontal, PenLine, Plus, Send, Settings2, Sparkles, UserRound, WandSparkles, X } from "lucide-react";
import { useEffect } from "react";

const channels = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, accent: "bg-[#b8ff69]", description: "Pensamiento, aprendizaje o perspectiva", soon: false },
  { id: "facebook", label: "Facebook", icon: Send, accent: "bg-[#9ac7ff]", description: "Conversación y comunidad", soon: true },
  { id: "instagram", label: "Carrusel IG", icon: Layers3, accent: "bg-[#ff9aaf]", description: "Idea visual por slides", soon: true },
  { id: "tiktok", label: "TikTok", icon: Sparkles, accent: "bg-[#d9bcff]", description: "Guion corto y hook", soon: true },
] as const;

const objectives = ["Compartir una idea", "Contar un aprendizaje", "Presentar un proyecto", "Abrir una conversación"];
const tones = ["Claro y reflexivo", "Directo y práctico", "Cercano y humano", "Provocador con criterio"];

type Step = 1 | 2 | 3 | 4;
type ChannelId = (typeof channels)[number]["id"];

const starterContent = "Escribe una idea y la convertiremos en un borrador con una voz clara, una estructura que respira y una llamada a la conversación.";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"create" | "drafts" | "profile">("create");
  const [step, setStep] = useState<Step>(1);
  const [channel, setChannel] = useState<ChannelId>("linkedin");
  const [format, setFormat] = useState<"post" | "carousel" | "short-video">("post");
  const [idea, setIdea] = useState("");
  const [objective, setObjective] = useState(objectives[0]);
  const [audience, setAudience] = useState("Personas que construyen productos digitales");
  const [tone, setTone] = useState(tones[0]);
  const [coreMessage, setCoreMessage] = useState("");
  const [callToAction, setCallToAction] = useState("¿Qué experiencia te ha enseñado algo parecido?");
  const [title, setTitle] = useState("Borrador sin título");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState("");
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draftFilter, setDraftFilter] = useState<"all" | "draft" | "archived">("all");

  const draftsQuery = trpc.content.listDrafts.useQuery(undefined, { enabled: isAuthenticated && tab === "drafts" });
  const generateMutation = trpc.content.generate.useMutation({
    onSuccess: (result) => {
      setTitle(result.title);
      setContent(`${result.hook}\n\n${result.body}\n\n${result.callToAction}\n\n${result.hashtags.join(" ")}`);
      setStep(4);
      setNotice("Borrador listo para editar");
    },
    onError: (error) => { setStep(3); setNotice(error.message || "No pudimos crear el borrador. Intenta de nuevo."); },
  });
  const saveMutation = trpc.content.createDraft.useMutation({
    onSuccess: () => { setNotice("Guardado en tu biblioteca"); void draftsQuery.refetch(); },
    onError: (error) => setNotice(error.message || "No pudimos guardar este borrador."),
  });
  const duplicateMutation = trpc.content.duplicateDraft.useMutation({
    onSuccess: () => { setNotice("Borrador duplicado"); void draftsQuery.refetch(); },
    onError: (error) => setNotice(error.message || "No pudimos duplicar el borrador."),
  });
  const archiveMutation = trpc.content.archiveDraft.useMutation({
    onSuccess: () => { setNotice("Borrador archivado"); void draftsQuery.refetch(); },
    onError: (error) => setNotice(error.message || "No pudimos archivar el borrador."),
  });

  const selectedChannel = useMemo(() => channels.find((item) => item.id === channel) ?? channels[0], [channel]);
  const SelectedChannelIcon = selectedChannel.icon;
  const visibleDrafts = useMemo(() => (draftsQuery.data ?? []).filter((draft) => draftFilter === "all" || draft.status === draftFilter), [draftsQuery.data, draftFilter]);
  const canContinue = step === 1 ? idea.trim().length >= 8 : step === 2 ? coreMessage.trim().length >= 2 : true;

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (notice) {
      const timer = window.setTimeout(() => setNotice(""), 3600);
      return () => window.clearTimeout(timer);
    }
  }, [notice]);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setNotice("Inicia sesión para guardar y generar tus borradores");
      startLogin();
      return;
    }
    action();
  };

  const generate = () => requireAuth(() => generateMutation.mutate({ idea, channel, format, objective, audience, tone, coreMessage: coreMessage || idea, callToAction }));
  const save = () => requireAuth(() => saveMutation.mutate({ title, idea: idea || title, channel, format, objective, audience, tone, coreMessage: coreMessage || idea, callToAction, content: content || starterContent }));
  const copyContent = async () => {
    await navigator.clipboard?.writeText(content || starterContent);
    setCopied(true);
    setNotice("Texto copiado al portapapeles");
    window.setTimeout(() => setCopied(false), 1600);
  };
  const begin = () => { setTab("create"); setStep(1); setNotice(""); };
  const continueStep = () => { if (step < 4) setStep((step + 1) as Step); };

  if (loading) return <div className="app-loading"><Loader2 className="spin" size={22} /><span>Preparando tu espacio creativo…</span></div>;

  return (
    <div className="studio-shell">
      <header className="studio-header">
        <div className="brand-lockup"><div className="brand-orb">C</div><div><div className="brand-name">CIR<span>·</span>POST</div><div className="brand-subtitle">content studio / 01</div></div></div>
        <div className="header-actions"><span className="live-dot" aria-label="Estudio disponible" /><button className="icon-button" aria-label="Más opciones"><MoreHorizontal size={20} /></button></div>
      </header>

      <main className="studio-main">
        {tab === "create" && <>
          <section className="welcome-block"><div className="section-kicker"><Sparkles size={13} /> CREAR CON INTENCIÓN</div><h1>Una idea.<br /><em>Una voz.</em><br />Un post que importa.</h1><p>Del pensamiento rápido a un borrador listo para editar, con la IA como copiloto y tú al mando.</p></section>
          <section className="flow-card" aria-label="Flujo de creación">
            <div className="flow-top"><div><span className="section-kicker">FLUJO DE CREACIÓN</span><h2>{step === 4 ? "Edita hasta que suene a ti." : step === 1 ? "Cuéntame la chispa." : step === 2 ? "Démosle dirección." : "Elige dónde vive."}</h2></div><span className="step-counter">0{step} / 04</span></div>
            <div className="progress-track" aria-label={`Etapa ${step} de 4`}>{[1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? "active" : ""} />)}</div>
            {step === 1 && <div className="step-content"><div className="chat-line"><div className="avatar-small">C</div><div className="chat-bubble">¿Qué quieres poner sobre la mesa hoy?</div></div><Textarea autoFocus value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Ej. Quiero contar lo que aprendí construyendo mi primer producto con IA…" className="idea-input" /><div className="char-count">{idea.length} / 2.000</div></div>}
            {step === 2 && <div className="step-content"><div className="chat-line"><div className="avatar-small ai">✦</div><div className="chat-bubble">Perfecto. Ahora afinemos el centro de la idea.</div></div><label className="field-label" htmlFor="core-message">Mensaje central</label><Textarea id="core-message" value={coreMessage} onChange={(event) => setCoreMessage(event.target.value)} placeholder="La idea que quieres que alguien recuerde…" className="idea-input compact" /><div className="field-grid"><label>Objetivo<select value={objective} onChange={(event) => setObjective(event.target.value)}>{objectives.map((item) => <option key={item}>{item}</option>)}</select></label><label>Tono<select value={tone} onChange={(event) => setTone(event.target.value)}>{tones.map((item) => <option key={item}>{item}</option>)}</select></label></div><label className="field-label" htmlFor="audience">Para quién</label><Input id="audience" value={audience} onChange={(event) => setAudience(event.target.value)} className="dark-input" /></div>}
            {step === 3 && <div className="step-content"><div className="chat-line"><div className="avatar-small ai">✦</div><div className="chat-bubble">¿Dónde quieres que empiece la conversación?</div></div><div className="channel-list">{channels.map((item) => { const Icon = item.icon; return <button key={item.id} className={`channel-row ${channel === item.id ? "selected" : ""} ${item.soon ? "soon" : ""}`} onClick={() => { setChannel(item.id); if (item.id === "linkedin") setFormat("post"); else if (item.id === "instagram") setFormat("carousel"); else if (item.id === "tiktok") setFormat("short-video"); }}><span className={`channel-icon ${item.accent}`}><Icon size={17} /></span><span className="channel-copy"><strong>{item.label}</strong><small>{item.description}</small></span>{item.soon ? <span className="soon-label">PRÓXIMAMENTE</span> : <span className={`radio-dot ${channel === item.id ? "checked" : ""}`} />}</button>; })}</div><label className="field-label" htmlFor="cta">Llamada a la acción</label><Input id="cta" value={callToAction} onChange={(event) => setCallToAction(event.target.value)} className="dark-input" /></div>}
            {step === 4 && <div className="step-content preview-step"><div className="preview-head"><div className="mini-channel"><span className="mini-avatar">C</span><span><strong>Cristhian S.I.R.</strong><small>Product Builder · ahora</small></span></div><span className="preview-network"><SelectedChannelIcon size={15} /> {selectedChannel.label.toUpperCase()}</span></div><Input value={title} onChange={(event) => setTitle(event.target.value)} className="preview-title" aria-label="Título del borrador" /><Textarea value={content || starterContent} onChange={(event) => setContent(event.target.value)} className="preview-editor" aria-label="Editar borrador" /><div className="preview-footer"><span><Hash size={14} /> {content.split(/\s+/).filter(Boolean).length || 0} palabras</span><span className="editable-label"><PenLine size={13} /> editable</span></div></div>}
            {generateMutation.isError && step === 3 && <div className="generation-error" role="alert"><span>No pudimos ordenar la idea todavía.</span><button onClick={generate}>Reintentar ahora</button></div>}<div className="flow-actions">{step > 1 && <Button variant="ghost" className="back-button" onClick={() => setStep((step - 1) as Step)}><ChevronRight className="rotate-180" size={16} /> Atrás</Button>}{step < 4 ? <Button className="next-button" disabled={!canContinue || generateMutation.isPending} onClick={step === 3 ? generate : continueStep}>{step === 3 ? (generateMutation.isError ? "Reintentar" : "Crear borrador") : "Continuar"}<ArrowUpRight size={16} /></Button> : <div className="result-actions"><Button variant="ghost" className="back-button" onClick={copyContent}>{copied ? <Check size={15} /> : <Clipboard size={15} />} {copied ? "Copiado" : "Copiar"}</Button><Button className="next-button" onClick={save}><Bookmark size={16} /> Guardar borrador</Button></div>}</div>
          </section>
          <section className="quick-context"><div className="quick-title"><span>CONTEXTO RÁPIDO</span><button onClick={() => setShowChannelPicker((value) => !value)}>{selectedChannel.label} <ChevronRight size={14} /></button></div>{showChannelPicker && <div className="quick-picker">{channels.map((item) => <button key={item.id} onClick={() => { setChannel(item.id); setShowChannelPicker(false); }}>{item.label}{item.soon && <small>próximo</small>}</button>)}</div>}<div className="quick-chips"><button className="quick-chip"><span>Objetivo</span><strong>{objective}</strong></button><button className="quick-chip"><span>Audiencia</span><strong>{audience}</strong></button><button className="quick-chip"><span>Tono</span><strong>{tone}</strong></button></div></section>
        </>}
        {tab === "drafts" && <section className="library-view"><div className="view-heading"><div><div className="section-kicker"><Inbox size={13} /> TU BIBLIOTECA</div><h1>Ideas que esperan<br /><em>su momento.</em></h1></div><Button className="round-plus" aria-label="Crear borrador" onClick={begin}><Plus size={19} /></Button></div><div className="library-filters" role="group" aria-label="Filtrar borradores">{(["all", "draft", "archived"] as const).map((filter) => <button key={filter} className={draftFilter === filter ? "active" : ""} onClick={() => setDraftFilter(filter)}>{filter === "all" ? "Todos" : filter === "draft" ? "En curso" : "Archivados"}</button>)}</div>{!isAuthenticated ? <div className="empty-state"><div className="empty-icon"><FileText /></div><h2>Tu biblioteca empieza aquí.</h2><p>Inicia sesión para guardar, retomar y duplicar tus borradores entre dispositivos.</p><Button className="next-button" onClick={startLogin}>Entrar para continuar <ArrowUpRight size={16} /></Button></div> : draftsQuery.isLoading ? <div className="empty-state"><Loader2 className="spin" /><p>Cargando tus borradores…</p></div> : visibleDrafts.length ? <div className="draft-list">{visibleDrafts.map((draft) => <div className="draft-item" key={draft.id}><button className="draft-main" onClick={() => { setIdea(draft.idea); setTitle(draft.title); setContent(draft.content); setChannel(draft.channel as ChannelId); setStep(4); setTab("create"); }}><span className="draft-icon"><FileText size={17} /></span><span><strong>{draft.title}</strong><small>{draft.channel} · {new Date(draft.updatedAt).toLocaleDateString()}</small></span><ChevronRight size={17} /></button><div className="draft-actions"><button aria-label={`Duplicar ${draft.title}`} onClick={() => duplicateMutation.mutate({ id: draft.id })}><Copy size={14} /></button><button aria-label={`Archivar ${draft.title}`} onClick={() => archiveMutation.mutate({ id: draft.id })}><MoreHorizontal size={15} /></button></div></div>)}</div> : <div className="empty-state"><div className="empty-icon"><Inbox /></div><h2>Aún no hay borradores.</h2><p>Cuando guardes una idea, aparecerá aquí para retomarla cuando quieras.</p><Button className="next-button" onClick={begin}>Crear el primero <Plus size={16} /></Button></div>}</section>}
        {tab === "profile" && <section className="profile-view"><div className="section-kicker"><Settings2 size={13} /> ESPACIO PERSONAL</div><div className="profile-hero"><div className="profile-large">{user?.name?.charAt(0) || "C"}</div><div><h1>Tu espacio<br /><em>de creación.</em></h1><p>{isAuthenticated ? `Sesión activa${user?.email ? ` · ${user.email}` : ""}` : "Crea una cuenta para guardar tu sistema editorial."}</p></div></div><div className="profile-card"><div><span>CANAL PRINCIPAL</span><strong>LinkedIn</strong></div><Linkedin size={19} /></div><div className="profile-card"><div><span>ESTILO EDITORIAL</span><strong>Claro y reflexivo</strong></div><WandSparkles size={19} /></div>{!isAuthenticated && <Button className="next-button full-button" onClick={startLogin}>Iniciar sesión <ArrowUpRight size={16} /></Button>}</section>}
      </main>
      {notice && <div className="toast" role="status"><Check size={15} /> {notice}<button aria-label="Cerrar aviso" onClick={() => setNotice("")}><X size={14} /></button></div>}
      {generateMutation.isPending && <div className="generation-overlay"><div className="generation-modal"><div className="generation-orbit"><Sparkles size={20} /></div><span className="section-kicker">COPILOTO ACTIVO</span><h2>Ordenando la idea…</h2><p>Estoy buscando el hilo, el ritmo y la forma más clara de decirlo.</p><div className="generation-bars"><i /><i /><i /></div></div></div>}
      <nav className="bottom-nav" aria-label="Navegación principal"><button className={tab === "create" ? "active" : ""} onClick={() => setTab("create")}><PenLine size={19} /><span>Crear</span></button><button className={tab === "drafts" ? "active" : ""} onClick={() => setTab("drafts")}><Bookmark size={19} /><span>Borradores</span></button><button className="nav-create" onClick={begin} aria-label="Nuevo borrador"><Plus size={23} /></button><button onClick={() => setTab("profile")} className={tab === "profile" ? "active" : ""}><UserRound size={19} /><span>Perfil</span></button><button onClick={() => setNotice("Más canales estarán disponibles pronto")}><Menu size={19} /><span>Más</span></button></nav>
    </div>
  );
}
