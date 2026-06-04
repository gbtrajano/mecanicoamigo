'use client'

import Link from 'next/link'
import { Wrench, CheckCircle, BarChart3, Package, Receipt, DollarSign, ArrowRight, Clock, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm tracking-wider uppercase mb-4">
                Facilite a rotina do seu negócio
              </p>
              <h1 className="text-4xl lg:text-5xl font-bold text-text leading-tight mb-6">
                Sistema para Gestão de <span className="text-primary">Oficinas Mecânicas</span>
              </h1>
              <p className="text-text-muted text-lg mb-8 leading-relaxed">
                Tenha acesso a recursos feitos especialmente para ajudar na administração de sua oficina automotiva. 
                Atenda mais clientes em menos tempo com um sistema completo para gestão de oficina mecânica.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-primary/20"
                >
                  Começar Agora
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-text-muted">
                  Aprovado por mais de <span className="text-primary font-semibold">10 mil usuários</span>
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-surface rounded-2xl p-6 card-shadow-lg border border-border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Relatórios</p>
                      <p className="text-xs text-text-muted">Acompanhe seu faturamento</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-secondary-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Ordens de Serviço</p>
                      <p className="text-xs text-text-muted">Crie em 30 segundos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-success/5 rounded-lg">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Controle de Estoque</p>
                      <p className="text-xs text-text-muted">Nunca fique sem peças</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              A gestão da sua oficina mecânica<br />mais simples e eficiente
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bg rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Ordem de serviço simplificada</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Crie uma nova ordem de serviço e cadastre seu cliente em 30 segundos. Tudo de forma intuitiva e sem complicação.
              </p>
            </div>
            <div className="bg-bg rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-secondary-dark" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Relatórios gerenciais</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Relatórios que vão te ajudar a tomar melhores decisões para a sua oficina mecânica de um jeito simples e fácil.
              </p>
            </div>
            <div className="bg-bg rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Controle de estoque</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Baixe automaticamente o estoque da peça ao lançar na ordem de serviço e nota fiscal. Controle total do seu inventário.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Finance Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              Gerencie suas finanças de forma<br />simplificada em um único lugar
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Nota fiscal eletrônica</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Você pode emitir notas de produto NF-e, cupom fiscal NFC-e e notas de serviço NFS-e. Tudo integrado ao sistema.
              </p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-secondary-dark" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Fatura eletrônica</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Com nosso sistema você faz tudo em 1 lugar só! Ganhe tempo e dinheiro gerando as faturas eletrônicas e recebendo direto em sua conta.
              </p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Gestão financeira</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Oferece total controle financeiro. Cuide das suas contas a receber e a pagar, visualize o extrato geral e por banco, além do DRE simplificado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 30 Seconds Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text mb-6">
                Realize suas ordens de serviço<br />em <span className="text-primary">30 segundos</span>
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Em apenas 30 segundos, você cadastra um novo cliente, insere os dados do veículo e adiciona os serviços a serem executados. 
                Tudo de forma intuitiva e sem complicação.
              </p>
              <p className="text-text-muted leading-relaxed mb-6">
                Seja para uma revisão, troca de óleo ou reparo mais complexo, o sistema agiliza seu atendimento, 
                reduzindo papelada e aumentando a eficiência da sua oficina.
              </p>
            </div>
            <div className="bg-bg rounded-xl p-6 border border-border">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <div className="h-2 bg-border rounded-full w-full">
                      <div className="h-2 bg-primary rounded-full w-3/4" />
                    </div>
                  </div>
                  <span className="text-sm text-text-muted">30s</span>
                </div>
                <div className="p-4 bg-surface rounded-lg border border-border">
                  <p className="text-xs text-text-muted mb-2">Novo Orçamento</p>
                  <div className="space-y-2">
                    {['Placa', 'Modelo', 'Ano/Modelo', 'Contato', 'Fone'].map((field) => (
                      <div key={field} className="flex items-center gap-2">
                        <span className="text-xs text-text-muted w-20">{field}</span>
                        <div className="flex-1 h-6 bg-bg rounded border border-border" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-text-muted">
            © 2026 MecânicoAmigo. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
