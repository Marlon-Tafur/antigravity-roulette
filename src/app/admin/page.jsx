'use client';
import { useState, useEffect, useCallback } from 'react';

// ============================
// ADMIN PAGE — Password gate + Tabs
// ============================
export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [roulettes, setRoulettes] = useState([]);
    const [selectedRoulette, setSelectedRoulette] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check stored auth
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('admin_authed');
            if (stored === 'true') setAuthed(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        const adminPwd = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
        if (password === adminPwd) {
            setAuthed(true);
            sessionStorage.setItem('admin_authed', 'true');
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const fetchRoulettes = useCallback(async () => {
        try {
            const res = await fetch('/api/roulettes');
            const data = await res.json();
            setRoulettes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching roulettes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authed) fetchRoulettes();
    }, [authed, fetchRoulettes]);

    if (!authed) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
                <div className="card" style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔒</div>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>Panel de Admin</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-lg)' }}>Ingresa la contraseña para continuar</p>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <input
                            type="password"
                            className="input"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-primary">Ingresar</button>
                    </form>
                </div>
            </main>
        );
    }

    const tabs = ['Mis Ruletas', 'Ítems', 'Personalización', 'Formulario', 'Resultados'];

    return (
        <main style={{ minHeight: '100vh', padding: 'var(--space-lg)' }}>
            <div className="container">
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div>
                        <h1>⚙️ Panel de Administración</h1>
                        <p>Gestiona tus ruletas, premios y participantes</p>
                    </div>
                    <button className="btn btn-sm" onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false); }}>
                        Cerrar sesión
                    </button>
                </div>

                <div className="tabs" style={{ marginBottom: 'var(--space-xl)' }}>
                    {tabs.map((tab, i) => (
                        <button key={i} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 0 && <RoulettesTab roulettes={roulettes} onRefresh={fetchRoulettes} selectedRoulette={selectedRoulette} onSelect={setSelectedRoulette} loading={loading} />}
                {activeTab === 1 && <ItemsTab roulettes={roulettes} selectedRoulette={selectedRoulette} onSelect={setSelectedRoulette} />}
                {activeTab === 2 && <CustomizationTab roulettes={roulettes} selectedRoulette={selectedRoulette} onSelect={setSelectedRoulette} onRefresh={fetchRoulettes} />}
                {activeTab === 3 && <FormTab roulettes={roulettes} selectedRoulette={selectedRoulette} onSelect={setSelectedRoulette} onRefresh={fetchRoulettes} />}
                {activeTab === 4 && <ResultsTab roulettes={roulettes} selectedRoulette={selectedRoulette} onSelect={setSelectedRoulette} />}
            </div>
        </main>
    );
}

// ============================
// ROULETTE SELECTOR
// ============================
function RouletteSelector({ roulettes, selected, onSelect }) {
    if (roulettes.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay ruletas. Crea una primero.</p>;
    return (
        <div className="input-group" style={{ maxWidth: '300px', marginBottom: 'var(--space-lg)' }}>
            <label>Seleccionar Ruleta</label>
            <select className="input" value={selected?.id || ''} onChange={(e) => {
                const r = roulettes.find(r => r.id === e.target.value);
                onSelect(r || null);
            }}>
                <option value="">-- Selecciona --</option>
                {roulettes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code_6d})</option>
                ))}
            </select>
        </div>
    );
}

