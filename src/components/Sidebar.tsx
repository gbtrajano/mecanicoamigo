"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Wrench,
  Package,
  Users,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Receipt,
  Shield,
  Car,
  FileText,
  List,
  User,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servicos", label: "Serviços", icon: List },
  { href: "/ordens", label: "Ordens de Serviço", icon: Wrench },
  { href: "/minhas-ordens", label: "Minhas Ordens", icon: User },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/veiculos", label: "Veículos", icon: Car },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/notas-fiscais", label: "Notas Fiscais", icon: Receipt },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
];

const adminItem = { href: "/admin", label: "Admin", icon: Shield };

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, signOut, isAdmin } = useAuth();

  if (!user) return null;

  return (
    <aside
      className={`bg-surface border-r border-border flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className="h-16 flex items-center justify-center border-b border-border px-4">
        <div
          className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-text">
              Mecânico<span className="text-primary">Amigo</span>
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-muted hover:bg-bg hover:text-text"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href={adminItem.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === adminItem.href
                ? "bg-primary/10 text-primary font-medium"
                : "text-text-muted hover:bg-bg hover:text-text"
            } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? adminItem.label : undefined}
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{adminItem.label}</span>}
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-text-muted hover:bg-bg hover:text-text transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={signOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition-colors mt-1 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
