// Istalgan bo'lim uchun umumiy sahifa: jadval, qidiruv, filtrlar, sahifalash va forma.
// Qaysi maydon qanday ko'rinishi server/resources.js dan keladi.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api, dateTime, money, queryString } from './api.js';
import { Alert, Badge, Button, Field, inputClass, Modal, PageTitle } from './ui.jsx';

const PAGE_SIZES = [10, 20, 50, 100];
const MONEY_FIELDS = new Set(['price', 'total']);
const compactInput = inputClass.replace('w-full ', ''); // filtrlar yonma-yon tursin

function useRefOptions(fields) {
  const [options, setOptions] = useState({});
  useEffect(() => {
    for (const f of fields.filter((x) => x.type === 'ref')) {
      api(`/r/${f.ref}?pageSize=100`)
        .then((r) => setOptions((o) => ({ ...o, [f.name]: r.items.map((i) => ({ value: i.id, label: i[f.refLabel] })) })))
        .catch(() => {});
    }
  }, [fields]);
  return options;
}

function Cell({ field, row, refOptions }) {
  const v = row[field.name];
  if (field.type === 'bool') return <Badge on={v}>{v ? 'Ha' : 'Yoʻq'}</Badge>;
  if (field.type === 'datetime') return dateTime(v);
  if (field.type === 'select') {
    const label = field.options.find((o) => o.value === v)?.label ?? v;
    return field.name === 'status' ? <Badge on={v === 'new'}>{label}</Badge> : label || '—';
  }
  if (field.type === 'ref') return refOptions[field.name]?.find((o) => o.value === v)?.label ?? v;
  if (MONEY_FIELDS.has(field.name)) return money(v);
  return v === '' || v === null || v === undefined ? '—' : String(v);
}

function Filters({ resource, values, onChange, refOptions }) {
  const set = (k, v) => onChange({ ...values, [k]: v });
  const fields = resource.fields.filter((f) => f.filter);
  if (!fields.length) return null;
  return fields.map((f) => {
    if (f.type === 'int' || f.type === 'number') {
      return (
        <div key={f.name} className="flex items-center gap-1">
          <input className={`${compactInput} w-28`} inputMode="numeric" placeholder={`${f.label} dan`} aria-label={`${f.label} dan`} value={values[`${f.name}_min`] ?? ''} onChange={(e) => set(`${f.name}_min`, e.target.value)} />
          <input className={`${compactInput} w-28`} inputMode="numeric" placeholder="gacha" aria-label={`${f.label} gacha`} value={values[`${f.name}_max`] ?? ''} onChange={(e) => set(`${f.name}_max`, e.target.value)} />
        </div>
      );
    }
    if (f.type === 'datetime') {
      return (
        <div key={f.name} className="flex items-center gap-1">
          <input type="date" className={`${compactInput} w-40`} aria-label={`${f.label} dan`} value={values[`${f.name}_from`] ?? ''} onChange={(e) => set(`${f.name}_from`, e.target.value)} />
          <input type="date" className={`${compactInput} w-40`} aria-label={`${f.label} gacha`} value={values[`${f.name}_to`] ?? ''} onChange={(e) => set(`${f.name}_to`, e.target.value)} />
        </div>
      );
    }
    const options = f.type === 'bool'
      ? [{ value: 'true', label: 'Ha' }, { value: 'false', label: 'Yoʻq' }]
      : f.type === 'ref' ? refOptions[f.name] ?? [] : f.options;
    if (!options) {
      return <input key={f.name} className={`${compactInput} w-40`} placeholder={f.label} value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} />;
    }
    return (
      <select key={f.name} className={`${compactInput} w-44`} aria-label={f.label} value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
        <option value="">{f.label}: barchasi</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  });
}

