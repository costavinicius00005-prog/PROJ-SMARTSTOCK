# Arquitetura

Este projeto foi organizado em uma arquitetura hexagonal, separando regras de negocio, casos de uso, adapters e interface.

## Camadas

- `src/domain`: modelos e tipos puros do negocio. Nao conhece React, Next, banco de dados ou componentes visuais.
- `src/application`: casos de uso e portas. Define o que a aplicacao precisa fazer e quais contratos os adapters devem cumprir.
- `src/infrastructure`: adapters concretos. Hoje usa repositórios em memoria com dados mockados; futuramente esta camada pode chamar API, banco ou servicos externos sem alterar dominio e casos de uso.
- `src/composition`: raiz de composicao. Conecta casos de uso com adapters concretos.
- `src/presentation`: hooks e formatadores de tela. Mantem estado e detalhes visuais fora do dominio.
- `components`: componentes React e componentes de UI. Devem consumir casos de uso, hooks e formatadores, sem guardar regra de negocio ou mocks.
- `app`: rotas Next.js. Devem apenas montar layout e tela.

## Regra de Dependencia

As dependencias apontam de fora para dentro:

`app/components -> src/presentation -> src/composition -> src/application -> src/domain`

`src/infrastructure` implementa as portas de `src/application`, mas o dominio nao depende dela.

## Principios Aplicados

- Responsabilidade unica: componentes renderizam, hooks controlam estado de tela, casos de uso coordenam regras e repositorios fornecem dados.
- Inversao de dependencia: casos de uso dependem de portas, nao de adapters concretos.
- Aberto/fechado: trocar mock por API exige criar outro adapter e alterar a composicao, sem reescrever as telas.
- Separacao de concerns: estilos/status visuais ficam em formatadores de apresentacao, nao no dominio.
