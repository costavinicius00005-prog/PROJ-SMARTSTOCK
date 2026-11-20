"use client"

import type { SaleReceipt } from "@/src/domain/sales/checkout"

export type StoreSettings = Record<string, string>

const money = (value: number) =>
  Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const quantity = (value: number) =>
  Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 4 })
const dateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })

function formatDocument(value: string | null | undefined) {
  if (!value) return null
  const digits = value.replace(/\D/g, "")
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
  return value
}

function formatZip(value: string | undefined) {
  const digits = (value ?? "").replace(/\D/g, "")
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : value
}

/**
 * Comprovante de venda no estilo cupom (largura de bobina 80mm). Mostra os valores exatamente
 * como gravados na venda. NAO e documento fiscal (NFC-e) — isso e informado no rodape.
 */
export function SaleReceiptView({ sale, store }: { sale: SaleReceipt; store: StoreSettings }) {
  const legalName = store["company.legalName"]
  const tradeName = store["company.tradeName"]
  const cnpj = formatDocument(store["company.cnpj"])
  const street = [store["company.address"], store["company.addressNumber"]].filter(Boolean).join(", ")
  const cityLine = [store["company.district"], [store["company.city"], store["company.state"]].filter(Boolean).join("/")]
    .filter(Boolean)
    .join(" - ")
  const zip = formatZip(store["company.zipCode"])
  const discounts = Number(sale.itemDiscount) + Number(sale.generalDiscount)
  const cancelled = sale.status === "CANCELLED"

  return (
    <div className="receipt mx-auto w-full max-w-[80mm] bg-white px-3 py-4 font-mono text-[11px] leading-tight text-black">
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase">{tradeName || legalName || "Loja"}</p>
        {legalName && legalName !== tradeName ? <p>{legalName}</p> : null}
        {cnpj ? <p>CNPJ: {cnpj}</p> : null}
        {store["company.stateRegistration"] ? <p>IE: {store["company.stateRegistration"]}</p> : null}
        {street ? <p>{street}</p> : null}
        {cityLine ? <p>{cityLine}</p> : null}
        {zip ? <p>CEP: {zip}</p> : null}
        {store["company.phone"] ? <p>Tel: {store["company.phone"]}</p> : null}
        {store["company.email"] ? <p>{store["company.email"]}</p> : null}
      </div>

      <Divider />
      <p className="text-center font-bold">COMPROVANTE DE VENDA</p>
      <p className="text-center">Documento sem valor fiscal</p>
      {cancelled ? <p className="mt-1 border border-black py-0.5 text-center font-bold">*** VENDA CANCELADA ***</p> : null}
      <Divider />

      <Row label={`Venda nº ${sale.number}`} value={dateTime(sale.createdAt)} />
      {sale.salesOrderNumber ? <p>Ref. pedido nº {sale.salesOrderNumber}</p> : null}
      <p>Operador: {sale.operator}</p>
      <p>
        Cliente: {sale.clientName || "Consumidor nao identificado"}
        {sale.clientDocument ? ` - ${formatDocument(sale.clientDocument)}` : ""}
      </p>

      <Divider />
      <div className="flex justify-between font-bold">
        <span>ITEM / DESCRICAO</span>
        <span>TOTAL</span>
      </div>
      <Divider dashed />
      {sale.items.map((item, index) => (
        <div key={item.id} className="mb-1">
          <p>
            {String(index + 1).padStart(3, "0")} {item.productCode ? `${item.productCode} ` : ""}
            {item.productName}
          </p>
          <div className="flex justify-between pl-4">
            <span>
              {quantity(item.quantity)} {item.unitOfMeasure?.split(" ")[0]} x {money(item.unitPrice)}
            </span>
            <span>{money(item.grossSubtotal)}</span>
          </div>
          {Number(item.discount) > 0 ? (
            <div className="flex justify-between pl-4">
              <span>Desconto item</span>
              <span>-{money(item.discount)}</span>
            </div>
          ) : null}
        </div>
      ))}

      <Divider />
      <Row label={`Qtd. itens: ${sale.items.length}`} value="" />
      <Row label="Subtotal" value={money(sale.subtotal)} />
      {discounts > 0 ? <Row label="Descontos" value={`-${money(discounts)}`} /> : null}
      {Number(sale.freight) > 0 ? <Row label="Acrescimos (frete)" value={money(sale.freight)} /> : null}
      <div className="mt-1 flex justify-between text-[14px] font-bold">
        <span>TOTAL</span>
        <span>{money(sale.total)}</span>
      </div>

      <Divider />
      <p className="font-bold">FORMA(S) DE PAGAMENTO</p>
      {sale.payments.map((payment, index) => (
        <div key={`${payment.methodCode}-${index}`}>
          <Row label={payment.methodName} value={money(payment.receivedAmount)} />
          {Number(payment.changeAmount) > 0 ? (
            <p className="pl-4 text-[10px]">(aplicado {money(payment.amount)} + troco {money(payment.changeAmount)})</p>
          ) : null}
        </div>
      ))}
      <Divider dashed />
      <Row label="Valor recebido" value={money(sale.totalReceived)} />
      <Row label="Troco" value={money(sale.totalChange)} />

      {cancelled ? (
        <>
          <Divider />
          <p>Cancelada em {sale.cancelledAt ? dateTime(sale.cancelledAt) : "-"}</p>
          {sale.cancelledBy ? <p>Por: {sale.cancelledBy}</p> : null}
          {sale.cancelReason ? <p>Motivo: {sale.cancelReason}</p> : null}
        </>
      ) : null}

      <Divider />
      <p className="text-center">Obrigado pela preferencia!</p>
      <p className="mt-1 text-center text-[9px]">
        Este comprovante nao e documento fiscal (NFC-e/NF-e) e nao substitui a nota fiscal.
      </p>
      <p className="text-center text-[9px]">ID {sale.id}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  )
}

function Divider({ dashed = false }: { dashed?: boolean }) {
  return <div className={`my-1.5 border-t border-black ${dashed ? "border-dashed" : ""}`} />
}
