"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Check, ChevronRight, ChevronsUpDown, Loader2, Plus } from "lucide-react"
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
}

const sections = ["Dados gerais", "Unidade e codigo de barras", "Precos"]
const variationTypes = ["Produto simples", "Produto com variacao", "Kit de produtos"]

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
                  onChange={(event) => updateProduct("costValue", Number(event.target.value))}
                  className="h-11 rounded-sm bg-white"
                />
              </Field>
              <Field label="Markup de venda" required>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={product.saleMarkup}
                  onChange={(event) => updateProduct("saleMarkup", Number(event.target.value))}
                  className="h-11 rounded-sm bg-white"
                />
              </Field>
              <Field label="Preco de venda" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.salePrice}
                  onChange={(event) => updateProduct("salePrice", Number(event.target.value))}
                  className="h-11 rounded-sm bg-white"
                />
              </Field>
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
