import { useMemo, useState } from 'react'
import SearchInput from '../components/ui/SearchInput.jsx'
import SectionCard from '../components/ui/SectionCard.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { formatDate } from '../domain/lifecycle/dates.js'
import { formatMoney } from '../domain/quotation/index.js'
import { SIAME_CATALOGUE_META, SIAME_SECTIONS, siameRowLabel } from '../domain/bom/siameCatalogue.js'

// Catalogue de référence : consultation du tarif fournisseur SIAME 2023 (disjoncteurs, différentiels,
// interrupteurs-sectionneurs) qui alimente la sélection automatique du matériel dans la nomenclature.
function Standards() {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()

  const sections = useMemo(() => {
    if (!query) return SIAME_SECTIONS
    return SIAME_SECTIONS.map((section) => ({
      ...section,
      families: section.families
        .map((fam) => ({
          ...fam,
          rows: fam.title.toLowerCase().includes(query) ? fam.rows : fam.rows.filter((row) => siameRowLabel(fam, row).toLowerCase().includes(query)),
        }))
        .filter((fam) => fam.rows.length > 0),
    })).filter((section) => section.families.length > 0)
  }, [query])

  const totalRows = useMemo(() => SIAME_SECTIONS.reduce((sum, section) => sum + section.families.reduce((s, fam) => s + fam.rows.length, 0), 0), [])
  const shownRows = useMemo(() => sections.reduce((sum, section) => sum + section.families.reduce((s, fam) => s + fam.rows.length, 0), 0), [sections])

  return (
    <div className="flex w-full flex-col gap-space-lg pb-8">
      <div>
        <div className="flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          Standards & Normes
        </div>
        <h1 className="mt-space-2xs font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
          Catalogue tarifaire {SIAME_CATALOGUE_META.supplier}
        </h1>
        <p className="mt-space-2xs max-w-3xl font-body-md text-body-md text-on-surface-variant">{SIAME_CATALOGUE_META.note}</p>
        <div className="mt-space-sm flex flex-wrap items-center gap-space-sm">
          <StatusPill tone="info" icon="event">Date d'effet : {formatDate(SIAME_CATALOGUE_META.effectiveDate)}</StatusPill>
          <StatusPill tone="neutral" icon="payments">Devise : {SIAME_CATALOGUE_META.currency}</StatusPill>
          <StatusPill tone="neutral" icon="list_alt">
            {shownRows} / {totalRows} références
          </StatusPill>
        </div>
      </div>

      <SearchInput
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher une désignation, un calibre (ex. 63A), une famille (EP60, Hti, sectionneur)..."
        value={search}
      />

      {sections.length === 0 && (
        <p className="rounded-xl bg-surface-container-lowest p-space-lg font-body-sm text-on-surface-variant shadow-sm">
          Aucune référence ne correspond à « {search} ».
        </p>
      )}

      {sections.map((section) => (
        <div className="flex flex-col gap-space-md" key={section.id}>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{section.title}</h2>
          {section.families.map((fam) => (
            <SectionCard
              badge={fam.icuKa ? <StatusPill tone="ok">Icu {fam.icuKa} kA</StatusPill> : null}
              icon="bolt"
              key={fam.id}
              subtitle={fam.standard ?? undefined}
              title={fam.title}>
              <div className="overflow-x-auto rounded-lg border border-surface-container-low">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                      <th className="px-space-md py-space-sm font-semibold">Désignation</th>
                      {fam.columns.map((col) => (
                        <th className="px-space-md py-space-sm text-right font-semibold" key={col}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {fam.rows.map((row, index) => (
                      <tr className="font-body-sm text-body-sm text-on-surface" key={`${fam.id}-${index}`}>
                        <td className="px-space-md py-space-sm font-medium">{siameRowLabel(fam, row)}</td>
                        <td className="px-space-md py-space-sm text-right font-tech-data-md text-tech-data-md">{formatMoney(row.priceC)}</td>
                        {fam.columns.length > 1 && (
                          <td className="px-space-md py-space-sm text-right font-tech-data-md text-tech-data-md">
                            {row.priceAlt !== null && row.priceAlt !== undefined ? formatMoney(row.priceAlt) : '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          ))}
        </div>
      ))}
    </div>
  )
}

export default Standards
