import Link from "next/link"

export const metadata = { title: "Politica de Privacidade - SmartStock" }

/**
 * Politica de privacidade publica (LGPD art. 9 e 14). Os dados do controlador e do encarregado
 * vem das variaveis de ambiente para cada empresa que usa o sistema preencher os seus.
 */
const controller = process.env.PRIVACY_CONTROLLER_NAME ?? "[Razao social da empresa que usa o SmartStock]"
const controllerDoc = process.env.PRIVACY_CONTROLLER_CNPJ ?? "[CNPJ]"
const dpoName = process.env.PRIVACY_DPO_NAME ?? "[Nome do encarregado (DPO)]"
const dpoEmail = process.env.PRIVACY_DPO_EMAIL ?? "[e-mail do encarregado]"
const updatedAt = "25/11/2026"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <article className="mx-auto max-w-3xl space-y-6 rounded-xl border bg-white p-6 shadow-sm sm:p-10">
        <header className="space-y-1">
          <p className="text-sm text-slate-500">SmartStock</p>
          <h1 className="text-2xl font-bold text-slate-900">Politica de Privacidade</h1>
          <p className="text-xs text-slate-500">Atualizada em {updatedAt}</p>
        </header>

        <Section title="1. Quem trata os seus dados">
          <p>
            Controlador: <b>{controller}</b> (CNPJ {controllerDoc}), que usa o SmartStock para vender, entregar e
            controlar o credito dos seus clientes. Encarregado pelo tratamento de dados (DPO): <b>{dpoName}</b>,
            contato <b>{dpoEmail}</b>.
          </p>
        </Section>

        <Section title="2. Quais dados, para que e com qual base legal">
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Cadastro do cliente</b> (nome, CPF/CNPJ, contato, endereco): emitir vendas e comprovantes e fazer entregas. Base: execucao de contrato (art. 7, V).</li>
            <li><b>Dados complementares</b> (RG, nascimento, filiacao, genero): analise de credito no crediario, somente quando informados. Base: protecao do credito (art. 7, X).</li>
            <li><b>Historico de compras e parcelas</b>: cobranca e obrigacoes fiscais e contabeis. Base: obrigacao legal (art. 7, II) e exercicio regular de direitos (art. 7, VI).</li>
            <li><b>Localizacao GPS do entregador</b>: acompanhar a rota durante a entrega. Coletada apenas com a entrega em andamento e eliminada em ate 30 dias. Base: legitimo interesse (art. 7, IX).</li>
            <li><b>Usuarios do sistema</b> (login, IP, horario de acesso): seguranca e auditoria. Base: legitimo interesse e Marco Civil da Internet (art. 15).</li>
          </ul>
          <p>Nao vendemos dados pessoais nem os usamos para publicidade.</p>
        </Section>

        <Section title="3. Por quanto tempo guardamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Vendas, crediario e documentos fiscais: 5 anos apos o ultimo documento (prazo fiscal e contabil).</li>
            <li>Pontos GPS das entregas: 30 dias.</li>
            <li>Registros de acesso e auditoria: 1 ano.</li>
            <li>Sessoes de login encerradas: 90 dias.</li>
          </ul>
          <p>Passados os prazos, os dados sao eliminados ou anonimizados.</p>
        </Section>

        <Section title="4. Seus direitos (art. 18)">
          <p>
            Voce pode pedir confirmacao e acesso aos dados, correcao, anonimizacao, bloqueio ou eliminacao do que for
            desnecessario, portabilidade, informacao sobre compartilhamento e revisao de decisoes. Envie o pedido ao
            encarregado ({dpoEmail}). Respondemos em ate 15 dias. Dados exigidos por lei ficam guardados ate o fim do
            prazo legal, sem uso para outras finalidades.
          </p>
        </Section>

        <Section title="5. Como protegemos">
          <p>
            Acesso so com login e por papel (administrador, financeiro, operador); senhas guardadas com BCrypt; sessoes
            que expiram e podem ser encerradas; conexao HTTPS quando acessado pela internet; CPF e e-mail mascarados nas
            listagens; trilha de auditoria de quem consultou, alterou ou exportou dados pessoais; e eliminacao automatica
            conforme os prazos acima.
          </p>
        </Section>

        <Section title="6. Incidentes">
          <p>
            Se houver incidente de seguranca com risco aos titulares, comunicaremos a ANPD e os afetados conforme a
            Resolucao CD/ANPD n. 15/2024.
          </p>
        </Section>

        <footer className="border-t pt-4 text-sm">
          <Link href="/login" className="text-blue-700 hover:underline">Voltar ao sistema</Link>
        </footer>
      </article>
    </main>
  )
}
