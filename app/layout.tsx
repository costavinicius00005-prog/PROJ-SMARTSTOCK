import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/auth-context'
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
