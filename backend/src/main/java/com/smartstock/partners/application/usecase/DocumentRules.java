package com.smartstock.partners.application.usecase;

import com.smartstock.partners.domain.BrazilianDocument;

/** Regras de documento comuns a clientes e fornecedores. */
final class DocumentRules {

  private DocumentRules() {
  }

  /** Valida CPF/CNPJ informados. Na edicao, um documento inalterado (cadastro antigo) nao e revalidado. */
  static void validate(String cpf, String cnpj, String previousCpf, String previousCnpj) {
    if (cpf != null && !cpf.equals(previousCpf) && !BrazilianDocument.isValidCpf(cpf)) {
      throw new IllegalArgumentException("CPF invalido: verifique os digitos informados.");
    }
    if (cnpj != null && !cnpj.equals(previousCnpj) && !BrazilianDocument.isValidCnpj(cnpj)) {
      throw new IllegalArgumentException("CNPJ invalido: verifique os digitos informados.");
    }
  }
}