function FormField({ field, value, onChange, refOptions }) {
  const disabled = field.readOnly;
  if (field.type === 'bool') {
    return (
      <label className="flex items-center gap-2 text-sm font-medium text-on-surface">
        <input type="checkbox" className="h-4 w-4" disabled={disabled} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  const label = field.label + (field.required ? ' *' : '');
  if (field.type === 'json') {
    return <Field label={label}><pre className="max-h-64 overflow-auto rounded-lg bg-surface-container-low p-3 text-xs">{value ? JSON.stringify(value, null, 2) : '—'}</pre></Field>;
  }
  if (field.type === 'datetime') return <Field label={label}><input className={inputClass} disabled value={dateTime(value)} /></Field>;
  if (field.type === 'textarea') {
    return <Field label={label}><textarea rows={4} className={inputClass} disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
  }
  if (field.type === 'select' || field.type === 'ref') {
    const options = field.type === 'ref' ? refOptions[field.name] ?? [] : field.options;
    return (
      <Field label={label}>
        <select className={inputClass} disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {field.type === 'ref' && <option value="">Tanlang</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
    );
  }
  if (field.type === 'tags') {
    return <Field label={label} hint="Vergul bilan ajrating"><input className={inputClass} value={Array.isArray(value) ? value.join(', ') : value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
  }
  const numeric = field.type === 'int' || field.type === 'number';
  return <Field label={label}><input className={inputClass} inputMode={numeric ? 'decimal' : undefined} disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Field>;
}

function EditForm({ resource, row, refOptions, onClose, onSaved }) {
  const isNew = !row.id;
  const editable = resource.fields.filter((f) => !f.readOnly);
  const [values, setValues] = useState(() => {
    if (!isNew) return row;
    return Object.fromEntries(editable.map((f) => [f.name, f.default ?? (f.type === 'select' ? f.options[0].value : '')]));
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const shown = isNew ? editable : resource.fields;

  const canEdit = resource.ops.includes(isNew ? 'create' : 'update');
  const canDelete = !isNew && resource.ops.includes('delete');

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = Object.fromEntries(editable.map((f) => [f.name, values[f.name]]));
      if (isNew) await api(`/r/${resource.name}`, { method: 'POST', body });
      else await api(`/r/${resource.name}/${encodeURIComponent(row.id)}`, { method: 'PUT', body });
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const del = async () => {
    if (!window.confirm('Bu yozuv butunlay oʻchirilsinmi?')) return;
    setBusy(true);
    setError('');
    try {
      await api(`/r/${resource.name}/${encodeURIComponent(row.id)}`, { method: 'DELETE' });
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'Yangi yozuv' : canEdit ? 'Tahrirlash' : 'Koʻrish'}
      onClose={onClose}
      footer={
        <>
          <div>{canDelete && <Button variant="danger" disabled={busy} onClick={del}><Icon name="delete" size={18} />Oʻchirish</Button>}</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Yopish</Button>
            {canEdit && <Button disabled={busy} onClick={save}>Saqlash</Button>}
          </div>
        </>
      }
    >
      <Alert>{error}</Alert>
      {!isNew && <p className="text-xs text-on-surface-variant">ID: {row.id}</p>}
      {shown.map((f) => (
        <FormField key={f.name} field={f} value={values[f.name]} refOptions={refOptions} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
      ))}
    </Modal>
  );
}

function Pagination({ data, onPage, pageSize, onPageSize }) {
  const { page, pages, total } = data;
  const from = total ? (page - 1) * data.pageSize + 1 : 0;
  const to = Math.min(page * data.pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-3 text-sm text-on-surface-variant">
      <span>{from}–{to} / {total} ta</span>
      <div className="flex items-center gap-2">
        <select className={`${compactInput} w-20`} aria-label="Sahifadagi yozuvlar soni" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <Button variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Oldingi sahifa"><Icon name="chevron_left" size={18} /></Button>
        <span>{page} / {pages}</span>
        <Button variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Keyingi sahifa"><Icon name="chevron_right" size={18} /></Button>
      </div>
    </div>
  );
}

export default function ResourcePage({ resource }) {
  const columns = useMemo(() => resource.fields.filter((f) => f.list), [resource]);
  const refOptions = useRefOptions(resource.fields);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ by: resource.sort, dir: resource.dir });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await api(`/r/${resource.name}${queryString({ q, sort: sort.by, dir: sort.dir, page, pageSize, ...filters })}`));
    } catch (e) {
      setError(e.message);
    }
  }, [resource.name, q, sort, page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSort = (name) => setSort((s) => (s.by === name ? { by: name, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { by: name, dir: 'asc' }));

  const openRow = async (row) => {
    try {
      setEditing(await api(`/r/${resource.name}/${encodeURIComponent(row.id)}`));
    } catch (e) {
      setError(e.message);
    }
  };

  const hasFilters = q || Object.values(filters).some((v) => v !== '' && v !== undefined);

  return (
    <>
      <PageTitle title={resource.label} subtitle={data ? `Jami: ${data.total} ta` : ' '}>
        {resource.ops.includes('create') && <Button onClick={() => setEditing({})}><Icon name="add" size={18} />Qoʻshish</Button>}
      </PageTitle>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Icon name="search" size={18} className="absolute left-2.5 top-2.5 text-on-surface-variant" />
          <input className={`${inputClass} pl-9`} placeholder="Qidirish..." aria-label="Qidirish" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Filters resource={resource} values={filters} refOptions={refOptions} onChange={(f) => { setFilters(f); setPage(1); }} />
        {hasFilters && <Button variant="ghost" onClick={() => { setSearch(''); setFilters({}); setPage(1); }}>Tozalash</Button>}
      </div>

      <Alert>{error}</Alert>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                {columns.map((c) => (
                  <th key={c.name} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold" aria-sort={sort.by === c.name ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    <button type="button" className="inline-flex items-center gap-1 uppercase" onClick={() => toggleSort(c.name)}>
                      {c.label.replace(' (oʻzbekcha)', '')}
                      {sort.by === c.name && <Icon name={sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={14} />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.items.map((row) => (
                <tr key={row.id} className="cursor-pointer border-t border-outline-variant/50 hover:bg-surface-container-low" onClick={() => openRow(row)}>
                  {columns.map((c) => (
                    <td key={c.name} className="max-w-xs truncate px-4 py-2.5 text-on-surface"><Cell field={c} row={row} refOptions={refOptions} /></td>
                  ))}
                </tr>
              ))}
              {data && !data.items.length && (
                <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-on-surface-variant">Hech narsa topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data && <Pagination data={data} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
      </div>

      {editing && (
        <EditForm
          resource={resource}
          row={editing}
          refOptions={refOptions}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
}