// ============================
// TAB 1: MIS RULETAS
// ============================
function RoulettesTab({ roulettes, onRefresh, selectedRoulette, onSelect, loading }) {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const createRoulette = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/roulettes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName || 'Nueva Ruleta' }),
            });
            const data = await res.json();
            if (res.ok) {
                setNewName('');
                setShowCreate(false);
                await onRefresh();
            } else {
                alert('Error al crear ruleta: ' + (data.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de conexión: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    const toggleActive = async (roulette) => {
        await fetch(`/api/roulettes/${roulette.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !roulette.is_active }),
        });
        await onRefresh();
    };

    const togglePhysical = async (roulette) => {
        await fetch(`/api/roulettes/${roulette.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_physical: !roulette.is_physical }),
        });
        await onRefresh();
    };

    const saveEditName = async (roulette) => {
        if (!editName.trim()) return;
        await fetch(`/api/roulettes/${roulette.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName.trim() }),
        });
        setEditingId(null);
        setEditName('');
        await onRefresh();
    };

    const deleteRoulette = async (id) => {
        if (!confirm('¿Eliminar esta ruleta y todos sus datos?')) return;
        await fetch(`/api/roulettes/${id}`, { method: 'DELETE' });
        if (selectedRoulette?.id === id) onSelect(null);
        await onRefresh();
    };

    const resetSession = async (roulette) => {
        await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roulette_id: roulette.id, status: 'libre', current_participant_id: null }),
        });
        alert('Sesión reseteada a "libre"');
    };

    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>🎰 Mis Ruletas</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Crear Ruleta</button>
            </div>

            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Crear Nueva Ruleta</h2>
                        <form onSubmit={createRoulette} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div className="input-group">
                                <label>Nombre del evento</label>
                                <input className="input" placeholder="Ej: Fiesta de Navidad" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={() => setShowCreate(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creando…' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
                    <div className="loading-spinner"></div>
                </div>
            ) : roulettes.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🎰</div>
                    <h3>No hay ruletas</h3>
                    <p>Crea tu primera ruleta para comenzar a personalizar y jugar</p>
                </div>
            ) : (
                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                    {roulettes.map(r => (
                        <div key={r.id} className="card" style={{ cursor: 'pointer', borderColor: selectedRoulette?.id === r.id ? 'var(--accent-primary)' : undefined }} onClick={() => onSelect(r)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                                <div style={{ flex: 1 }}>
                                    {editingId === r.id ? (
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                            <input className="input" value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={{ fontSize: '0.9rem', padding: '4px 8px', height: 'auto' }}
                                                onKeyDown={e => { if (e.key === 'Enter') saveEditName(r); if (e.key === 'Escape') setEditingId(null); }} />
                                            <button className="btn btn-sm btn-primary" onClick={() => saveEditName(r)} style={{ padding: '4px 8px' }}>✓</button>
                                            <button className="btn btn-sm" onClick={() => setEditingId(null)} style={{ padding: '4px 8px' }}>✕</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{r.name}</h3>
                                            <button className="btn btn-icon" onClick={(e) => { e.stopPropagation(); setEditingId(r.id); setEditName(r.name); }} title="Editar nombre" style={{ width: 24, height: 24, fontSize: '0.75rem', opacity: 0.6 }}>✏️</button>
                                        </div>
                                    )}
                                    <div style={{ fontFamily: 'monospace', color: 'var(--text-accent)', fontSize: '0.9rem', marginTop: '2px' }}>
                                        Código: {r.code_6d}
                                    </div>
                                </div>
                                <span className={`badge ${r.is_active ? 'badge-success' : 'badge-danger'}`}>
                                    {r.is_active ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>

                            {/* Physical toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: r.is_physical ? 'rgba(253, 203, 110, 0.1)' : 'rgba(108, 92, 231, 0.08)', border: '1px solid', borderColor: r.is_physical ? 'rgba(253, 203, 110, 0.3)' : 'rgba(108, 92, 231, 0.15)', marginBottom: 'var(--space-sm)' }} onClick={e => e.stopPropagation()}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: r.is_physical ? '#fdcb6e' : 'var(--text-secondary)' }}>
                                        {r.is_physical ? '🎯 Ruleta Física' : '💻 Ruleta Virtual'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {r.is_physical ? 'Asignación manual de premios' : 'Giro automático en pantalla'}
                                    </div>
                                </div>
                                <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={!!r.is_physical} onChange={() => togglePhysical(r)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); window.open(`${appUrl}/roulette/${r.id}`, '_blank'); }}>
                                    📺 Ver Ruleta
                                </button>
                                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); toggleActive(r); }}>
                                    {r.is_active ? '⏸ Desactivar' : '▶ Activar'}
                                </button>
                                <button className="btn btn-sm btn-success" onClick={(e) => { e.stopPropagation(); resetSession(r); }}>
                                    🔄 Resetear
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); deleteRoulette(r.id); }}>
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================
// TAB 2: ÍTEMS
// ============================
function ItemsTab({ roulettes, selectedRoulette, onSelect }) {
    const [items, setItems] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({ label: '', emoji: '🎁', image_url: '' });
    const [loading, setLoading] = useState(false);

    const fetchItems = useCallback(async () => {
        if (!selectedRoulette) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/items?roulette_id=${selectedRoulette.id}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, [selectedRoulette]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const addItem = async (e) => {
        e.preventDefault();
        await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newItem, roulette_id: selectedRoulette.id }),
        });
        setNewItem({ label: '', emoji: '🎁', image_url: '' });
        setShowAdd(false);
        await fetchItems();
    };

    const deleteItem = async (id) => {
        if (!confirm('¿Eliminar este premio?')) return;
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
        await fetchItems();
    };

    const toggleItem = async (item) => {
        await fetch(`/api/items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !item.is_active }),
        });
        await fetchItems();
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🎁 Ítems / Premios</h2>
            <RouletteSelector roulettes={roulettes} selected={selectedRoulette} onSelect={onSelect} />

            {selectedRoulette && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{items.filter(i => i.is_active).length} activos de {items.length} total</span>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Agregar Premio</button>
                    </div>

                    {showAdd && (
                        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <h2>Agregar Premio</h2>
                                <form onSubmit={addItem} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    <div className="input-group">
                                        <label>Nombre del premio</label>
                                        <input className="input" placeholder="Ej: Descuento 20%" value={newItem.label} onChange={(e) => setNewItem(p => ({ ...p, label: e.target.value }))} required autoFocus />
                                    </div>
                                    <div className="input-group">
                                        <label>Emoji</label>
                                        <input className="input" placeholder="🎁" value={newItem.emoji} onChange={(e) => setNewItem(p => ({ ...p, emoji: e.target.value }))} style={{ fontSize: '1.5rem', width: '80px' }} />
                                    </div>
                                    <div className="input-group">
                                        <label>URL de imagen (opcional)</label>
                                        <input className="input" type="url" placeholder="https://..." value={newItem.image_url} onChange={(e) => setNewItem(p => ({ ...p, image_url: e.target.value }))} />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn" onClick={() => setShowAdd(false)}>Cancelar</button>
                                        <button type="submit" className="btn btn-primary">Agregar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}><div className="loading-spinner"></div></div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">🎁</div>
                            <h3>Sin premios</h3>
                            <p>Agrega premios para que la ruleta tenga sectores</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {items.map(item => (
                                <div key={item.id} className="card" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: item.is_active ? 1 : 0.5 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{item.label}</div>
                                            <span className={`badge ${item.is_active ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '4px' }}>
                                                {item.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                        <button className="btn btn-icon" onClick={() => toggleItem(item)} title={item.is_active ? 'Desactivar' : 'Activar'}>
                                            {item.is_active ? '⏸' : '▶'}
                                        </button>
                                        <button className="btn btn-icon btn-danger" onClick={() => deleteItem(item.id)} title="Eliminar">
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ============================
// TAB 3: PERSONALIZACIÓN
// ============================
function CustomizationTab({ roulettes, selectedRoulette, onSelect, onRefresh }) {
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [colors, setColors] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (selectedRoulette) {
            setName(selectedRoulette.name || '');
            setLogoUrl(selectedRoulette.logo_url || '');
            setColors(selectedRoulette.colors || []);
        }
    }, [selectedRoulette]);

    const save = async () => {
        if (!selectedRoulette) return;
        setSaving(true);
        try {
            await fetch(`/api/roulettes/${selectedRoulette.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, logo_url: logoUrl, colors }),
            });
            await onRefresh();
        } finally {
            setSaving(false);
        }
    };

    const addColor = () => {
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        setColors([...colors, randomColor]);
    };

    const updateColor = (index, color) => {
        const updated = [...colors];
        updated[index] = color;
        setColors(updated);
    };

    const removeColor = (index) => {
        setColors(colors.filter((_, i) => i !== index));
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>🎨 Personalización</h2>
            <RouletteSelector roulettes={roulettes} selected={selectedRoulette} onSelect={onSelect} />

            {selectedRoulette && (
                <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div className="input-group">
                        <label>Nombre del evento</label>
                        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div className="input-group">
                        <label>URL del logo (centro de la ruleta)</label>
                        <input className="input" type="url" placeholder="https://..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
                    </div>

                    <div className="input-group">
                        <label>Colores de la ruleta</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
                            {colors.map((color, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => updateColor(i, e.target.value)}
                                        id={`color-${i}`}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                    />
                                    <label
                                        htmlFor={`color-${i}`}
                                        style={{
                                            display: 'block',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: color,
                                            border: '2px solid var(--border-medium)',
                                            cursor: 'pointer',
                                            transition: 'all var(--transition-fast)',
                                        }}
                                    />
                                    <button
                                        onClick={() => removeColor(i)}
                                        style={{
                                            position: 'absolute',
                                            top: '-6px',
                                            right: '-6px',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            background: 'var(--color-danger)',
                                            color: 'white',
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >✕</button>
                                </div>
                            ))}
                            <button
                                className="btn btn-icon"
                                onClick={addColor}
                                style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                            >+</button>
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={save} disabled={saving}>
                        {saving ? 'Guardando…' : '💾 Guardar cambios'}
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================
// TAB 4: FORMULARIO
// ============================
function FormTab({ roulettes, selectedRoulette, onSelect, onRefresh }) {
    const [fields, setFields] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newField, setNewField] = useState({ key: '', label: '', type: 'text', required: false });

    useEffect(() => {
        if (selectedRoulette?.form_config?.fields) {
            setFields([...selectedRoulette.form_config.fields].sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
    }, [selectedRoulette]);

    const save = async () => {
        if (!selectedRoulette) return;
        setSaving(true);
        try {
            const updatedFields = fields.map((f, i) => ({ ...f, order: i }));
            await fetch(`/api/roulettes/${selectedRoulette.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ form_config: { fields: updatedFields } }),
            });
            await onRefresh();
        } finally {
            setSaving(false);
        }
    };

    const addField = () => {
        if (!newField.key || !newField.label) return;
        setFields([...fields, { ...newField, order: fields.length }]);
        setNewField({ key: '', label: '', type: 'text', required: false });
        setShowAdd(false);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const moveField = (index, direction) => {
        const newFields = [...fields];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newFields.length) return;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields);
    };

    const toggleRequired = (index) => {
        const updated = [...fields];
        updated[index].required = !updated[index].required;
        setFields(updated);
    };

    const fieldTypes = [
        { value: 'text', label: 'Texto' },
        { value: 'email', label: 'Email' },
        { value: 'tel', label: 'Teléfono' },
        { value: 'number', label: 'Número' },
        { value: 'textarea', label: 'Texto largo' },
    ];

    return (
        <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📋 Configuración del Formulario</h2>
            <RouletteSelector roulettes={roulettes} selected={selectedRoulette} onSelect={onSelect} />

            {selectedRoulette && (
                <div style={{ maxWidth: '500px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{fields.length} campos configurados</span>
                        <button className="btn btn-sm" onClick={() => setShowAdd(true)}>+ Agregar campo</button>
                    </div>

                    {showAdd && (
                        <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>Key</label>
                                        <input className="input" placeholder="ej: company" value={newField.key} onChange={(e) => setNewField(p => ({ ...p, key: e.target.value.replace(/\s/g, '_').toLowerCase() }))} />
                                    </div>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>Label</label>
                                        <input className="input" placeholder="ej: Empresa" value={newField.label} onChange={(e) => setNewField(p => ({ ...p, label: e.target.value }))} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-end' }}>
                                    <div className="input-group" style={{ flex: 1 }}>
                                        <label>Tipo</label>
                                        <select className="input" value={newField.type} onChange={(e) => setNewField(p => ({ ...p, type: e.target.value }))}>
                                            {fieldTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <label className="checkbox-group" style={{ paddingBottom: '4px' }}>
                                        <input type="checkbox" checked={newField.required} onChange={(e) => setNewField(p => ({ ...p, required: e.target.checked }))} />
                                        Requerido
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-sm" onClick={() => setShowAdd(false)}>Cancelar</button>
                                    <button className="btn btn-primary btn-sm" onClick={addField}>Agregar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {fields.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                            <div className="icon">📋</div>
                            <h3>Sin campos</h3>
                            <p>Agrega al menos un campo para el formulario</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                            {fields.map((field, i) => (
                                <div key={field.key + i} className="card" style={{ padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <button className="btn btn-icon" style={{ width: 24, height: 20, fontSize: '0.6rem' }} onClick={() => moveField(i, -1)} disabled={i === 0}>▲</button>
                                            <button className="btn btn-icon" style={{ width: 24, height: 20, fontSize: '0.6rem' }} onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}>▼</button>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{field.label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {field.key} • {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                                                {field.required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>• Requerido</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                        <button className="btn btn-icon" onClick={() => toggleRequired(i)} title="Toggle requerido">
                                            {field.required ? '✓' : '○'}
                                        </button>
                                        <button className="btn btn-icon btn-danger" onClick={() => removeField(i)}>🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 'var(--space-lg)', width: '100%' }}>
                        {saving ? 'Guardando…' : '💾 Guardar Formulario'}
                    </button>
                </div>
            )}
        </div>
    );
}

// ============================
// TAB 5: RESULTADOS
// ============================
function ResultsTab({ roulettes, selectedRoulette, onSelect }) {
    const [results, setResults] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState({});

    const fetchResults = useCallback(async () => {
        if (!selectedRoulette) return;
        setLoading(true);
        try {
            const [resResults, resParticipants, resItems] = await Promise.all([
                fetch(`/api/results?roulette_id=${selectedRoulette.id}`),
                fetch(`/api/participants?roulette_id=${selectedRoulette.id}`),
                fetch(`/api/items?roulette_id=${selectedRoulette.id}`),
            ]);
            const resultsData = await resResults.json();
            const participantsData = await resParticipants.json();
            const itemsData = await resItems.json();
            setResults(Array.isArray(resultsData) ? resultsData : []);
            setParticipants(Array.isArray(participantsData) ? participantsData : []);
            setItems(Array.isArray(itemsData) ? itemsData : []);
        } finally {
            setLoading(false);
        }
    }, [selectedRoulette]);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    const isPhysical = selectedRoulette?.is_physical;

    // Participants without results (for physical roulettes)
    const unassigned = participants.filter(p => !results.some(r => r.participant_id === p.id));

    const assignPrize = async (participantId) => {
        const prizeLabel = assigning[participantId];
        if (!prizeLabel) { alert('Selecciona un premio'); return; }
        await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roulette_id: selectedRoulette.id,
                participant_id: participantId,
                item_won: prizeLabel,
            }),
        });
        setAssigning(prev => { const n = { ...prev }; delete n[participantId]; return n; });
        await fetchResults();
    };

    const exportCSV = () => {
        const rows = results.map(r => {
            const p = participants.find(pp => pp.id === r.participant_id);
            const pData = p?.data || {};
            return {
                Fecha: new Date(r.played_at).toLocaleString(),
                Premio: r.item_won,
                ...pData,
            };
        });

        if (rows.length === 0) return;

        const headers = Object.keys(rows[0]);
        const csv = [
            headers.join(','),
            ...rows.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resultados_${selectedRoulette.name}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>📊 Resultados</h2>
            <RouletteSelector roulettes={roulettes} selected={selectedRoulette} onSelect={onSelect} />

            {selectedRoulette && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{results.length} jugadas registradas</span>
                            {isPhysical && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>🎯 Física</span>}
                        </div>
                        <button className="btn btn-sm" onClick={exportCSV} disabled={results.length === 0}>📥 Exportar CSV</button>
                    </div>

                    {/* Manual assignment for physical roulettes */}
                    {isPhysical && unassigned.length > 0 && (
                        <div className="card" style={{ marginBottom: 'var(--space-lg)', borderColor: 'rgba(253, 203, 110, 0.4)', background: 'rgba(253, 203, 110, 0.05)' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fdcb6e', marginBottom: 'var(--space-md)' }}>
                                🎯 Asignar premios ({unassigned.length} pendiente{unassigned.length > 1 ? 's' : ''})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {unassigned.map(p => {
                                    const pData = p.data || {};
                                    return (
                                        <div key={p.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                                            padding: '8px 12px', borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                                            flexWrap: 'wrap',
                                        }}>
                                            <div style={{ flex: 1, minWidth: '120px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pData.name || pData.nombre || 'Anónimo'}</div>
                                                {pData.email && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pData.email}</div>}
                                            </div>
                                            <select className="input" style={{ flex: 1, minWidth: '120px', padding: '6px 8px', fontSize: '0.85rem' }}
                                                value={assigning[p.id] || ''} onChange={e => setAssigning(prev => ({ ...prev, [p.id]: e.target.value }))}>
                                                <option value="">Seleccionar premio...</option>
                                                {items.filter(i => i.is_active !== false).map(item => (
                                                    <option key={item.id} value={item.label}>{item.emoji || '🎁'} {item.label}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-sm btn-primary" onClick={() => assignPrize(p.id)} disabled={!assigning[p.id]} style={{ whiteSpace: 'nowrap' }}>
                                                ✓ Asignar
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}><div className="loading-spinner"></div></div>
                    ) : results.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📊</div>
                            <h3>Sin resultados</h3>
                            <p>{isPhysical ? 'Asigna premios a los participantes registrados arriba' : 'Los resultados aparecerán aquí cuando se jueguen rondas'}</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Participante</th>
                                        <th>Premio</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => {
                                        const p = participants.find(pp => pp.id === r.participant_id);
                                        const pData = p?.data || {};
                                        return (
                                            <tr key={r.id}>
                                                <td>{i + 1}</td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{pData.name || pData.nombre || 'Anónimo'}</div>
                                                    {pData.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pData.email}</div>}
                                                </td>
                                                <td><span className="badge badge-info">{r.item_won}</span></td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(r.played_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
