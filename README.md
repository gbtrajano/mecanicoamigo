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
STRIPE_SECRET_KEY=sua-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sua-public-key
STRIPE_WEBHOOK_SECRET=sua-webhook-secret
STRIPE_PRICE_ID=price_...  # ID do preço no Stripe para o plano de R$ 29,99
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Crie as tabelas necessárias no Supabase:

```sql
-- Tabela para presença de usuários e controle de assinatura via ativação manual
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY,
  email TEXT,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'pending',  -- 'pending', 'active', 'past_due', 'canceled'
  activation_key TEXT,  -- Chave de ativação usada (se aplicável)
  activated_at TIMESTAMP,
  subscription_start TIMESTAMP,
  subscription_end TIMESTAMP
);

-- Tabela para chaves de ativação (para vendas no Mercado Livre, etc.)
CREATE TABLE activation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,  -- Chave que o cliente receberá
  status TEXT DEFAULT 'available',  -- 'available', 'used', 'revoked'
  expires_at TIMESTAMP,  -- Data de validade opcional
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

> **Importante**: A tabela `users` já existe por padrão do Supabase Auth e contém os campos `id`, `email`, etc. Nosso sistema adiciona os campos `subscription_status`, `stripe_customer_id` e `stripe_subscription_id` via migrações ou atualizações diretas quando necessário.

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
- ✅ **Assinaturas** - Integração com Stripe para pagamentos recorrentes
- ✅ **Ativação Manual** - Sistema de chaves para vendas externas (Mercado Livre, etc.)

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
- Validação de chaves de ativação

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

## 🔑 Como funciona a ativação manual (para Mercado Livre)

1. Quando você vende uma assinatura no Mercado Livre, gere uma chave única na tabela `activation_keys`
2. Forneça essa chave ao cliente
3. Após o login no sistema, o cliente vai à página de ativação (ou você pode enviar um link direto)
4. Ele insere a chave e clica em "Ativar"
5. O sistema verifica a chave, marca como usada e atualiza:
   - `users.subscription_status` = 'active' (fonte da verdade para o middleware)
   - `user_presence.subscription_status` = 'active' (para consistência interna)
   - Registra qual chave foi usada e quando
6. O cliente terá acesso imediato ao sistema
7. Para renovação, você pode gerar uma nova chave ou orientar o cliente a assinar via Stripe

> **Nota**: Se você atualizar diretamente o `subscription_status` na tabela `users` mas o sistema ainda mostrar como sem assinatura, verifique se o hook de auth está buscando o valor correto. Agora o sistema prioriza a tabela `users` como fonte da verdade para o middleware de proteção de rotas.