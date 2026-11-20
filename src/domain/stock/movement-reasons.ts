/** Motivos de movimentacao de estoque (codigos gravados no banco -> rotulos exibidos). */
export const MOVEMENT_REASON_LABELS: Record<string, string> = {
  VENDA: "Venda",
  FATURAMENTO_PEDIDO: "Faturamento de pedido",
  CANCELAMENTO_VENDA: "Cancelamento de venda",
  COMPRA: "Compra de mercadorias",
  ENTRADA_MANUAL: "Entrada manual",
  SAIDA_MANUAL: "Saída manual",
  AJUSTE: "Ajuste de estoque",
  DEVOLUCAO: "Devolução",
  PERDA: "Perda / avaria",
  ESTOQUE_INICIAL: "Estoque inicial",
}

/** Motivos que podem ser escolhidos num lancamento manual, por tipo (o primeiro e o padrao). */
export const MANUAL_REASONS: Record<"ENTRADA" | "SAIDA" | "AJUSTE", string[]> = {
  ENTRADA: ["ENTRADA_MANUAL", "COMPRA", "DEVOLUCAO"],
  SAIDA: ["SAIDA_MANUAL", "PERDA"],
  AJUSTE: ["AJUSTE"],
}

export const reasonLabel = (code: string | null | undefined) => (code ? MOVEMENT_REASON_LABELS[code] ?? code : "-")
