# Plano de resposta a incidentes de segurança

Base: LGPD art. 48 e Resolução CD/ANPD nº 15/2024 (comunicação em até **3 dias úteis** do conhecimento, quando houver risco ou dano relevante aos titulares).

## Papéis
- **Responsável técnico:** contém o incidente e preserva as evidências.
- **Encarregado (DPO):** avalia o risco e comunica a ANPD e os titulares.
- **Direção da empresa:** aprova a comunicação e as medidas.

## 1. Detectar
Sinais no SmartStock (Administração > Segurança e LGPD):
- muitos `Login recusado` ou `Login bloqueado`, ainda mais de IPs desconhecidos;
- `Acesso negado` repetido para o mesmo usuário;
- `Exportação (titular)`, `Relatório/exportação` ou `Leitura de dados pessoais` em volume fora do normal ou fora do horário;
- sessões ativas de IP ou navegador desconhecidos;
- no log da API, o aviso de senha padrão do administrador.

## 2. Conter (primeiras horas)
1. Encerrar as sessões suspeitas (Segurança e LGPD > Encerrar) ou todas as de um usuário (Usuários > Encerrar sessões).
2. Desativar o usuário comprometido e redefinir a senha.
3. Se o token puder ter vazado em massa, trocar o `AUTH_SECRET` no `.env` e reiniciar a API. Isso invalida **todos** os tokens.
4. Derrubar o túnel público (ngrok ou cloudflared) se a origem for externa.
5. Preservar evidências: exportar a trilha (`GET /api/security/audit?limit=1000`) e os logs dos containers (`docker logs meu-sistema-api > incidente.log`).

## 3. Avaliar
Responder por escrito: quais dados, quantos titulares, se havia dados de crédito, desde quando e se os dados foram acessados ou só expostos. A trilha de auditoria mostra quem leu ou exportou cada ficha (`targetId`).

## 4. Comunicar
Se houver risco relevante, use o formulário de comunicação de incidente da ANPD e avise os titulares afetados em linguagem clara: o que aconteceu, quais dados, o que fazer e o contato do encarregado.

## 5. Corrigir e registrar
Corrigir a causa raiz, registrar o incidente (data, causa, impacto, medidas, comunicações) e guardar o registro por pelo menos 5 anos.
