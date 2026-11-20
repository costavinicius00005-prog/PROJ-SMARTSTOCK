/**
 * Repassa a identidade do usuario logado das rotas /api (Next) para o backend.
 * Usa o cabecalho Authorization, se houver, ou o cookie de sessao "smartstock_token".
 * O backend usa isso para registrar o operador em vendas e movimentacoes de estoque.
 */
export function authHeader(request: Request): Record<string, string> {
  const authorization = request.headers.get("authorization")
  if (authorization) return { Authorization: authorization }

  const cookie = request.headers.get("cookie") ?? ""
  const match = cookie.match(/(?:^|;\s*)smartstock_token=([^;]+)/)
  return match ? { Authorization: `Bearer ${decodeURIComponent(match[1])}` } : {}
}
