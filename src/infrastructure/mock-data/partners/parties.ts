import type { Party } from "@/src/domain/partners/party"

export const clients: Party[] = [
  { id: 1, name: "MEIRE SOARES MENDONCA MORAIS LTDA", cpfCnpj: "12.345.678/0001-90", phone: "(31) 9999-8888", email: "meire@empresa.com", city: "Belo Horizonte - MG", status: "Ativo" },
  { id: 2, name: "JOAO DA SILVA ME", cpfCnpj: "98.765.432/0001-10", phone: "(11) 9888-7777", email: "joao@silva.com", city: "Sao Paulo - SP", status: "Ativo" },
  { id: 3, name: "MARIA SANTOS COMERCIO LTDA", cpfCnpj: "11.222.333/0001-44", phone: "(21) 9777-6666", email: "maria@santos.com", city: "Rio de Janeiro - RJ", status: "Ativo" },
  { id: 4, name: "CARLOS FERREIRA E CIA", cpfCnpj: "44.555.666/0001-77", phone: "(31) 9666-5555", email: "carlos@ferreira.com", city: "Contagem - MG", status: "Inativo" },
  { id: 5, name: "SMARTSTOCK MATERIAIS ESPORTIVOS", cpfCnpj: "77.888.999/0001-11", phone: "(31) 9555-4444", email: "contato@smartstock.com", city: "Betim - MG", status: "Ativo" },
  { id: 6, name: "DISTRIBUIDORA NORTE SUL LTDA", cpfCnpj: "22.333.444/0001-55", phone: "(41) 9444-3333", email: "vendas@nortesul.com", city: "Curitiba - PR", status: "Ativo" },
]

export const suppliers: Party[] = [
  { id: 1, name: "MEIRE SOARES MENDONCA MORAIS LTDA", cpfCnpj: "12.345.678/0001-90", phone: "(31) 9999-8888", email: "meire@empresa.com", city: "Belo Horizonte - MG", status: "Ativo" },
  { id: 2, name: "DISTRIBUIDORA NORTE SUL LTDA", cpfCnpj: "22.333.444/0001-55", phone: "(41) 9444-3333", email: "vendas@nortesul.com", city: "Curitiba - PR", status: "Ativo" },
  { id: 3, name: "CALCADOS BRASIL LTDA", cpfCnpj: "33.444.555/0001-66", phone: "(11) 3333-2222", email: "contato@calcbrasil.com", city: "Franca - SP", status: "Ativo" },
  { id: 4, name: "ESPORTES & CIA IMPORTACAO", cpfCnpj: "55.666.777/0001-88", phone: "(21) 2222-1111", email: "import@esportescia.com", city: "Rio de Janeiro - RJ", status: "Inativo" },
]
