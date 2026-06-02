# OficinaPro - Sistema de Gestão para Oficinas Mecânicas

Sistema completo para gestão de oficinas mecânicas, inspirado no MotorSW.

## 🚀 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **Supabase** - Autenticação e controle de acesso
- **IndexedDB** - Banco de dados local (offline-first)
- **Bun** - Runtime e gerenciador de pacotes

## 📦 Instalação

```bash
# Usando Bun (recomendado)
bun install

# Usando npm (alternativa)
npm install
```

## ⚙️ Configuração

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie as credenciais para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

3. Crie a tabela `user_presence` no Supabase:

```sql
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY,
  email TEXT,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'active',
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP
);
```

## 🏃 Desenvolvimento

```bash
bun run dev
```

## 📦 Build (Export Estático)

```bash
bun run build
```

O build será gerado na pasta `dist/` e pode ser hospedado em qualquer servidor estático (Vercel, Netlify, GitHub Pages, etc).

## 🎯 Funcionalidades

- ✅ **Ordens de Serviço** - Crie e gerencie OS em 30 segundos
- ✅ **Clientes** - Cadastro completo com veículos
- ✅ **Estoque** - Controle de peças com alerta de baixo estoque
- ✅ **Serviços** - Tabela de serviços com preços
- ✅ **Financeiro** - Receitas, despesas e fluxo de caixa
- ✅ **Notas Fiscais** - NF-e, NFC-e e NFS-e
- ✅ **Relatórios** - Gráficos e estatísticas
- ✅ **Backup/Restore** - Exporte e importe dados JSON
- ✅ **Autenticação** - Login via Supabase
- ✅ **Admin** - Controle de usuários online e assinaturas

## 💾 Banco de Dados Local

Todos os dados são armazenados no **IndexedDB** do navegador, permitindo:
- Funcionamento offline completo
- Independência de mensalidade para dados
- Backup manual via exportação JSON
- Migração entre dispositivos via importação

## 🔐 Autenticação

O Supabase é usado apenas para:
- Controle de acesso (login/cadastro)
- Monitoramento de usuários online
- Gestão de assinaturas e reembolsos

## 📱 Responsivo

Interface adaptada para desktop, tablet e mobile.

## 🎨 Cores (inspiradas no MotorSW)

- **Primary**: #E63946 (Vermelho/Coral)
- **Secondary**: #4FC3F7 (Azul Claro)
- **Background**: #F8FAFC
- **Surface**: #FFFFFF
- **Text**: #1E293B

## 📄 Licença

MIT
