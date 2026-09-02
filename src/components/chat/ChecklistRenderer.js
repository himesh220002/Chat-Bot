import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, X, Plus, Star, Download, FileJson, FileText, Copy, Trash2, Edit2, Save, ExternalLink, ListChecks, Users, Utensils, HelpingHand, Sparkles } from "lucide-react";

const iconMap = {
  "party-items": ListChecks,
  "party": ListChecks,
  "members": Users,
  "members-call": Users,
  "call": Users,
  "food": Utensils,
  "food-items": Utensils,
  "help": HelpingHand,
  "help-options": HelpingHand,
  "default": ListChecks
};

const getIcon = (id) => {
  const key = String(id || '').toLowerCase();
  for (const k in iconMap) if (key.includes(k)) return iconMap[k];
  return iconMap.default;
};

const StarRating = ({ value = 0, onChange, readonly }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(n === value ? 0 : n)}
          className={`p-0.5 transition-colors ${n <= value ? 'text-amber-400' : 'text-white/20 hover:text-amber-300/60'} ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          title={`${n} star${n>1?'s':''}`}
        >
          <Star size={14} className={n <= value ? 'fill-amber-400' : 'fill-transparent'} />
        </button>
      ))}
    </div>
  );
};

const ChecklistRenderer = ({ raw, isStreaming }) => {
  const [svg, setSvg] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState(null);
  const [branchesState, setBranchesState] = useState([]);
  const [formFieldsState, setFormFieldsState] = useState([]);
  const [guestTableState, setGuestTableState] = useState({ columns: ["Guest Name","Category","RSVP Status","Meal Preference","Notes"], rows: [] });
  const [inputs, setInputs] = useState({});
  const [editing, setEditing] = useState({}); // {branchId-itemIdx: true}
  const [editTexts, setEditTexts] = useState({});
  const [openDialog, setOpenDialog] = useState(null); // branchId
  const [copied, setCopied] = useState(false);
  const mermaidIdRef = useRef(`chk-mermaid-${Math.random().toString(36).substr(2,9)}`);

  // Parse JSON with auto-repair for unquoted keys (e.g. text: "val" instead of "text": "val")
  useEffect(() => {
    if (isStreaming) return;
    try {
      const trimmed = String(raw).trim();
      const parseLooseJson = (str) => {
        const input = String(str || '').trim();
        if (!input) throw new Error('Empty JSON input');
        
        // 1. Direct JSON parse
        try { return JSON.parse(input); } catch (e) {}

        // 2. Extract JSON substring if surrounded by markdown or commentary
        let cleaned = input;
        const jsonMatch = input.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) cleaned = jsonMatch[0];

        // 3. Direct JSON parse on extracted substring
        try { return JSON.parse(cleaned); } catch (e) {}

        // 4. Regex repairs: malformed single quotes, unquoted keys, trailing commas
        try {
          const repaired = cleaned
            .replace(/([a-zA-Z0-9_$]+)':/g, '"$1":')
            .replace(/:\s*([^'"\r\n{}[\],]+)'\s*([,}])/g, ': "$1"$2')
            .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
            .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
            .replace(/,\s*([}\]])/g, '$1');
          return JSON.parse(repaired);
        } catch (e) {}

        // 5. Safe JS Object literal evaluator (handles loose object literals from LLMs)
        try {
          const jsRepaired = cleaned
            .replace(/([a-zA-Z0-9_$]+)':/g, '$1:')
            .replace(/:\s*([^'"\r\n{}[\],]+)'\s*([,}])/g, ': "$1"$2');
          if (/^\s*[{[]/.test(jsRepaired)) {
            // eslint-disable-next-line no-new-func
            const parsedObj = (new Function(`"use strict"; return (${jsRepaired});`))();
            if (parsedObj && typeof parsedObj === 'object') return parsedObj;
          }
        } catch (e) {}

        throw new Error('Invalid JSON structure');
      };

      const parsed = parseLooseJson(trimmed);
      // Branches
      let branches = parsed.branches || parsed.sections || parsed.categories || parsed.items || parsed.checklist || [];
      if (Array.isArray(parsed) && !branches.length) branches = parsed;
      if (!branches.length && parsed.title && Array.isArray(parsed.items)) {
        branches = [{ id: 'main', title: parsed.title, items: parsed.items }];
      }
      const normalizedBranches = branches.map((b, idx) => {
        const id = b.id || b.key || `branch-${idx}`;
        const title = b.title || b.name || b.label || `Branch ${idx+1}`;
        const icon = b.icon || b.emoji || '';
        let items = b.items || b.tasks || b.checklist || b.list || [];
        if (!Array.isArray(items)) items = [];
        const normalizedItems = items.map((it, i) => {
          if (typeof it === 'string') return { text: it, checked: false, rating: 0, id: `${id}-${i}` };
          return {
            text: it.text || it.label || it.name || it.task || String(it),
            checked: !!it.checked || !!it.done || !!it.completed,
            rating: it.rating || it.stars || it.rate || 0,
            id: it.id || `${id}-${i}`
          };
        });
        return { id: String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-'), title, icon, items: normalizedItems, description: b.description || b.desc || '' };
      });
      // Form fields (Event Overview)
      let formFields = parsed.formFields || parsed.fields || parsed.form || parsed.eventOverview || [];
      if (!Array.isArray(formFields) && typeof formFields === 'object' && formFields !== null) {
        // object map
        formFields = Object.entries(formFields).map(([k,v]) => ({ id: k, label: k, value: String(v) }));
      }
      const normalizedFields = (Array.isArray(formFields) ? formFields : []).map((f, i) => {
        if (typeof f === 'string') return { id: `field-${i}`, label: f, value: '' };
        return { id: f.id || `field-${i}`, label: f.label || f.name || f.key || `Field ${i+1}`, value: f.value || f.default || '', placeholder: f.placeholder || '' };
      });
      // Table normalization
      let table = parsed.table || parsed.guestTable || parsed.guestTracking || parsed.guestsTable || null;
      let normalizedTable = { columns: ["Guest Name","Category","RSVP Status","Meal Preference","Notes"], rows: [] };
      if (table) {
        if (Array.isArray(table)) {
          if (table.length > 0 && typeof table[0] === 'object' && table[0] !== null) {
            const keys = Object.keys(table[0]).filter(k => k !== 'id');
            if (keys.length > 0) {
              normalizedTable.columns = keys.map(k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
            }
          }
          normalizedTable.rows = table.map((r, idx) => {
            if (typeof r === 'object' && r !== null) {
              const vals = Object.keys(r).filter(k => k !== 'id').map(k => String(r[k] ?? ''));
              return { id: r.id || `row-${idx}`, values: vals };
            }
            return { id: `row-${idx}`, values: [String(r)] };
          });
        } else if (table.columns && table.rows) {
          const cols = Array.isArray(table.columns) ? table.columns.map(c => String(c)) : ["Col 1"];
          normalizedTable.columns = cols;
          normalizedTable.rows = (Array.isArray(table.rows) ? table.rows : []).map((r, idx) => {
            if (Array.isArray(r)) return { id: `row-${idx}`, values: r.map(v => String(v ?? '')) };
            if (typeof r === 'object' && r !== null) {
              const keys = Object.keys(r);
              const vals = cols.map(col => {
                const colClean = col.toLowerCase().replace(/[^a-z0-9]/g, '');
                const matchedKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === colClean);
                return matchedKey ? String(r[matchedKey] ?? '') : '';
              });
              return { id: r.id || `row-${idx}`, values: vals };
            }
            return { id: `row-${idx}`, values: [String(r)] };
          });
        } else if (table.rows) {
          normalizedTable.rows = (Array.isArray(table.rows) ? table.rows : []).map((r, idx) => ({ id: `row-${idx}`, values: Array.isArray(r) ? r.map(v => String(v ?? '')) : [String(r)] }));
        }
      }
      const finalData = {
        title: parsed.title || parsed.name || 'Checklist Report',
        description: parsed.description || parsed.desc || '',
        branches: normalizedBranches.length ? normalizedBranches : [
          { id: 'party-items', title: 'Party Items', icon: '🎈', items: [{ text: 'Balloons', checked: false, rating: 0 }] },
          { id: 'members', title: 'Members Call List', icon: '📞', items: [] },
          { id: 'food', title: 'Food Items', icon: '🍔', items: [] },
          { id: 'help', title: 'Help Options', icon: '🤝', items: [] },
        ],
        formFields: normalizedFields,
        table: normalizedTable
      };
      setData(finalData);
      setBranchesState(finalData.branches);
      setFormFieldsState(finalData.formFields || []);
      setGuestTableState(finalData.table || { columns: ["Guest Name","Category","RSVP Status","Meal Preference","Notes"], rows: [] });
      setHasError(false);
      setErrorMsg('');
    } catch (e) {
      setHasError(true);
      setErrorMsg(e.message);
    }
  }, [raw, isStreaming]);

  // Generate mermaid from branchesState
  const mermaidCode = React.useMemo(() => {
    if (!branchesState.length) return '';
    const rootId = 'ROOT';
    let title = data?.title || 'Report';
    // sanitize title for mermaid
    const clean = (s) => String(s).replace(/["{}[\]]/g, '').replace(/[\n\r]/g, ' ').slice(0, 30);
    let code = `graph TD\n  ${rootId}["${clean(title)}"]\n`;
    branchesState.forEach((b, i) => {
      const bid = `B${i}`;
      const label = `${b.icon ? b.icon + ' ' : ''}${clean(b.title)}`;
      code += `  ${rootId} --> ${bid}["${label}"]\n`;
    });
    // Add styling hints? Let theme style
    return code;
  }, [branchesState, data]);

  // Render mermaid
  useEffect(() => {
    if (isStreaming || !mermaidCode) return;
    let mounted = true;
    const render = async () => {
      try {
        await mermaid.parse(mermaidCode);
        const { svg: rendered } = await mermaid.render(mermaidIdRef.current + '-' + Date.now(), mermaidCode);
        const normalized = rendered.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
        if (mounted) setSvg(normalized);
      } catch (e) {
        console.error('Mermaid checklist render failed', e);
        if (mounted) setSvg('');
      }
    };
    render();
    return () => { mounted = false; };
  }, [mermaidCode, isStreaming]);

  // Attach click handlers to mermaid nodes to open dialog
  useEffect(() => {
    if (!svg || !branchesState.length) return;
    // Delay to allow DOM update
    const timer = setTimeout(() => {
      const container = document.getElementById(`chk-mermaid-wrap-${mermaidIdRef.current}`);
      if (!container) return;
      const nodes = container.querySelectorAll('g.node');
      nodes.forEach((node, idx) => {
        // first node is ROOT, skip
        if (idx === 0) return;
        const branchIdx = idx - 1;
        const branch = branchesState[branchIdx];
        if (!branch) return;
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => setOpenDialog(branch.id));
        // Add hover effect
        node.addEventListener('mouseenter', () => { node.style.opacity = '0.85'; });
        node.addEventListener('mouseleave', () => { node.style.opacity = '1'; });
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [svg, branchesState]);

  const toggleCheck = (branchId, itemIdx) => {
    setBranchesState(prev => prev.map(b => {
      if (b.id !== branchId) return b;
      const newItems = b.items.map((it, i) => i === itemIdx ? { ...it, checked: !it.checked } : it);
      return { ...b, items: newItems };
    }));
  };

  const setRating = (branchId, itemIdx, rating) => {
    setBranchesState(prev => prev.map(b => {
      if (b.id !== branchId) return b;
      const newItems = b.items.map((it, i) => i === itemIdx ? { ...it, rating } : it);
      return { ...b, items: newItems };
    }));
  };

  const addItem = (branchId) => {
    const text = (inputs[branchId] || '').trim();
    if (!text) return;
    setBranchesState(prev => prev.map(b => {
      if (b.id !== branchId) return b;
      return { ...b, items: [...b.items, { text, checked: false, rating: 0, id: `${branchId}-${Date.now()}` }] };
    }));
    setInputs(prev => ({ ...prev, [branchId]: '' }));
  };

  const removeItem = (branchId, itemIdx) => {
    setBranchesState(prev => prev.map(b => {
      if (b.id !== branchId) return b;
      return { ...b, items: b.items.filter((_, i) => i !== itemIdx) };
    }));
  };

  const startEdit = (branchId, itemIdx, currentText) => {
    const key = `${branchId}-${itemIdx}`;
    setEditing(prev => ({ ...prev, [key]: true }));
    setEditTexts(prev => ({ ...prev, [key]: currentText }));
  };

  const saveEdit = (branchId, itemIdx) => {
    const key = `${branchId}-${itemIdx}`;
    const newText = (editTexts[key] || '').trim();
    if (!newText) return;
    setBranchesState(prev => prev.map(b => {
      if (b.id !== branchId) return b;
      const newItems = b.items.map((it, i) => i === itemIdx ? { ...it, text: newText } : it);
      return { ...b, items: newItems };
    }));
    setEditing(prev => ({ ...prev, [key]: false }));
  };

  const updateFormField = (id, val) => setFormFieldsState(prev => prev.map(f => f.id===id ? { ...f, value: val } : f));
  const updateGuestCell = (rowIdx, colIdx, val) => setGuestTableState(prev => ({ ...prev, rows: prev.rows.map((r,i) => i===rowIdx ? { ...r, values: r.values.map((v,j) => j===colIdx ? val : v) } : r) }));
  const addGuestRow = () => setGuestTableState(prev => ({ ...prev, rows: [...prev.rows, { id: Date.now()+Math.random(), values: Array(prev.columns.length).fill('') }] }));
  const removeGuestRow = (idx) => setGuestTableState(prev => ({ ...prev, rows: prev.rows.filter((_,i) => i!==idx) }));

  const handleDownload = (type) => {
    const title = data?.title || 'project-report';
    const filenameBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'project-report';
    if (type === 'json') {
      const payload = { title: data.title, description: data.description, branches: branchesState, formFields: formFieldsState, table: guestTableState };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filenameBase}.json`; a.click(); URL.revokeObjectURL(url);
    } else if (type === 'markdown') {
      let md = `# ${data.title}\n${data.description ? `\n${data.description}\n` : '\n'}`;
      if (formFieldsState.length) {
        md += `\n## ${data.title ? `${data.title} Overview` : 'Project Overview'}\n`;
        formFieldsState.forEach(f => { md += `- **${f.label}:** ${f.value || '_(empty)_'}\n`; });
      }
      if (guestTableState.rows.length) {
        md += `\n## ${guestTableState.columns?.[0] ? `${guestTableState.columns[0]} Tracking Matrix` : 'Data Tracking Matrix'}\n`;
        md += `| ${guestTableState.columns.join(' | ')} |\n| ${guestTableState.columns.map(()=> '---').join(' | ')} |\n`;
        guestTableState.rows.forEach(r => {
          const vals = r.values.map(v => v || ' ');
          if (vals.some(v=>v.trim())) md += `| ${vals.join(' | ')} |\n`;
        });
      }
      branchesState.forEach(b => {
        md += `\n## ${b.icon ? b.icon + ' ' : ''}${b.title}\n`;
        b.items.forEach(it => {
          const check = it.checked ? 'x' : ' ';
          const stars = it.rating ? ` ${'★'.repeat(it.rating)}${'☆'.repeat(5-it.rating)}` : '';
          md += `- [${check}] ${it.text}${stars}\n`;
        });
        if (!b.items.length) md += `- (no items)\n`;
      });
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filenameBase}.md`; a.click(); URL.revokeObjectURL(url);
    } else if (type === 'csv') {
      let csv = 'Branch,Item,Checked,Rating\n';
      branchesState.forEach(b => {
        b.items.forEach(it => {
          csv += `"${b.title}","${it.text.replace(/"/g, '""')}",${it.checked ? 'Done' : 'Todo'},${it.rating || 0}\n`;
        });
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filenameBase}.csv`; a.click(); URL.revokeObjectURL(url);
    } else if (type === 'svg') {
      if (!svg) return;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filenameBase}-diagram.svg`; a.click(); URL.revokeObjectURL(url);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify({ title: data.title, description: data.description, branches: branchesState, formFields: formFieldsState, table: guestTableState }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isStreaming) {
    return (
      <div className="my-5 sci-panel sci-panel-cut-sm border-cyan-400/20 bg-[#081e28]/80 p-6 flex items-center justify-center gap-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="mono text-xs tracking-[0.2em] text-cyan-300/70">COMPOSING CHECKLIST • HOLO-FORM</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="relative my-4 sci-panel sci-panel-cut-sm border-red-500/20 bg-[#081e28]/90 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-red-500/10 border-b border-red-500/20">
          <span className="mono text-[10px] tracking-widest text-red-300">CHECKLIST PARSE ERROR</span>
          <span className="mono text-[9px] text-red-300/60">{errorMsg}</span>
        </div>
        <SyntaxHighlighter language="json" style={vscDarkPlus} PreTag="div" className="!m-0 !bg-transparent" customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '12px' }}>
          {String(raw)}
        </SyntaxHighlighter>
      </div>
    );
  }

  if (!data) return null;

  const totalItems = branchesState.reduce((acc, b) => acc + b.items.length, 0);
  const totalChecked = branchesState.reduce((acc, b) => acc + b.items.filter(i => i.checked).length, 0);
  const progress = totalItems ? Math.round((totalChecked / totalItems) * 100) : 0;

  return (
    <div className="relative w-full my-6 sci-panel sci-panel-cut-sm border-cyan-400/20 bg-gradient-to-b from-[#0a1f2a]/90 to-[#081e28]/95 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent border-b border-cyan-400/15 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="display text-[15px] font-bold tracking-[0.14em] text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-[10px] bg-cyan-400 text-black flex items-center justify-center"><ListChecks size={14} /></span>
              {data.title?.toUpperCase()}
            </h3>
            {data.description && <p className="raj text-white/60 text-[13px] mt-1 max-w-2xl">{data.description}</p>}
            <div className="mt-2 flex items-center gap-3 mono text-[10px] tracking-widest">
              <span className="px-2 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300">{branchesState.length} BRANCHES</span>
              <span className="px-2 py-1 rounded-full bg-white/[0.04] border border-white/10 text-white/50">{totalChecked}/{totalItems} DONE • {progress}%</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        {/* Download / Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono text-[9px] tracking-[0.18em] text-white/30">EXPORT:</span>
          <button onClick={() => handleDownload('json')} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer">
            <FileJson size={12} /> JSON
          </button>
          <button onClick={() => handleDownload('markdown')} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer">
            <FileText size={12} /> MARKDOWN
          </button>
          <button onClick={() => handleDownload('csv')} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download size={12} /> CSV
          </button>
          <button onClick={() => handleDownload('svg')} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download size={12} /> SVG
          </button>
          <button onClick={handleCopy} className="mono text-[10px] tracking-widest px-3 py-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-200 flex items-center gap-1.5 cursor-pointer">
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />} {copied ? 'COPIED' : 'COPY JSON'}
          </button>
        </div>
      </div>

      {/* Mermaid Overview */}
      {svg ? (
        <div className="relative w-full bg-[#061a24] border-b border-cyan-400/10">
          <div className="flex items-center justify-between px-3 py-2 bg-cyan-400/5 border-b border-cyan-400/10 mono text-[9px] tracking-[0.16em] text-cyan-300/60">
            <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-cyan-400" /> INTERACTIVE • CLICK NODE TO OPEN CHECKLIST</span>
            <span className="hidden sm:inline">4 BRANCHES • AUTO-GENERATED</span>
          </div>
          <div id={`chk-mermaid-wrap-${mermaidIdRef.current}`} className="w-full flex justify-center items-start p-3 md:p-4 overflow-auto mermaid-viewport" style={{ minHeight: '180px' }}>
            <div dangerouslySetInnerHTML={{ __html: svg }} className="mermaid-svg-wrap w-full flex justify-center [&>svg]:!max-w-none [&>svg]:!w-auto [&>svg]:!h-auto [&>svg]:block [&>svg]:mx-auto" />
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#061a24] border-b border-cyan-400/10 mono text-xs text-cyan-300/40 text-center">Generating diagram...</div>
      )}

      {/* Project / Event Overview Form */}
      {formFieldsState.length > 0 && (
        <div className="p-4 bg-[#061a24] border-y border-cyan-400/10">
          <h4 className="mono text-[11px] tracking-[0.18em] text-cyan-300 flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded bg-cyan-400/15 border border-cyan-400/20 flex items-center justify-center"><FileText size={12} className="text-cyan-300"/></span>
            {data.title ? `${data.title.toUpperCase()} • OVERVIEW` : 'PROJECT OVERVIEW & SPECIFICATIONS'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formFieldsState.map(field => (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label className="mono text-[10px] tracking-[0.14em] text-cyan-200/70">{field.label.toUpperCase()}</label>
                <input
                  value={field.value}
                  onChange={e => updateFormField(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                  className="bg-[#0a1f2a] border border-white/10 focus:border-cyan-400/30 rounded-[10px] px-3 py-2.5 mono text-sm text-white placeholder:text-white/25 outline-none focus:shadow-[0_0_12px_rgba(0,234,255,0.15)] transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature / Data Tracking Matrix */}
      {guestTableState && guestTableState.columns && (
        <div className="p-3 md:p-4 bg-[#0a1f2a]/50 border-y border-cyan-400/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="mono text-[11px] tracking-[0.18em] text-cyan-300 flex items-center gap-2">
              <Users size={14} className="text-cyan-400"/>
              {(guestTableState.columns?.[0] ? `${guestTableState.columns[0]} TRACKING MATRIX` : 'DATA & FEATURE MATRIX').toUpperCase()} • EDITABLE
            </h4>
            <span className="mono text-[10px] tracking-widest text-white/40">{guestTableState.rows.length} ENTRIES</span>
          </div>
          <div className="overflow-x-auto sci-panel sci-panel-cut-sm border-cyan-400/20">
            <table className="w-full text-left border-collapse text-sm raj">
              <thead className="bg-cyan-400/10 border-b border-cyan-400/20">
                <tr>
                  {(guestTableState.columns || []).map((col, idx) => (
                    <th key={idx} className="p-2.5 mono text-[11px] tracking-widest text-cyan-200 whitespace-nowrap">{String(col)}</th>
                  ))}
                  <th className="p-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(!guestTableState.rows || guestTableState.rows.length === 0) ? (
                  <tr><td colSpan={(guestTableState.columns?.length || 1)+1} className="p-6 text-center mono text-xs tracking-widest text-white/20 border-t border-white/5">NO DATA ROWS • ADD BELOW</td></tr>
                ) : (
                  guestTableState.rows.map((row, rIdx) => (
                    <tr key={row.id || rIdx} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      {(row.values || []).map((val, cIdx) => (
                        <td key={cIdx} className="p-1.5 min-w-[140px]">
                          <input
                            value={String(val ?? '')}
                            onChange={e => updateGuestCell(rIdx, cIdx, e.target.value)}
                            placeholder={String(guestTableState.columns?.[cIdx] || `Col ${cIdx+1}`)}
                            className="w-full bg-[#061a24] border border-white/10 focus:border-cyan-400/40 rounded px-2.5 py-1.5 mono text-xs text-white placeholder:text-white/20 outline-none focus:bg-[#082230]"
                          />
                        </td>
                      ))}
                      <td className="p-1.5">
                        <button onClick={() => removeGuestRow(rIdx)} className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors" title="Delete Row"><X size={12}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="p-2 bg-black/10 border-t border-white/5 flex justify-center">
              <button onClick={addGuestRow} className="mono text-[11px] tracking-widest px-4 py-1.5 rounded-full bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-400/30 text-cyan-200 flex items-center gap-1.5 cursor-pointer transition-colors">
                <Plus size={12}/> ADD ENTRY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Cards Grid */}
      <div className="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-[radial-gradient(ellipse_at_center,rgba(0,234,255,0.04),transparent_70%)]">
        {branchesState.map((branch) => {
          const Icon = getIcon(branch.id);
          const done = branch.items.filter(i => i.checked).length;
          const branchProgress = branch.items.length ? Math.round((done / branch.items.length) * 100) : 0;
          return (
            <div key={branch.id} className="sci-panel sci-panel-cut-sm bg-[#0e222e]/90 border-white/10 hover:border-cyan-400/20 flex flex-col overflow-hidden transition-colors group">
              <div className="px-3 py-3 bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-white/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-[10px] bg-cyan-400/15 border border-cyan-400/20 flex items-center justify-center text-cyan-300 shrink-0 group-hover:bg-cyan-400 group-hover:text-black transition-colors">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="display text-xs font-bold tracking-[0.14em] text-white truncate">{branch.title.toUpperCase()}</h4>
                    <p className="mono text-[9px] tracking-widest text-white/40">{done}/{branch.items.length} • {branchProgress}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="hidden sm:block w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all" style={{ width: `${branchProgress}%` }} />
                  </div>
                  <button onClick={() => setOpenDialog(branch.id)} className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-cyan-400 text-white/60 hover:text-black border border-white/10 hover:border-cyan-400 flex items-center justify-center transition-colors cursor-pointer" title="Open dialog">
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3 space-y-2 min-h-[140px] max-h-[320px] overflow-y-auto scrollbar-thin">
                {branch.items.length === 0 ? (
                  <div className="py-8 text-center mono text-xs tracking-widest text-white/20 border border-dashed border-white/10 rounded">NO ITEMS • ADD BELOW</div>
                ) : (
                  branch.items.map((it, idx) => {
                    const editKey = `${branch.id}-${idx}`;
                    const isEditing = !!editing[editKey];
                    return (
                      <div key={it.id || idx} className={`group/item flex items-center gap-2.5 p-2.5 rounded-[10px] border transition-all ${it.checked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}`}>
                        <button onClick={() => toggleCheck(branch.id, idx)} className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${it.checked ? 'bg-emerald-400 border-emerald-400 text-black' : 'bg-transparent border-white/20 hover:border-cyan-400/50 text-transparent'}`}>
                          <Check size={12} className={it.checked ? 'opacity-100' : 'opacity-0'} />
                        </button>
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input value={editTexts[editKey] || ''} onChange={e => setEditTexts(prev => ({ ...prev, [editKey]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') saveEdit(branch.id, idx); if (e.key === 'Escape') setEditing(prev => ({ ...prev, [editKey]: false })); }} className="flex-1 bg-[#061a24] border border-cyan-400/20 rounded px-2 py-1 mono text-xs text-white outline-none" autoFocus />
                              <button onClick={() => saveEdit(branch.id, idx)} className="w-6 h-6 rounded bg-emerald-400 text-black flex items-center justify-center cursor-pointer"><Save size={12} /></button>
                              <button onClick={() => setEditing(prev => ({ ...prev, [editKey]: false }))} className="w-6 h-6 rounded bg-white/10 text-white flex items-center justify-center cursor-pointer"><X size={12} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`flex-1 raj text-[13px] leading-5 truncate ${it.checked ? 'line-through text-white/40' : 'text-white'}`}>{it.text}</span>
                              <button onClick={() => startEdit(branch.id, idx, it.text)} className="opacity-0 group-hover/item:opacity-100 w-6 h-6 rounded bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer" title="Edit">
                                <Edit2 size={10} />
                              </button>
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            <StarRating value={it.rating || 0} onChange={(v) => setRating(branch.id, idx, v)} />
                            {it.checked && <span className="mono text-[9px] tracking-widest text-emerald-300">DONE</span>}
                          </div>
                        </div>
                        <button onClick={() => removeItem(branch.id, idx)} className="opacity-0 group-hover/item:opacity-100 w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0" title="Remove">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 border-t border-white/5 bg-black/10 flex items-center gap-2">
                <input value={inputs[branch.id] || ''} onChange={e => setInputs(prev => ({ ...prev, [branch.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addItem(branch.id); }} placeholder="Add new item..." className="flex-1 bg-[#061a24] border border-white/10 focus:border-cyan-400/30 rounded-full px-3 py-2 mono text-xs text-white placeholder:text-white/25 outline-none" />
                <button onClick={() => addItem(branch.id)} disabled={!(inputs[branch.id] || '').trim()} className="w-8 h-8 rounded-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed text-black flex items-center justify-center transition-colors cursor-pointer shrink-0">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 bg-[#061a24] border-t border-cyan-400/10 flex flex-wrap items-center justify-between gap-2 mono text-[10px] tracking-[0.14em] text-white/30">
        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> EDITABLE • TICK • RATE • ADD/REMOVE</span>
        <span className="hidden sm:inline">DOWNLOAD WHEN SATISFIED • JSON / MD / CSV / SVG</span>
      </div>

      {/* Dialog Modal */}
      {openDialog && (() => {
        const branch = branchesState.find(b => b.id === openDialog);
        if (!branch) return null;
        const Icon = getIcon(branch.id);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpenDialog(null)} />
            <div className="relative w-full max-w-2xl max-h-[85vh] sci-panel sci-panel-cut bg-[#0a1f2a] border-cyan-400/20 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-fade-in-up">
              <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-400/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-cyan-400 text-black flex items-center justify-center"><Icon size={16} /></div>
                  <div>
                    <h3 className="display text-sm font-bold tracking-[0.14em] text-white">{branch.title.toUpperCase()} • CHECKLIST</h3>
                    <p className="mono text-[10px] tracking-widest text-white/40">{branch.items.length} items • click tick / stars to rate</p>
                  </div>
                </div>
                <button onClick={() => setOpenDialog(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/30 text-white/60 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin bg-[#061a24]">
                {branch.items.map((it, idx) => (
                  <div key={it.id || idx} className={`flex items-center gap-3 p-3 rounded-[10px] border ${it.checked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                    <button onClick={() => toggleCheck(branch.id, idx)} className={`w-6 h-6 rounded-[7px] border flex items-center justify-center shrink-0 cursor-pointer ${it.checked ? 'bg-emerald-400 border-emerald-400 text-black' : 'border-white/20'}`}>
                      <Check size={14} className={it.checked ? 'opacity-100' : 'opacity-0'} />
                    </button>
                    <span className={`flex-1 raj text-sm ${it.checked ? 'line-through text-white/40' : 'text-white'}`}>{it.text}</span>
                    <StarRating value={it.rating || 0} onChange={(v) => setRating(branch.id, idx, v)} />
                    <button onClick={() => removeItem(branch.id, idx)} className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-300 hover:text-white flex items-center justify-center cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                ))}
                {branch.items.length === 0 && <div className="py-10 text-center mono text-xs tracking-widest text-white/20">NO ITEMS YET</div>}
              </div>
              <div className="p-3 bg-black/20 border-t border-white/5 flex items-center gap-2">
                <input value={inputs[branch.id] || ''} onChange={e => setInputs(prev => ({ ...prev, [branch.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') addItem(branch.id); }} placeholder={`Add to ${branch.title}...`} className="flex-1 bg-[#061a24] border border-white/10 focus:border-cyan-400/30 rounded-full px-4 py-2.5 mono text-sm text-white placeholder:text-white/25 outline-none" autoFocus />
                <button onClick={() => addItem(branch.id)} className="px-4 py-2.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black mono text-xs font-bold tracking-widest flex items-center gap-1.5 cursor-pointer"><Plus size={14} /> ADD</button>
                <button onClick={() => setOpenDialog(null)} className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white mono text-xs tracking-widest cursor-pointer">CLOSE</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ChecklistRenderer;
