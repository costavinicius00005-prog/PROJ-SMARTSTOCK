"use client"

import { FormEvent } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ProductRegistration } from "@/src/domain/catalog/product-registration"
import { useProductRegistration } from "@/src/presentation/hooks/use-product-registration"

const initialProduct: ProductRegistration = {
  name: "",
  category: "",
  brand: "",
  internalCode: "",
  variationType: "Produto simples",
  description: "",
  unitOfMeasure: "",
  costValue: 0,
  saleMarkup: 0,
  salePrice: 0,
  barcode: "",
}

const sections = ["Dados gerais", "Unidade e codigo de barras", "Precos"]
const categories = ["Materia-prima", "Mercadoria", "Produto acabado", "Servico"]
const brands = ["Sem marca", "Marca propria", "Fornecedor principal", "Importado"]
const units = ["UN", "CX", "KG", "L", "M", "PC"]
const variationTypes = ["Produto simples", "Produto com variacao", "Kit de produtos"]

export function ProductRegistrationContent() {
  const { product, status, updateProduct, resetProduct, submitProduct } =
    useProductRegistration(initialProduct)

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
            <h1 className="text-xl font-semibold text-foreground">Novo produto</h1>
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
            <Button
              type="button"
              className="h-11 rounded-sm bg-[#22b889] text-white hover:bg-[#1da77c]"
              onClick={handleSaveAndAddAnother}
              disabled={status === "saving"}
            >
              Salvar e adicionar outro
            </Button>
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
                  <OptionSelect
                    value={product.category}
                    placeholder="Selecione"
                    options={categories}
                    onValueChange={(value) => updateProduct("category", value)}
                  />
                </Field>
                <Field label="Marca">
                  <OptionSelect
                    value={product.brand}
                    placeholder="Selecione"
                    options={brands}
                    onValueChange={(value) => updateProduct("brand", value)}
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
                <OptionSelect
                  value={product.unitOfMeasure}
                  placeholder="Selecione"
                  options={units}
                  onValueChange={(value) => updateProduct("unitOfMeasure", value)}
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
