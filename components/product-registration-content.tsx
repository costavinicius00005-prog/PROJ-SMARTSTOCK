"use client"

import { FocusEvent, FormEvent, useState } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Check, ChevronRight, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { CatalogOption } from "@/src/domain/catalog/catalog-option"
import type { ProductRegistration } from "@/src/domain/catalog/product-registration"
import { useProductRegistration } from "@/src/presentation/hooks/use-product-registration"

const initialProduct: ProductRegistration = {
  name: "",
  categoryId: "",
  brandId: "",
  internalCode: "",
  variationType: "Produto simples",
  description: "",
  unitOfMeasureId: "",
  costValue: 0,
  saleMarkup: 0,
  salePrice: 0,
  barcode: "",
  composition: [],
}

const sections = ["Dados gerais", "Unidade e codigo de barras", "Precos", "Composicao"]
const variationTypes = ["Produto simples", "Produto com variacao", "Kit de produtos"]
const numberInputClassName =
  "h-11 rounded-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

function selectZeroValue(event: FocusEvent<HTMLInputElement>) {
  if (event.currentTarget.value === "0") {
    event.currentTarget.select()
  }
}

function parsePricingInput(value: string) {
  return value === "" ? "" : Number(value)
}

export function ProductRegistrationContent({
  initialValue = initialProduct,
  productId,
  title = "Novo produto",
}: {
  initialValue?: ProductRegistration
  productId?: string
  title?: string
}) {
  const {
    product,
    status,
    optionsStatus,
    categories,
    brands,
    unitsOfMeasure,
    availableProducts,
    updateProduct,
    createAndSelectOption,
    resetProduct,
    submitProduct,
  } = useProductRegistration(initialValue, productId)

  const isEditing = Boolean(productId)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submitProduct()
  }

  const handleSaveAndAddAnother = async () => {
    const saved = await submitProduct()

    if (saved) {
      resetProduct()
    }
  }

  return (
    <div className="min-h-full bg-[#eef1f6] p-4 md:p-6">
      <div className="mx-auto grid max-w-[1580px] gap-5 lg:grid-cols-[312px_1fr]">
        <aside className="self-start rounded-md border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>

          <nav className="px-3 py-3">
            {sections.map((section, index) => (
              <a
                key={section}
                href={`#${section.toLowerCase().replaceAll(" ", "-")}`}
                className={[
                  "flex h-11 items-center justify-between px-3 text-sm font-medium transition-colors",
                  index === 0
                    ? "bg-[#a9c8f7] text-[#17324d]"
                    : "text-[#17324d] hover:bg-muted",
                ].join(" ")}
              >
                <span>{section}</span>
                {index === 0 ? <ChevronRight className="size-5" /> : null}
              </a>
            ))}
          </nav>

          <div className="grid gap-3 px-3 pb-4">
            {!isEditing ? (
              <Button
                type="button"
                className="h-11 rounded-sm bg-[#22b889] text-white hover:bg-[#1da77c]"
                onClick={handleSaveAndAddAnother}
                disabled={status === "saving"}
              >
                Salvar e adicionar outro
              </Button>
            ) : null}
            <Button
              type="submit"
              form="product-registration-form"
              className="h-11 rounded-sm bg-[#22b889] text-white hover:bg-[#1da77c]"
              disabled={status === "saving"}
            >
              {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : "Salvar produto"}
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-sm">
              <Link href="/cadastros/produtos">Voltar para a lista</Link>
            </Button>
          </div>
        </aside>

        <form id="product-registration-form" onSubmit={handleSubmit} className="grid gap-6">
          <Card id="dados-gerais" className="rounded-md border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-[#17324d]">Dados gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Field label="Nome do produto" required>
                <Input
                  value={product.name}
                  onChange={(event) => updateProduct("name", event.target.value)}
                  required
                  className="h-11 rounded-sm bg-white"
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Categoria" required>
                  <CreatableCombobox
                    value={product.categoryId}
                    placeholder="Selecione ou crie"
                    options={categories}
                    disabled={optionsStatus === "loading"}
                    onValueChange={(value) => updateProduct("categoryId", value)}
                    onCreate={(value) => createAndSelectOption("categories", value)}
                  />
                </Field>
                <Field label="Marca">
                  <CreatableCombobox
                    value={product.brandId}
                    placeholder="Selecione ou crie"
                    options={brands}
                    disabled={optionsStatus === "loading"}
                    onValueChange={(value) => updateProduct("brandId", value)}
                    onCreate={(value) => createAndSelectOption("brands", value)}
                  />
                </Field>
                <Field label="Codigo interno" required>
                  <Input
                    value={product.internalCode}
                    onChange={(event) => updateProduct("internalCode", event.target.value)}
                    required
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Tipo de variacao">
                  <OptionSelect
                    value={product.variationType}
                    placeholder="Selecione"
                    options={variationTypes}
                    onValueChange={(value) => updateProduct("variationType", value)}
                  />
                </Field>
                <div />
              </div>

              <Field label="Descricao">
                <Textarea
                  value={product.description}
                  onChange={(event) => updateProduct("description", event.target.value)}
                  className="min-h-24 rounded-sm bg-white"
                />
              </Field>
            </CardContent>
          </Card>

          <Card id="unidade-e-codigo-de-barras" className="rounded-md border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-[#17324d]">
                Unidade e codigo de barras
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Field label="Unidade de medida" required>
                <CreatableCombobox
                  value={product.unitOfMeasureId}
                  placeholder="Selecione ou crie"
                  options={unitsOfMeasure}
                  disabled={optionsStatus === "loading"}
                  onValueChange={(value) => updateProduct("unitOfMeasureId", value)}
                  onCreate={(value) => createAndSelectOption("units-of-measure", value)}
                />
              </Field>
              <Field label="Codigo de barras">
                <Input
                  value={product.barcode}
                  onChange={(event) => updateProduct("barcode", event.target.value)}
                  className="h-11 rounded-sm bg-white"
                />
              </Field>
            </CardContent>
          </Card>

          <Card id="precos" className="rounded-md border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-[#17324d]">Precos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <Field label="Valor de custo" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.costValue}
                  onFocus={selectZeroValue}
                  onChange={(event) => updateProduct("costValue", parsePricingInput(event.target.value))}
                  className={numberInputClassName}
                />
              </Field>
              <Field label="Markup de venda (%)" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.saleMarkup}
                  onFocus={selectZeroValue}
                  onChange={(event) => updateProduct("saleMarkup", parsePricingInput(event.target.value))}
                  className={numberInputClassName}
                />
              </Field>
              <Field label="Preco de venda" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.salePrice}
                  onFocus={selectZeroValue}
                  onChange={(event) => updateProduct("salePrice", parsePricingInput(event.target.value))}
                  className={numberInputClassName}
                />
              </Field>
            </CardContent>
          </Card>

          <Card id="composicao" className="rounded-md border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-[#17324d]">Composicao</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Alert>
                <AlertDescription>
                  Produtos sem componentes controlam o proprio estoque. Alteracoes nesta composicao
                  valem apenas para operacoes futuras e nao modificam historicos existentes.
                </AlertDescription>
              </Alert>
              <CompositionEditor
                value={product.composition}
                products={availableProducts.filter((candidate) => candidate.id !== productId)}
                onChange={(composition) => updateProduct("composition", composition)}
              />
              {product.composition.length > 0 ? (
                <div className="rounded-sm bg-primary/5 px-3 py-2 text-sm text-[#17324d]">
                  Custo estimado pelos componentes: <strong>{formatCurrency(product.composition.reduce((total, item) => {
                    const component = availableProducts.find((candidate) => candidate.id === item.productId)
                    return total + (component?.estimatedCompositionCost ?? component?.costValue ?? 0) * item.quantity
                  }, 0))}</strong>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {status === "saved" ? (
            <p className="rounded-sm border border-[#22b889]/40 bg-[#22b889]/10 px-3 py-2 text-sm font-medium text-[#137557]">
              Produto salvo com sucesso.
            </p>
          ) : null}
          {status === "error" ? (
            <p className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              Nao foi possivel salvar o produto.
            </p>
          ) : null}
          {optionsStatus === "error" ? (
            <p className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              Nao foi possivel carregar categorias, marcas e unidades.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  )
}

function CompositionEditor({ value, products, onChange }: {
  value: ProductRegistration["composition"]
  products: import("@/src/domain/catalog/registered-product").RegisteredProduct[]
  onChange: (value: ProductRegistration["composition"]) => void
}) {
  const [selected, setSelected] = useState("")
  const candidates = products.filter((product) => !value.some((item) => item.productId === product.id))
  const add = () => {
    if (!selected) return
    onChange([...value, { productId: selected, quantity: 1 }])
    setSelected("")
  }
  return <div className="grid gap-3">
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="h-11 flex-1 rounded-sm bg-white"><SelectValue placeholder="Pesquisar produto por codigo ou descricao" /></SelectTrigger>
        <SelectContent>{candidates.map((item) => <SelectItem key={item.id} value={item.id}>{item.internalCode} - {item.name}</SelectItem>)}</SelectContent>
      </Select>
      <Button type="button" variant="outline" className="h-11 rounded-sm" onClick={add} disabled={!selected}><Plus className="size-4" /> Adicionar componente</Button>
    </div>
    {value.length === 0 ? <p className="rounded-sm border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum componente adicionado. Este produto sera tratado como simples.</p> : null}
    {value.map((item) => {
      const component = products.find((product) => product.id === item.productId)
      return <div key={item.productId} className="grid items-end gap-3 rounded-sm border p-3 md:grid-cols-[1fr_150px_100px_120px_40px]">
        <div><p className="text-xs text-muted-foreground">Codigo / componente</p><p className="text-sm font-medium">{component?.internalCode ?? "-"} - {component?.name ?? "Produto"}</p></div>
        <Field label="Quantidade" required><Input type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => onChange(value.map((current) => current.productId === item.productId ? {...current, quantity: Number(event.target.value)} : current))} className="h-10 rounded-sm bg-white" /></Field>
        <div><p className="text-xs text-muted-foreground">Unidade</p><p className="h-10 py-2 text-sm">{component?.unitOfMeasure ?? "-"}</p></div>
        <div><p className="text-xs text-muted-foreground">Disponivel / permite</p><p className="h-10 py-2 text-sm">{component?.stockAvailable ?? 0} / {Math.floor((component?.stockAvailable ?? 0) / item.quantity)}</p></div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((current) => current.productId !== item.productId))}><Trash2 className="size-4 text-destructive" /></Button>
      </div>
    })}
  </div>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#17324d]">
      <span>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function CreatableCombobox({
  value,
  placeholder,
  options,
  disabled,
  onValueChange,
  onCreate,
}: {
  value: string
  placeholder: string
  options: CatalogOption[]
  disabled?: boolean
  onValueChange: (value: string) => void
  onCreate: (value: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const selectedOption = options.find((option) => option.id === value)
  const cleanSearch = search.trim()
  const canCreate =
    cleanSearch.length > 0 &&
    !options.some((option) =>
      [option.label, option.value, option.name, option.acronym ?? ""]
        .filter(Boolean)
        .some((optionValue) => normalizeOptionText(optionValue) === normalizeOptionText(cleanSearch)),
    )

  const handleCreate = async () => {
    if (!canCreate) return

    setCreating(true)

    try {
      await onCreate(cleanSearch)
      setSearch("")
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 w-full justify-between rounded-sm bg-white px-3 font-normal"
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Pesquisar ou digitar novo valor"
          />
          <CommandList>
            <CommandGroup>
              {options
                .filter((option) => {
                  if (!cleanSearch) return true

                  return [option.label, option.value, option.name, option.acronym ?? ""]
                    .filter(Boolean)
                    .some((optionValue) =>
                      normalizeOptionText(optionValue).includes(normalizeOptionText(cleanSearch)),
                    )
                })
                .map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => {
                      onValueChange(option.id)
                      setSearch("")
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("size-4", option.id === value ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              {canCreate ? (
                <CommandItem value={`create-${cleanSearch}`} onSelect={handleCreate}>
                  {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  <span className="truncate">Criar "{cleanSearch}"</span>
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function OptionSelect({
  value,
  placeholder,
  options,
  onValueChange,
}: {
  value: string
  placeholder: string
  options: string[]
  onValueChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-11 w-full rounded-sm bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function normalizeOptionText(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
}
