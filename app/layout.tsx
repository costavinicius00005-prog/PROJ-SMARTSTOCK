import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SmartStock - Sistema de Gestao Empresarial',
  description: 'Sistema ERP completo para gestao empresarial: vendas, estoque, financeiro, fiscal e contabilidade.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
