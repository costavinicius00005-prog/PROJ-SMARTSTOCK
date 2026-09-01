import Link from "next/link"
import { ArrowLeft, Construction } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ModuleUnavailableContent({ title }: { title: string }) {
  return (
    <div className="grid min-h-full place-items-center bg-[#eef1f6] p-6">
      <Card className="w-full max-w-lg rounded-md border-border bg-card shadow-sm">
        <CardContent className="grid justify-items-center gap-4 p-8 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10">
            <Construction className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#17324d]">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Este modulo ainda nao esta disponivel nesta versao do sistema.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-sm">
            <Link href="/"><ArrowLeft className="size-4" /> Voltar para a visao geral</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
